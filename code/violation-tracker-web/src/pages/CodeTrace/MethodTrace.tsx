import { Component } from 'react';

import './styles.css';
import { getMethodDiffData } from '../../services/method';
import MetaCard from './components/MetaCard';
import BackButton from '../../components/BackButton';
import { inject, observer } from 'mobx-react';
import MetaStore from '../../models/metaStore';
import { Card, Result, Spin, Checkbox, Drawer, Button } from 'antd';
import { parse } from 'query-string';
import UserStore from '@/models/userStore';
import ProjectStore from '@/models/projectStore';
import HistoryContext from '../historyContext';
import MethodRetrospectViewer from '@/components/RetrospectViewer/MethodRetrospectViewer';
import { BranchesOutlined } from '@ant-design/icons';
import { getParents } from '@/components/GitGraph/utils';
import GitGraph from '@/components/GitGraph';
import GitGraphLegend from '@/components/GitGraph/legend';

interface IState {
  gitVisible: boolean;
  graphRecommend: boolean;
  graphAll: boolean;
  watchedCommitIds?: string[];
  currentGraphPage: number;
  commitTotalTimes: number;
  diff?: {
    language: string;
    left: API.CommitCodeInfo[];
    right: API.CommitCodeInfo[];
  };
  issueType?: string;
  loading: boolean;
  diffLoading: boolean;
  meta_uuids: string[];
  level: API.TLevel;
  retrospectCommitList: string[];
  showUnchanged: boolean;
}

interface IProps {
  metaStore: MetaStore;
  userStore: UserStore;
  projectStore: ProjectStore;
}
interface IHistorySearch {
  level?: string;
  meta_uuid?: string;
  type?: string;
  issue_uuid?: string;
  issue_type?: string;
  repo_uuid?: string;
}

@inject('metaStore')
@inject('userStore')
@inject('projectStore')
@observer
export default class MethodTrace extends Component<IProps, IState> {
  static contextType = HistoryContext;
  constructor(props: IProps) {
    super(props);
    this.state = {
      gitVisible: false,
      graphRecommend: true,
      graphAll: false,
      watchedCommitIds: [],
      currentGraphPage: 1,
      commitTotalTimes: 0,
      diff: undefined,
      loading: false,
      diffLoading: false,
      meta_uuids: [],
      level: 'method',
      retrospectCommitList: [],
      showUnchanged: false,
    };
  }

  componentDidMount() {
    if (this.props.projectStore.projects === undefined) {
      this.props.projectStore.getProjects();
    }
    const historySearch = (parse(
      this.context.location.search,
    ) as unknown) as IHistorySearch;
    this.setState({
      meta_uuids: ((historySearch.meta_uuid ?? '') as string).split(
        ',',
      ) as string[],
      level: (historySearch.level ?? 'method') as API.TLevel,
      issueType: historySearch.issue_type,
      showUnchanged: historySearch.level !== 'file',
    });
    this.getInitialGraph();
  }

  componentWillUnmount() {
    // 清除缓存
    this.props.metaStore.clear();
  }

  getInitialGraph = () => {
    this.setState({
      loading: true,
    });
    const historySearch = (parse(
      this.context.location.search,
    ) as unknown) as IHistorySearch;
    this.props.metaStore
      .fetchMetaInfoAndCommitInfoAndIssueLocation(
        {
          ...historySearch,
          page: this.state.currentGraphPage,
          show_all: this.state.graphAll,
        } as any,
        this.props.userStore.userToken,
      )
      .then(() => {
        if (
          Array.isArray(this.props.metaStore.methodInfos) &&
          this.props.metaStore.methodInfos.length > 0
        ) {
          this.setState({
            level: this.props.metaStore.methodInfos.reduce((acc, { level }) => {
              if (level.toLowerCase() === 'method') {
                return 'method' as API.TLevel;
              }
              return acc;
            }, 'field' as API.TLevel),
            meta_uuids: this.props.metaStore.methodInfos.map(
              ({ metaUuid }) => metaUuid,
            ),
          });
        }
        let currentCommitId = '',
          lastCommitId = '';
        if (this.props.metaStore.historyCommitGraph.nodes.length > 0) {
          currentCommitId =
            this.props.metaStore.historyCommitGraph.nodes[0].commitId ?? '';
          lastCommitId =
            getParents(
              this.props.metaStore.historyCommitGraph.edges,
              currentCommitId,
            )[0] ?? '';
        }
        this.setState(
          {
            loading: false,
            commitTotalTimes: this.props.metaStore.commitTotalTimes,
            watchedCommitIds:
              currentCommitId === '' && lastCommitId === ''
                ? []
                : [currentCommitId, lastCommitId],
          },
          () => this.getCodeInfoByCommitId(),
        );
      })
      .catch((err) => console.error(err));
  };

  getMoreGraph = () => {
    const { currentGraphPage } = this.state;
    const historySearch = (parse(
      this.context.location.search,
    ) as unknown) as IHistorySearch;
    this.props.metaStore
      .fetchMetaInfoAndCommitInfoAndIssueLocation(
        {
          ...historySearch,
          page: currentGraphPage + 1,
          show_all: this.state.graphAll,
        } as any,
        this.props.userStore.userToken,
      )
      .then(() => {
        this.setState({
          currentGraphPage: currentGraphPage + 1,
        });
      });
  };

  getCodeInfoByCommitId = () => {
    // 获取文件方法历史
    const { meta_uuids, level, showUnchanged, watchedCommitIds } = this.state;
    if (watchedCommitIds === undefined || watchedCommitIds.length < 2) return;
    const [currentCommitId, lastCommitId] = watchedCommitIds;
    const currentCommitInfo = this.props.metaStore.historyCommitGraph.nodes.find(
      ({ commitId }) => commitId === currentCommitId,
    );
    const lastCommitInfo = this.props.metaStore.historyCommitGraph.nodes.find(
      ({ commitId }) => commitId === lastCommitId,
    );
    this.setState({ diff: undefined, diffLoading: true });
    getMethodDiffData(
      meta_uuids,
      level,
      lastCommitId,
      currentCommitId,
      showUnchanged,
    )
      .then((diff) => {
        this.setState({ diffLoading: false });
        if (typeof diff !== 'boolean' && diff) {
          // if (level === 'file') {
          diff?.right?.forEach((r) => {
            r.commitId = currentCommitId;
            r.committer = currentCommitInfo?.committer ?? '';
            r.date = currentCommitInfo?.commitTime ?? '';
          });
          diff?.left?.forEach((l) => {
            l.commitId = lastCommitId ?? '';
            l.committer = lastCommitInfo?.committer ?? '';
            l.date = lastCommitInfo?.commitTime ?? '';
          });
          // }
          this.setState({ diff });
        } else throw new Error('获取文件方法历史失败');
      })
      .catch((err: Error) => {
        console.error(err.message);
      });
  };

  onRetrospectDidFinish = (list: API.RetrospectResult[]) => {
    this.setState({
      retrospectCommitList: list.reduce((acc, item) => {
        return acc.concat(item.histories.map(({ commitId }) => commitId));
      }, [] as string[]),
    });
  };

  render() {
    const {
      gitVisible,
      graphAll,
      graphRecommend,
      watchedCommitIds,
      commitTotalTimes,
      diff,
      diffLoading,
      loading,
      issueType,
      level,
      meta_uuids,
      retrospectCommitList,
      showUnchanged,
    } = this.state;
    const methodMeta = this.props.metaStore.meta;
    const bugLinesCommitMethodMap = this.props.metaStore
      .bugLinesCommitMethodMap;
    const displayDiff =
      watchedCommitIds &&
      watchedCommitIds.length === 2 &&
      this.props.metaStore.commitTotalTimes > 0;
    const historySearch = (parse(
      this.context.location.search,
    ) as unknown) as IHistorySearch;
    const repoName =
      this.props.projectStore.repoList.find(
        ({ repo_id }) => repo_id === historySearch.repo_uuid,
      )?.name ?? '未知库';
    const projectName = historySearch.repo_uuid
      ? this.props.projectStore.getProjectByRepoUuid(historySearch.repo_uuid) ??
        '未知项目'
      : '未知项目';
    return (
      <div id="meta-trace">
        <div className="issloca">
          <div className="input">
            <BackButton />
            <div>
              方法追溯（{repoName} / {projectName}）
            </div>
          </div>
        </div>
        <div
          className="git-graph-trigger"
          onClick={() => {
            this.setState({ gitVisible: true });
          }}
        >
          <BranchesOutlined style={{ fontSize: '15pt' }} />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <Spin />
          </div>
        ) : (
          <>
            <Drawer
              title={
                <>
                  <p
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    追溯链
                    <GitGraphLegend />
                  </p>
                  <div style={{ textAlign: 'right' }}>
                    <Checkbox
                      checked={graphAll}
                      style={{ fontWeight: 'normal' }}
                      onChange={() => {
                        this.setState(
                          {
                            graphAll: !graphAll,
                            currentGraphPage: 1,
                          },
                          () => this.getInitialGraph(),
                        );
                      }}
                    >
                      展示未变化提交
                    </Checkbox>
                    <Checkbox
                      checked={graphRecommend}
                      style={{ fontWeight: 'normal' }}
                      onChange={() => {
                        this.setState({
                          graphRecommend: !graphRecommend,
                        });
                      }}
                    >
                      推荐模式
                    </Checkbox>
                    <Button
                      size="small"
                      danger
                      onClick={() => {
                        this.setState({
                          watchedCommitIds: [],
                        });
                      }}
                    >
                      清空选中
                    </Button>
                  </div>
                </>
              }
              placement="left"
              closable={false}
              onClose={() => {
                this.setState({
                  gitVisible: false,
                });
              }}
              width={350}
              visible={gitVisible}
            >
              <GitGraph
                dataSource={this.props.metaStore.historyCommitGraph}
                recommend={graphRecommend}
                selectedCommitList={watchedCommitIds}
                retrospectCommitList={retrospectCommitList}
                onClick={(_, selected) => {
                  this.setState({ watchedCommitIds: selected }, () => {
                    this.getCodeInfoByCommitId();
                  });
                }}
              />
              {this.state.currentGraphPage <
                this.props.metaStore.graphPages && (
                <Button
                  onClick={() => {
                    this.getMoreGraph();
                  }}
                >
                  加载更多
                </Button>
              )}
            </Drawer>
            <div>
              <MetaCard
                {...methodMeta}
                commitTotalTimes={commitTotalTimes}
                issueType={issueType}
                level={level}
              >
                <div>
                  <Checkbox
                    checked={showUnchanged}
                    onChange={() => {
                      this.setState({ showUnchanged: !showUnchanged }, () =>
                        this.getCodeInfoByCommitId(),
                      );
                    }}
                  >
                    显示未修改方法
                  </Checkbox>
                </div>
              </MetaCard>
              <div style={{ flex: '1' }}>
                <MethodRetrospectViewer
                  style={{
                    display: displayDiff ? 'inherit' : 'none',
                  }}
                  loading={diffLoading}
                  language={diff?.language}
                  currentCommitId={
                    Array.isArray(watchedCommitIds) &&
                    watchedCommitIds.length > 0
                      ? watchedCommitIds[0]
                      : ''
                  }
                  lefts={diff?.left}
                  rights={diff?.right}
                  level={level}
                  bugLinesCommitMethodMap={bugLinesCommitMethodMap}
                  // activeLines={activeLines}
                  uuids={meta_uuids}
                  initialStatementUuidsMethodMap={
                    this.props.metaStore.statementListMethodMap
                  }
                  onRetrospectDidFinish={this.onRetrospectDidFinish}
                />
                <Card
                  style={{
                    display: displayDiff ? 'none' : 'inherit',
                    margin: '0 13px 13px 13px',
                  }}
                >
                  <Result title="暂无数据，不可比较" />
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}
