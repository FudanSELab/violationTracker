import { Component, CSSProperties } from 'react';
import { message, Spin, Typography } from 'antd';
import { inject, observer } from 'mobx-react';

import {
  getStatementHistoryInfo,
  retrospectStatementHistories,
} from '../../services/method';
import { createHighlightMap } from '../../utils/methodTrace';
import RetrospectSearch from './components/RetrospectSearch';
import ITWDiffViewer from '../ITWDiffViewer';
import UserStore from '@/models/userStore';
import { BugLineType, LINK_METHOD_TAG } from '@/models/metaStore';
import './styles.css';

interface IProps {
  style?: CSSProperties;
  level: API.TLevel;
  language?: string;
  lefts?: API.CommitCodeInfo[];
  rights?: API.CommitCodeInfo[];
  initialStatementUuidsMethodMap: Map<string, string[]>;
  bugLinesCommitMethodMap?: Map<string, Map<string, BugLineType>>; // commitId -> bug 行的映射
  currentCommitId: string;
  uuids: string[];
  userStore?: UserStore;
  loading?: boolean;
  onCommitClick?: (commitId: string, changeStatus: string) => void;
  onRetrospectDidFinish?: (list: API.RetrospectResult[]) => void;
}

type StatementInfoItem = {
  begin: number;
  end: number;
  code: string;
};

type MethodView = { left?: API.CommitCodeInfo; right?: API.CommitCodeInfo };

interface IState {
  retrospecting: boolean;
  highlightInfoLinesMethodMap: Map<
    string, // metaUuid
    StatementInfoItem[] // statementInfoList
  >; // 方法 -> 选中行的映射
  selectedCommitId: string;
  highlightCommitMapMethodMap: Map<string, Map<string, number[]>>; // 方法 -> commitId -> 追踪到的行的映射
}

@inject('userStore')
@observer
class MethodRetrospectViewer extends Component<IProps, IState> {
  diffViewers: (ITWDiffViewer | null)[];
  constructor(props: IProps) {
    super(props);
    this.state = {
      retrospecting: false,
      highlightInfoLinesMethodMap: new Map<string, StatementInfoItem[]>(),
      selectedCommitId: '',
      highlightCommitMapMethodMap: new Map<string, Map<string, number[]>>(),
    };
    this.diffViewers = [];
  }

  onRetrospect = () => {
    const datas: {
      metaUuid: string;
      currentCommitId: string;
      statementInfoList: any[];
    }[] = [];
    this.state.highlightInfoLinesMethodMap.forEach(
      (statementInfoList, metaUuid) => {
        const sortedList = statementInfoList.sort(
          ({ begin: a }, { begin: b }) => a - b,
        );
        datas.push({
          metaUuid,
          currentCommitId: this.state.selectedCommitId,
          statementInfoList: [
            {
              begin: sortedList[0].begin,
              end: sortedList[sortedList.length - 1].end,
              code: sortedList.map(({ code }) => code).join('\n'),
            },
          ],
        });
      },
    );
    this.restrospect(datas);
  };
  onRetrospectClear = () => {
    this.setState({
      highlightCommitMapMethodMap: new Map<string, Map<string, number[]>>(),
      highlightInfoLinesMethodMap: new Map<string, StatementInfoItem[]>(),
    });
    this.props.onRetrospectDidFinish?.([]);
    this.diffViewers.forEach((diffViewer) => diffViewer?.clearSelectLines());
  };

  restrospect = (
    datas: {
      metaUuid: string;
      currentCommitId: string;
      statementInfoList?: any[] | undefined;
      statementUuidList?: string[] | undefined;
    }[],
  ) => {
    this.setState({ retrospecting: true });
    if (this.props.userStore?.userToken === undefined) {
      return;
    }
    Promise.all(
      datas.map((data) =>
        retrospectStatementHistories(
          data,
          this.props.userStore?.userToken ?? '',
        ).then((result) => ({
          metaUuid: data.metaUuid,
          statementHistories: result ?? [],
        })),
      ),
    ).then((promiseResults) => {
      const highlightCommitMapMethodMap = new Map<
        string,
        Map<string, number[]>
      >();
      let statementResultList: API.RetrospectResult[] = [];
      promiseResults.forEach(({ metaUuid, statementHistories }) => {
        if (typeof statementHistories === 'boolean') return;
        highlightCommitMapMethodMap.set(
          metaUuid,
          createHighlightMap(statementHistories),
        );
        statementResultList = statementResultList.concat(statementHistories);
      });
      if (
        statementResultList.reduce((acc, item) => {
          return acc.concat(item.histories ?? []);
        }, [] as any[]).length === 0
      ) {
        message.error('查询不到追溯历史');
      }
      this.props.onRetrospectDidFinish?.(statementResultList);
      this.setState({
        highlightCommitMapMethodMap,
        retrospecting: false,
      });
    });
  };

  getMapArrayLength(map: Map<String, any[]>) {
    let result = 0;
    map.forEach((v) => {
      result += v.length;
    });
    return result;
  }

  componentDidMount() {
    if (this.props.initialStatementUuidsMethodMap) {
      const datas: {
        metaUuid: string;
        statementUuidList: string[];
        currentCommitId: string;
      }[] = [];
      this.props.initialStatementUuidsMethodMap.forEach(
        (statementUuidList, metaUuid) => {
          datas.push({
            metaUuid,
            statementUuidList,
            currentCommitId: this.props.currentCommitId,
          });
        },
      );
      if (datas.length > 0) this.restrospect(datas);
    }
  }

  componentWillUnmount() {
    this.setState({
      retrospecting: false,
      highlightInfoLinesMethodMap: new Map<string, StatementInfoItem[]>(),
      highlightCommitMapMethodMap: new Map<string, Map<string, number[]>>(),
    });
  }

  createMethodListForFile(
    lefts: API.CommitCodeInfo[],
    rights: API.CommitCodeInfo[],
    level: API.TLevel,
  ) {
    // 对于文件，将所有获得的 lefts 和 rights 都链接起来显示
    const methodListForFile: any[] = [];
    if (level === 'file') {
      const methodMapForFile = new Map(
        lefts.map((value: API.CommitCodeInfo): [string, MethodView] => {
          return [value.metaUuid, { left: value }];
        }),
      );
      const rightMap = new Map(
        rights.map((value: API.CommitCodeInfo): [
          string,
          API.CommitCodeInfo,
        ] => {
          return [value.metaUuid, value];
        }),
      );
      rightMap.forEach((value, key) => {
        if (methodMapForFile.has(key)) {
          const methodForFile = methodMapForFile.get(key) as MethodView;
          methodForFile.right = value;
          methodListForFile.push(methodForFile);
        } else {
          methodListForFile.push({ right: value });
        }
      });
      // this.setState({ methodListForFile });
    }
    return methodListForFile;
  }

  onSelect = (
    highlightInfoLinesMethodMap: Map<string, StatementInfoItem[]>,
    metaUuid: string,
  ) => (
    arr: { begin: number; end: number; code: string }[],
    selectedCommitId: string,
  ) => {
    if (!highlightInfoLinesMethodMap.has(metaUuid)) {
      highlightInfoLinesMethodMap.set(metaUuid, []);
    }
    highlightInfoLinesMethodMap.set(metaUuid, arr);
    this.setState({
      highlightInfoLinesMethodMap: new Map(highlightInfoLinesMethodMap),
      selectedCommitId,
    });
  };

  onLineNumberDoubleClickToShowTip = (metaUuid: string) => async (
    line: { begin: number; end: number; code: string },
    selectedCommitId: string,
  ) => {
    // console.log(line, selectedCommitId, metaUuid);
    let resp = await getStatementHistoryInfo(
      {
        metaUuid,
        currentCommitId: selectedCommitId,
        statementInfoList: [line],
      },
      this.props.userStore?.userToken,
    );
    if (typeof resp === 'boolean' || resp === null) {
      resp = {
        firstCommitDate: '未获取到数据',
        lifecycle: -1,
        body: line.code,
      };
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 'max-content',
        }}
      >
        <p>
          首次引入时间：
          <Typography.Text>{resp.firstCommitDate}</Typography.Text>
        </p>
        <p>
          已存续时间（天）：<Typography.Text>{resp.lifecycle}</Typography.Text>
          <span style={{ marginLeft: 10 }}>行数：{line.begin}</span>
        </p>
        <p>
          <Typography.Paragraph
            style={{
              margin: 0,
              maxHeight: '170px',
              maxWidth: '550px',
              overflow: 'auto',
            }}
          >
            <pre style={{ whiteSpace: 'pre' }}>
              {(resp.body ?? '').trim().replace(/\t/g, ' ')}
            </pre>
          </Typography.Paragraph>
        </p>
      </div>
    );
  };

  render() {
    const {
      language,
      lefts,
      rights,
      level,
      bugLinesCommitMethodMap,
    } = this.props;
    const {
      highlightInfoLinesMethodMap,
      retrospecting,
      highlightCommitMapMethodMap,
    } = this.state;
    const methodListForFile = this.createMethodListForFile(
      lefts ?? [],
      rights ?? [],
      level,
    );
    return (
      <div className="retrospect-viewer" style={this.props.style}>
        {this.props.loading ? (
          <div style={{ margin: '20px', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <>
            <RetrospectSearch
              loading={retrospecting}
              loadingLines={this.getMapArrayLength(highlightInfoLinesMethodMap)}
              onRetrospect={this.onRetrospect}
              onClear={this.onRetrospectClear}
            />
            <div style={{ maxWidth: '100vw', overflow: 'auto' }}>
              {this.props.level === 'method' || this.props.level === 'field'
                ? this.props.uuids.map((uuid, index) => {
                    const left = lefts?.filter(
                      ({ metaUuid }) => metaUuid === uuid,
                    )[0];
                    const right = rights?.filter(
                      ({ metaUuid }) => metaUuid === uuid,
                    )[0];
                    const leftBugLinesCommitMap = left
                      ? bugLinesCommitMethodMap?.get(
                          `${left.filePath}${LINK_METHOD_TAG}${left.signature}`,
                        )
                      : new Map();
                    const rightBugLinesCommitMap = right
                      ? bugLinesCommitMethodMap?.get(
                          `${right.filePath}${LINK_METHOD_TAG}${right.signature}`,
                        )
                      : new Map();
                    return !left && !right ? (
                      <p
                        style={{ textAlign: 'center' }}
                        key={`metaUuid-${uuid}-${index}`}
                      >
                        找不到方法 {uuid} 对应的源代码
                      </p>
                    ) : left?.changeStatus === 'NOTADDED' &&
                      right?.changeStatus === 'NOTADDED' ? (
                      <p
                        style={{ textAlign: 'center' }}
                        key={`metaUuid-${uuid}-${index}`}
                      >
                        方法 {left.signature} 在本次比较 Commit 中还未添加
                      </p>
                    ) : left?.changeStatus.includes('DELETE') &&
                      right?.changeStatus.includes('DELETE') ? (
                      <p
                        style={{ textAlign: 'center' }}
                        key={`metaUuid-${uuid}-${index}`}
                      >
                        方法 {left.signature} 在本次比较 Commit 中已删除
                      </p>
                    ) : (
                      <ITWDiffViewer
                        ref={(ref) => (this.diffViewers[index] = ref)}
                        level={level}
                        key={`metaUuid-${uuid}-${index}`}
                        id={uuid}
                        language={language ?? ''}
                        left={left}
                        right={right}
                        leftHighlightBugLinesCommitMap={leftBugLinesCommitMap}
                        rightHighlightBugLinesCommitMap={rightBugLinesCommitMap}
                        highlightRetrospectedLinesCommitMap={
                          highlightCommitMapMethodMap.get(uuid) ??
                          new Map<string, number[]>()
                        }
                        select={{
                          multiple: false,
                          useShift: true,
                          onSelect: this.onSelect(
                            highlightInfoLinesMethodMap,
                            uuid,
                          ),
                        }}
                        onLineNumberDoubleClickToShowTip={this.onLineNumberDoubleClickToShowTip(
                          uuid,
                        )}
                      />
                    );
                  })
                : this.props.level === 'file'
                ? methodListForFile.map(
                    ({ left, right, filePath, signature }, index) => {
                      const metaUuid = (left?.metaUuid ??
                        right?.metaUuid) as string;
                      const highlightBugLinesCommitMap = bugLinesCommitMethodMap?.get(
                        `${filePath}${LINK_METHOD_TAG}${signature}`,
                      );
                      return !left && !right ? (
                        <p
                          style={{ textAlign: 'center' }}
                          key={`metaUuid-${metaUuid}-${index}`}
                        >
                          找不到文件 {filePath} 对应的源代码
                        </p>
                      ) : left?.changeStatus === 'NOTADDED' &&
                        right?.changeStatus === 'NOTADDED' ? (
                        <p
                          style={{ textAlign: 'center' }}
                          key={`metaUuid-${metaUuid}-${index}`}
                        >
                          文件 {filePath} 在本次比较 Commit 中还未添加
                        </p>
                      ) : left?.changeStatus === 'DELETED' &&
                        right?.changeStatus === 'DELETED' ? (
                        <p
                          style={{ textAlign: 'center' }}
                          key={`metaUuid-${metaUuid}-${index}`}
                        >
                          文件 ${filePath} 在本次比较 Commit 中已删除
                        </p>
                      ) : (
                        <ITWDiffViewer
                          ref={(ref) => (this.diffViewers[index] = ref)}
                          level={level}
                          // key={metaUuid + index}
                          key={`metaUuid-${metaUuid}-${index}`}
                          id={metaUuid}
                          language={language ?? ''}
                          left={left}
                          right={right}
                          leftHighlightBugLinesCommitMap={
                            highlightBugLinesCommitMap
                          }
                          rightHighlightBugLinesCommitMap={
                            highlightBugLinesCommitMap
                          }
                          highlightRetrospectedLinesCommitMap={
                            highlightCommitMapMethodMap.get(metaUuid) ??
                            new Map<string, number[]>()
                          }
                          select={{
                            multiple: false,
                            useShift: true,
                            onSelect: this.onSelect(
                              highlightInfoLinesMethodMap,
                              metaUuid,
                            ),
                          }}
                          onLineNumberDoubleClickToShowTip={this.onLineNumberDoubleClickToShowTip(
                            metaUuid,
                          )}
                        />
                      );
                    },
                  )
                : null}
            </div>
          </>
        )}
      </div>
    );
  }
}

export default MethodRetrospectViewer;
