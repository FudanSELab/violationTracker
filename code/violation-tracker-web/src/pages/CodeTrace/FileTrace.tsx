import { Component } from 'react';

import './styles.css';
import MetaCard from './components/MetaCard';
import BackButton from '../../components/BackButton';
import { inject, observer } from 'mobx-react';
import MetaStore from '../../models/metaStore';
import { Card, Result, Spin, Checkbox, Drawer, Button } from 'antd';
import { parse } from 'query-string';
import UserStore from '@/models/userStore';
import ProjectStore from '@/models/projectStore';
import HistoryContext from '../historyContext';
import FileRetrospectViewer from '@/components/RetrospectViewer/FileRetrospectViewer';
import { BranchesOutlined } from '@ant-design/icons';
import { checkCompareStatus, getParents } from '@/components/GitGraph/utils';
import GitGraph from '@/components/GitGraph';
import GitGraphLegend from '@/components/GitGraph/legend';

interface IState {
  gitVisible: boolean;
  graphRecommend: boolean;
  graphAll: boolean;
  watchedCommitIds?: string[];
  compareStatus: boolean;
  currentGraphPage: number;
  commitTotalTimes: number;
  // diff?: {
  //   language: string;
  //   left: API.CommitCodeInfo[];
  //   right: API.CommitCodeInfo[];
  // };
  issueType?: string;
  loading: boolean;
  // diffLoading: boolean;
  meta_uuids: string[];
  retrospectCommitList: string[];
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
export default class FileTrace extends Component<IProps, IState> {
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
      // diff: undefined,
      loading: true,
      // diffLoading: false,
      meta_uuids: [],
      retrospectCommitList: [],
      compareStatus: true,
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
      issueType: historySearch.issue_type,
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
        this.setState({
          loading: false,
        });
        let currentCommitId = '',
          lastCommitId = '',
          comparable = true;
        if (this.props.metaStore.historyCommitGraph.nodes.length > 0) {
          currentCommitId =
            this.props.metaStore.historyCommitGraph.nodes[0].commitId ?? '';
          lastCommitId =
            getParents(
              this.props.metaStore.historyCommitGraph.edges,
              currentCommitId,
            )[0] ?? '';
          comparable = checkCompareStatus(
            this.props.metaStore.historyCommitGraph.edges,
            currentCommitId,
            lastCommitId,
          );
        }
        this.setState({
          commitTotalTimes: this.props.metaStore.commitTotalTimes,
          watchedCommitIds:
            currentCommitId === '' && lastCommitId === ''
              ? []
              : [currentCommitId, lastCommitId],
          compareStatus: comparable,
        });
      })
      .catch((err) => {
        console.error('initial graph:', err);
      });
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
    const { watchedCommitIds } = this.state;
    if (watchedCommitIds === undefined || watchedCommitIds.length < 1) return;
    const [currentCommitId, lastCommitId] = watchedCommitIds;
    // console.log(currentCommitId, lastCommitId);
    const currentCommitInfo = this.props.metaStore.historyCommitGraph.nodes.find(
      ({ commitId }) => commitId === currentCommitId,
    );
    const lastCommitInfo =
      lastCommitId === undefined
        ? undefined
        : this.props.metaStore.historyCommitGraph.nodes.find(
            ({ commitId }) => commitId === lastCommitId,
          );
    // console.log('get diff', lastCommitInfo, currentCommitInfo);
    return {
      left: lastCommitInfo,
      right: currentCommitInfo,
    };
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
      compareStatus,
      commitTotalTimes,
      loading,
      issueType,
      retrospectCommitList,
    } = this.state;
    // const bugLinesCommitMethodMap = this.props.metaStore
    //   .bugLinesCommitMethodMap;
    const displayDiff =
      Array.isArray(watchedCommitIds) &&
      watchedCommitIds.length > 0 &&
      this.props.metaStore.commitTotalTimes > 0;
    let diff = undefined;
    if (displayDiff) {
      diff = this.getCodeInfoByCommitId();
    }
    const historySearch = (parse(
      this.context.location.search,
    ) as unknown) as IHistorySearch;
    const repoName =
      this.props.projectStore.repoList.find(
        ({ repo_id }) => repo_id === historySearch.repo_uuid,
      )?.name ?? 'unknown';
    const projectName = historySearch.repo_uuid
      ? this.props.projectStore.getProjectByRepoUuid(historySearch.repo_uuid) ??
        'unknown'
      : 'unknown';
    return (
      <div id="meta-trace">
        <div className="issloca">
          <div className="input">
            <BackButton />
            <div>
              {(issueType ?? '') !== '' ? 'Violation' : 'File'}Tracker（
              {repoName} / {projectName}）
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
                    Tracker-Chain
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
                      Show unchanged revisions
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
                      Recommend
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
                      Clear
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
                  const comparable = selected
                    ? checkCompareStatus(
                        this.props.metaStore.historyCommitGraph.edges,
                        selected[0] ?? undefined,
                        selected[1] ?? undefined,
                      )
                    : true;
                  this.setState(
                    { watchedCommitIds: selected, compareStatus: comparable },
                    () => {
                      this.getCodeInfoByCommitId();
                    },
                  );
                }}
              />
              {this.state.currentGraphPage <
                this.props.metaStore.graphPages && (
                <Button
                  onClick={() => {
                    this.getMoreGraph();
                  }}
                >
                  More
                </Button>
              )}
            </Drawer>
            <div>
              <MetaCard
                {...this.props.metaStore.meta}
                commitTotalTimes={commitTotalTimes}
                issueType={issueType}
                level="file"
              ></MetaCard>
              <div style={{ flex: '1' }}>
                <FileRetrospectViewer
                  style={{
                    display: displayDiff ? 'inherit' : 'none',
                  }}
                  repoUuid={historySearch.repo_uuid}
                  currentCommitId={
                    Array.isArray(watchedCommitIds) &&
                    watchedCommitIds.length > 0
                      ? watchedCommitIds[0]
                      : ''
                  }
                  previousCommitId={
                    Array.isArray(watchedCommitIds) &&
                    watchedCommitIds.length > 1
                      ? watchedCommitIds[1]
                      : ''
                  }
                  comparable={compareStatus}
                  left={(diff?.left as unknown) as API.CommitCodeInfoTitle}
                  right={(diff?.right as unknown) as API.CommitCodeInfoTitle}
                  issueListCommitMap={this.props.metaStore.issueListCommitMap}
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
                  <Result title="None data to be compared" />
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}
