import { Component, CSSProperties } from 'react';
import { message, Spin, Typography } from 'antd';
import { inject, observer } from 'mobx-react';

import {
  findMetaUuidOfStatement,
  getStatementHistoryInfo,
  retrospectStatementHistories,
} from '../../services/method';
import { createHighlightMap } from '../../utils/methodTrace';
import RetrospectSearch from './components/RetrospectSearch';
import UserStore from '@/models/userStore';
import './styles.css';
import BugMarkPlugin from '../FileDiffViewer/plugin/BugMarkPlugin';
import RetrospectedMarkPlugin from '../FileDiffViewer/plugin/RetrospectedMarkPlugin';
import { IssueItem } from '@/models/issueStore';
import FileDiffViewer from '../FileDiffViewer';
import {
  compressLineRange,
  expandLineRange,
  LineRange,
  mergeLineRange,
} from '@/utils/line-range';
import { getLanguage } from '@/utils/conversion';
import MemoCommitTitle from './components/MemoCommitTitle';
import TipsModal from '../TipsModal';

interface IProps {
  style?: CSSProperties;
  // language?: string;
  initialStatementUuidsMethodMap: Map<string, string[]>;
  issueListCommitMap: Map<string, IssueItem[]>;
  // file diff
  repoUuid?: string;
  currentCommitId: string;
  previousCommitId: string;
  comparable: boolean;
  left?: API.CommitCodeInfoTitle;
  right?: API.CommitCodeInfoTitle;
  // filePath?: string;
  userStore?: UserStore;
  loading?: boolean;
  onCommitClick?: (commitId: string, changeStatus: string) => void;
  onRetrospectDidFinish?: (list: API.RetrospectResult[]) => void;
}

export type StatementInfoItem = {
  begin: number;
  end: number;
  code: string;
};

interface IState {
  retrospecting: boolean;
  selectedLinesInRangeList: StatementInfoItem[][];
  selectedCommitId: string;
  // 全局追溯数据映射到文件
  highlightRetrospectedCommitMap: Map<string, number[]>;
}

const reduceIssueLineRange = (acc: LineRange[], issue: IssueItem) => {
  // console.log(issue);
  if (issue.lines.length <= 0) return acc;
  const sortedLines = issue.lines.slice().sort((a, b) => a - b);
  acc.push({
    start: sortedLines[0],
    end: Math.max(sortedLines[sortedLines.length - 1], sortedLines[0] + 1),
  });
  return acc;
};

@inject('userStore')
@observer
class FileRetrospectViewer extends Component<IProps, IState> {
  diffViewers: (FileDiffViewer | null)[];
  constructor(props: IProps) {
    super(props);
    this.state = {
      retrospecting: false,
      selectedLinesInRangeList: [],
      selectedCommitId: '',
      highlightRetrospectedCommitMap: new Map(),
    };
    this.diffViewers = [];
  }

  onRetrospect = () => {
    // this.state.highlightInfoLinesMethodMap.forEach(
    //   (statementInfoList, metaUuid) => {
    //     const sortedList = statementInfoList.sort(
    //       ({ begin: a }, { begin: b }) => a - b,
    //     );
    //     datas.push({
    //       metaUuid,
    //       currentCommitId: this.state.selectedCommitId,
    //       statementInfoList: [
    //         {
    //           begin: sortedList[0].begin,
    //           end: sortedList[sortedList.length - 1].end,
    //           code: sortedList.map(({ code }) => code).join('\n'),
    //         },
    //       ],
    //     });
    //   },
    // );
    const { repoUuid, currentCommitId, right, left } = this.props;
    if (
      repoUuid === undefined ||
      (right?.filePath === undefined && left?.filePath === undefined)
    ) {
      message.warn('repoUuid / filePath 不存在，不能进行追溯');
      return;
    }
    const { selectedLinesInRangeList } = this.state;
    const selectedLines = selectedLinesInRangeList.flat();
    const sortedList = selectedLines.sort(
      ({ begin: a }, { begin: b }) => a - b,
    );
    findMetaUuidOfStatement(
      {
        repoUuid,
        commitId: currentCommitId,
        filePath: right?.filePath ?? left?.filePath,
        locations: sortedList,
      },
      this.props.userStore?.userToken,
    ).then((resp) => {
      if (resp !== null && typeof resp !== 'boolean') {
        const datas: {
          // metaUuid: string;
          currentCommitId: string;
          statementUuidList?: string[];
        }[] = [
          {
            // metaUuid: metaUuid,
            currentCommitId: this.state.selectedCommitId,
            statementUuidList: resp,
            // statementInfoList: [
            //   {
            //     begin: sortedList[0].begin,
            //     end: sortedList[sortedList.length - 1].end,
            //     code: sortedList.map(({ code }) => code).join('\n'),
            //   },
            // ],
          },
        ];
        this.restrospect(datas);
      }
    });
  };
  onRetrospectClear = () => {
    this.setState({
      highlightRetrospectedCommitMap: new Map(),
      selectedLinesInRangeList: [],
    });
    this.props.onRetrospectDidFinish?.([]);
    this.diffViewers.forEach((diffViewer) => diffViewer?.clearSelectLines());
  };

  restrospect = (
    datas: {
      // metaUuid: string;
      currentCommitId: string;
      // statementInfoList?: any[] | undefined;
      statementUuidList?: string[];
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
          // metaUuid: data.metaUuid,
          statementHistories: result ?? [],
        })),
      ),
    ).then((promiseResults) => {
      let statementResultList: API.RetrospectResult[] = [];
      promiseResults.forEach(({ statementHistories }) => {
        if (typeof statementHistories === 'boolean') return;
        statementResultList = statementResultList.concat(statementHistories);
      });
      const highlightRetrospectedCommitMap = createHighlightMap(
        statementResultList,
      );

      if (
        statementResultList.reduce((acc, item) => {
          return acc.concat(item.histories ?? []);
        }, [] as any[]).length === 0
      ) {
        message.error('查询不到追溯历史');
      }
      this.props.onRetrospectDidFinish?.(statementResultList);
      this.setState({
        highlightRetrospectedCommitMap,
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
        // metaUuid: string;
        currentCommitId: string;
        statementUuidList?: string[] | undefined;
      }[] = [];
      this.props.initialStatementUuidsMethodMap.forEach((statementUuidList) => {
        // statementUuidList.forEach((metaUuid) => {
        datas.push({
          // metaUuid,
          currentCommitId: this.props.currentCommitId,
          statementUuidList,
        });
        // });
      });
      if (datas.length > 0) this.restrospect(datas);
    }
  }

  componentWillUnmount() {
    this.setState({
      retrospecting: false,
      selectedLinesInRangeList: [],
      highlightRetrospectedCommitMap: new Map(),
    });
  }
  onSelect = (idx: number) => (
    arr: { begin: number; end: number; code: string }[],
    selectedCommitId: string,
  ) => {
    const { selectedLinesInRangeList } = this.state;
    selectedLinesInRangeList[idx] = arr;
    this.setState({
      selectedLinesInRangeList: selectedLinesInRangeList,
      selectedCommitId,
    });
  };

  onLineNumberDoubleClickToShowTip = async (
    line: { begin: number; end: number; code: string },
    selectedCommitId: string,
    filePath: string,
  ) => {
    const { repoUuid } = this.props;
    let resp: any = {
      firstCommitDate: '未获取到数据',
      lifecycle: -1,
      body: line.code,
    };
    if (repoUuid === undefined) {
      message.warn('repoUuid 不存在，不能获取语句历史数据');
    } else {
      const foundMetaUuid = await findMetaUuidOfStatement(
        {
          repoUuid,
          commitId: selectedCommitId,
          filePath,
          locations: [line],
        },
        this.props.userStore?.userToken,
      );
      if (foundMetaUuid !== null && typeof foundMetaUuid !== 'boolean') {
        foundMetaUuid.some((data) => data === '')
          ? (resp = await getStatementHistoryInfo(
              {
                metaUuid: foundMetaUuid[0],
                currentCommitId: selectedCommitId,
                // statementInfoList: [line],
              },
              this.props.userStore?.userToken,
            ))
          : (resp = {
              firstCommitDate: '未获取到数据',
              lifecycle: -1,
              body: line.code,
            });
      }
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

  renderTitle = (title: any) => <MemoCommitTitle {...title} level="file" />;

  render() {
    const {
      left,
      right,
      issueListCommitMap,
      currentCommitId,
      previousCommitId,
      repoUuid,
      comparable,
    } = this.props;
    const {
      selectedLinesInRangeList,
      retrospecting,
      highlightRetrospectedCommitMap,
    } = this.state;
    /**
     * 以右边（当前）的版本为基准
     * 若右边没有（可能是删除的情况），则选左边（之前）版本
     * 若左边也没有，则设为 undefined
     *  */
    const filePath = right?.filePath ?? left?.filePath ?? undefined;
    const displayFileViewer = repoUuid !== undefined && filePath !== undefined;
    let language: string = 'java';
    let prevIssues: IssueItem[];
    let currIssues: IssueItem[];
    let prelineRangeList;
    let curlineRangeList;
    let mergeLineRangeList: LineRange[] = [];
    let prevRetrospected: number[] = [];
    let currRetrospected: number[] = [];
    if (displayFileViewer) {
      language = getLanguage(filePath ?? 'a.java');
      prevIssues = issueListCommitMap.get(previousCommitId) ?? [];
      currIssues = issueListCommitMap.get(currentCommitId) ?? [];
      prelineRangeList = prevIssues
        .reduce(reduceIssueLineRange, [])
        .map(expandLineRange)
        .sort(({ start: a }, { start: b }) => a - b);
      curlineRangeList = currIssues
        .reduce(reduceIssueLineRange, [])
        .map(expandLineRange)
        .sort(({ start: a }, { start: b }) => a - b);
      mergeLineRangeList = compressLineRange(
        mergeLineRange(prelineRangeList, curlineRangeList),
        10,
      );
      prevRetrospected =
        highlightRetrospectedCommitMap.get(previousCommitId) ?? [];
      currRetrospected =
        highlightRetrospectedCommitMap.get(currentCommitId) ?? [];
    }
    return (
      <div className="retrospect-viewer" style={this.props.style}>
        {this.props.loading ? (
          <div style={{ margin: '20px', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <>
            <TipsModal />
            <RetrospectSearch
              loading={retrospecting}
              loadingLines={selectedLinesInRangeList.length}
              onRetrospect={this.onRetrospect}
              onClear={this.onRetrospectClear}
            />
            {displayFileViewer ? (
              <>
                {mergeLineRangeList.length > 0 ? (
                  mergeLineRangeList.map((initialLineRange, index) => (
                    <div
                      style={{
                        maxWidth: '100vw',
                        width: '100vw',
                        overflow: 'auto',
                      }}
                      key={index}
                    >
                      <FileDiffViewer
                        ref={(ref) => (this.diffViewers[index] = ref)}
                        id={`s${initialLineRange.start}e${initialLineRange.end}-${index}`}
                        language={language}
                        repoUuid={repoUuid as string}
                        left={
                          left === undefined
                            ? undefined
                            : {
                                ...left,
                                commitId: previousCommitId,
                                filePath: left?.filePath as string,
                              }
                        }
                        right={{
                          ...right,
                          commitId: currentCommitId,
                          filePath: right?.filePath as string,
                        }}
                        renderTitle={this.renderTitle}
                        initialLines={initialLineRange}
                        plugins={[
                          new BugMarkPlugin({
                            left: prevIssues,
                            right: currIssues,
                          }),
                          new RetrospectedMarkPlugin({
                            left: prevRetrospected,
                            right: currRetrospected,
                          }),
                        ]}
                        select={{
                          multiple: false,
                          useShift: true,
                          onSelect: this.onSelect(index),
                        }}
                        onLineNumberDoubleClickToShowTip={
                          this.onLineNumberDoubleClickToShowTip
                        }
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <FileDiffViewer
                      id="file"
                      language={language}
                      repoUuid={repoUuid as string}
                      left={
                        left === undefined
                          ? undefined
                          : {
                              ...left,
                              commitId: previousCommitId,
                              filePath: left?.filePath as string,
                            }
                      }
                      right={{
                        ...right,
                        commitId: currentCommitId,
                        filePath: right?.filePath as string,
                      }}
                      renderTitle={this.renderTitle}
                      plugins={[
                        new RetrospectedMarkPlugin({
                          left: prevRetrospected,
                          right: currRetrospected,
                        }),
                      ]}
                      select={{
                        multiple: false,
                        useShift: true,
                        onSelect: this.onSelect(0),
                      }}
                      onLineNumberDoubleClickToShowTip={
                        this.onLineNumberDoubleClickToShowTip
                      }
                    />
                  </>
                )}
              </>
            ) : comparable ? (
              previousCommitId && currentCommitId ? (
                <div style={{ textAlign: 'center', fontSize: 18 }}>
                  <p>缺少 filePath 不能展示代码</p>
                  <p>repoUuid: {repoUuid}</p>
                  <p>
                    commitId: left: {previousCommitId} | right:{' '}
                    {currentCommitId}
                  </p>
                  <p>
                    filePath: left: {left?.filePath ?? '?'} | right:{' '}
                    {right?.filePath ?? '?'}
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', fontSize: 18 }}>
                  <p>请选择两个或以上个节点来查看代码差异</p>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', fontSize: 18 }}>
                <p>代码提交版本都已解决，无法进行比较</p>
                <p>请选择其他节点！</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
}

export default FileRetrospectViewer;
