import { Component } from 'react';
import intl from 'react-intl-universal';
import { LineChartOutlined, SearchOutlined } from '@ant-design/icons';
import { DatePicker, Tabs, Button } from 'antd';
import './styles.less';
import ITC from './components/ITC';
import ITCtop from './components/ITCtop';
import ProjectRank from './components/ProjectRank';
import Dashboard from './components/Dashboard';
import ProjectTotalMeasure from './components/ProjectTotalMeasure';
import TotalStatistics from './components/TotalStatistics';
import {
  getDateforLastNMonth,
  getCurrentDateForLastWeek,
  getDateForLastNYear,
} from '../../../../utils/getDuration';

import { disabledDate, disabledRangeTime } from '../../../../utils/time';
import HistoryContext from '../../../historyContext';
import { parse, stringify } from 'query-string';
import {
  getCommitData,
  getCurrentMeasureData,
  getLatestCloneData,
} from '@/services/measure';
import { getSinceAndUntil } from './util';
import { IssueCountStatistic } from './components/IssueCountStatistic';
import { inject, observer } from 'mobx-react';
import ProjectStore from '@/models/projectStore';

interface CommitItem {
  repoName: string;
  ccn: number;
  classes: number;
  files: number;
  ncss: number;
  functions: number;
  multi_comment_lines: number;
  developer_name: string;
  single_comment_lines: number;
  commit_time: string;
}

interface IProps {
  currentRepoUuid: string;
  currentProject: string;
  currentRepoName: any;
  projectStore?: ProjectStore;
}
interface IState {
  loading: boolean;
  measureLoading: boolean;
  durationGranularity: string;
  currentProject: string;
  currentRepoName: string;
  currentRepoUuid: string;
  projectMeasure: any[];
  currentDateRange: string[];
  commitData: CommitItem;
  codeQualityData: any;
  lifeCycleData: any[];
  lineCountData: any[];
  cloneLineData?: API.RepoCloneLineData;
  modalVisible: boolean;
  totalStatisticsVisible: boolean;
  lastScanTime: string;
  changeFileNumData: any;
  developerNames: string[];
  commitStandardData: any[];
  openIssueData: any[];
  cloneData: any[];
  workloadData: any[];
  repoDevelopers: string;
}
interface IHistorySearch {
  project_name: string;
  repo_uuids?: string;
}

@inject('projectStore')
@observer
class Measure extends Component<IProps, IState> {
  static contextType = HistoryContext;
  controller?: AbortController;

  constructor(props: IProps) {
    super(props);
    if ('AbortController' in window) {
      this.controller = new window.AbortController();
    }
    this.state = {
      loading: true,
      durationGranularity: '0',
      currentProject: props.currentProject ?? '',
      currentRepoName: props.currentRepoName ?? '',
      currentRepoUuid: props.currentRepoUuid,
      projectMeasure: [],
      currentDateRange: getCurrentDateForLastWeek(),
      commitData: {} as CommitItem,
      codeQualityData: {},
      lifeCycleData: [],
      lineCountData: [],
      modalVisible: false,
      totalStatisticsVisible: false,
      lastScanTime: '',
      measureLoading: true,
      changeFileNumData: {},
      developerNames: [],
      commitStandardData: [],
      openIssueData: [],
      cloneData: [],
      workloadData: [],
      repoDevelopers: '',
    };
  }

  componentDidMount() {
    sessionStorage.setItem('measureUpdate', 'true');
    if (this.props.projectStore?.projects === undefined) {
      this.props.projectStore?.getProjects().then(() => {
        this.setStateByHistory(() => this.loadAllData());
      });
    }
    this.setStateByHistory(() => this.loadAllData());
  }

  componentWillUnmount = () => {
    // 若有未处理完的请求，则取消（适用于fetch）
    if ('AbortController' in window) {
      this.controller?.abort();
    }
  };

  UNSAFE_componentWillReceiveProps(nextProps: IProps) {
    if (this.state.currentRepoUuid !== nextProps.currentRepoUuid) {
      this.setState(
        {
          currentRepoUuid: nextProps.currentRepoUuid,
          currentProject: nextProps.currentProject,
          currentRepoName: nextProps.currentRepoName,
          measureLoading: true,
          modalVisible: false,
        },
        () => {
          this.loadAllData();
        },
      );
    } else if (this.state.currentRepoName !== nextProps.currentRepoName) {
      this.setState({
        currentRepoName: nextProps.currentRepoName,
      });
    }
  }

  setStateByHistory(then: () => void) {
    const HISTORY_SEARCH: IHistorySearch = parse(
      this.context.location.search,
    ) as any;
    const repoName = this.props.projectStore
      ?.getRepoListByProjectName(HISTORY_SEARCH.project_name)
      .find(({ repo_id }) => repo_id === HISTORY_SEARCH.repo_uuids)?.name;
    this.setState(
      {
        currentProject: HISTORY_SEARCH.project_name,
        currentRepoUuid: HISTORY_SEARCH.repo_uuids ?? '',
        currentRepoName: repoName ?? '123',
      },
      then,
    );
  }

  loadAllData() {
    const { currentRepoUuid } = this.state;
    // const [, until] = getSinceAndUntil(currentDateRange, lastScanTime);
    getCurrentMeasureData(
      {
        repo_uuid: currentRepoUuid,
      },
      sessionStorage.getItem('userToken') ?? '',
      this.controller?.signal,
    ).then((data) => {
      this.setState({
        measureLoading: false,
      });
      if (typeof data !== 'boolean' && data !== null) {
        this.setState({
          commitData: data ?? {},
        });
      }
    });
    getLatestCloneData(currentRepoUuid, this.controller?.signal).then(
      (cloneLineData) => {
        if (!cloneLineData || typeof cloneLineData === 'boolean') {
          this.setState({ cloneLineData: {} as API.RepoCloneLineData });
          return;
        }
        this.setState({ cloneLineData });
      },
    );
  }

  // 切换时间
  onChangeTabs(key: string) {
    let { currentDateRange, durationGranularity } = this.state;
    if (key !== durationGranularity) {
      if (key === '0') {
        currentDateRange = getCurrentDateForLastWeek();
      } else if (key === '1') {
        currentDateRange = getDateforLastNMonth(1);
      } else if (key === '2') {
        currentDateRange = getDateForLastNYear(1);
      }
      this.setState({
        durationGranularity: key,
        currentDateRange,
      });
    }
  }

  // 手动选择时间段
  onChangeProjectDate = (_: any, dateString: string[]) => {
    this.setState({
      durationGranularity: '3',
      currentDateRange: dateString,
    });
  };

  showModal = () => {
    const { currentRepoUuid, lastScanTime } = this.state;
    const [since, until] = getSinceAndUntil(
      getDateForLastNYear(3),
      lastScanTime,
    );
    getCommitData(
      { repo_uuid: currentRepoUuid, since, until, granularity: 'day' },
      sessionStorage.getItem('userToken') ?? '',
      this.controller?.signal,
    ).then((data) => {
      let commitData: any = [];
      if (typeof data !== 'boolean' && data !== null) {
        commitData = data;
      }
      this.setState({ projectMeasure: commitData, modalVisible: true });
    });
  };

  render() {
    const { TabPane } = Tabs;
    const { RangePicker } = DatePicker;
    const {
      currentProject,
      currentRepoName,
      projectMeasure,
      commitData,
      currentDateRange,
      cloneLineData,
      durationGranularity,
      modalVisible,
      totalStatisticsVisible,
      currentRepoUuid,
      measureLoading,
      lastScanTime,
    } = this.state;
    if (commitData && commitData.ccn) {
      commitData.ccn = +commitData.ccn.toFixed(2);
    }
    const signal = this.controller?.signal;
    return (
      <div id="measureDiv">
        {currentRepoName === 'All' ? (
          <div className="measureModule" id="measureProject">
            <div className="moduleTitle">
              <span>{intl.get('project') + ':' + currentProject}</span>
            </div>
          </div>
        ) : (
          <div className="measureModule" id="measureProject">
            <div className="moduleTitle">
              <span>{currentRepoName}</span>
              <Button
                // type="text"
                // size="small"
                style={{
                  marginLeft: '1em',
                  verticalAlign: 'middle',
                }}
                onClick={() =>
                  this.setState({
                    totalStatisticsVisible: !totalStatisticsVisible,
                  })
                }
              >
                {totalStatisticsVisible
                  ? intl.get('cancel')
                  : intl.get('view-detail')}
              </Button>
              <span
                onClick={this.showModal}
                className={'tendencyChart'}
                style={{ marginLeft: '1em' }}
              >
                {intl.get('tendency chart')}
                <LineChartOutlined />
              </span>
              <Button
                style={{ marginLeft: '10px' }}
                onClick={() =>
                  this.context.history.push({
                    pathname: '/query/retrospect',
                    search: `?${stringify({
                      repoUuid: currentRepoUuid,
                      repoName: currentRepoName,
                    })}`,
                  })
                }
                icon={<SearchOutlined />}
              >
                文件历史追溯
              </Button>
              {sessionStorage.getItem('lastScanTime') &&
              currentRepoName !== 'All' ? (
                <span className={'littleTitle'}>
                  {intl.get('Last scan time')}:{' '}
                  {sessionStorage.getItem('lastScanTime')}
                </span>
              ) : null}
            </div>
            {/* 模态框 */}
            <ProjectTotalMeasure
              visible={modalVisible}
              currentRepoName={currentRepoName}
              projectMeasure={projectMeasure}
              handleCancel={() => {
                this.setState({
                  modalVisible: false,
                });
              }}
            />
            {totalStatisticsVisible ? (
              <TotalStatistics
                measureLoading={measureLoading}
                // branch={branch}
                // date={currentDateRange}
                projectDetailData={commitData}
                cloneLineData={(cloneLineData ?? {}) as API.RepoCloneLineData}
                // signal={signal}
              />
            ) : null}
            {/* 清除浮动 */}
            <div style={{ clear: 'both' }}></div>
          </div>
        )}{' '}
        <div className="measureModule">
          <div className="moduleTitle">
            <span>{intl.get('Developer Statistics')}</span>
          </div>
          <Tabs
            animated={false}
            activeKey={durationGranularity}
            onChange={this.onChangeTabs.bind(this)}
            tabPosition={'top'}
          >
            {[
              intl.get('recent week'),
              intl.get('recent month'),
              intl.get('recent year'),
              intl.get('more'),
            ].map((d, k) => {
              return (
                <TabPane tab={d} key={k}>
                  {k === 3 ? (
                    <RangePicker
                      disabledDate={disabledDate}
                      disabledTime={disabledRangeTime}
                      format="YYYY-MM-DD"
                      onChange={this.onChangeProjectDate.bind(this)}
                    />
                  ) : (
                    ''
                  )}
                </TabPane>
              );
            })}
          </Tabs>
          {/* 开发者数据 */}
          {currentRepoUuid ? (
            <ProjectRank
              date={currentDateRange}
              currentRepoUuid={currentRepoUuid}
              lastScanTime={lastScanTime}
              signal={signal}
            />
          ) : null}
        </div>
        <div
          className="measureModule"
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <div id="measureIssue">
            <div className="moduleTitle">
              <span>{intl.get('Issue Statistics')}</span>
            </div>
            <IssueCountStatistic repoUuid={currentRepoUuid} />
          </div>
          <div>
            <div className={'moduleTitle'}>
              <span>{intl.get('Total Issue Type Count')}</span>
            </div>
            <div className={'moduleTitle'}>
              <ITC repoUuid={currentRepoUuid} signal={signal} />
            </div>
          </div>
          <div>
            <div className={'moduleTitle'}>
              <span>{intl.get('Issue Type Top3')}</span>
            </div>
            <ITCtop repoUuid={currentRepoUuid} signal={signal} />
          </div>
        </div>
        <div className="measureModule" id="commitDashBoard">
          <div className="moduleTitle">
            <span>{intl.get('commit dashBoard')}</span>
          </div>
          <Dashboard
            repoUuid={currentRepoUuid}
            projectName={currentProject}
            signal={signal}
          />
          <div style={{ clear: 'both' }} />
        </div>
      </div>
    );
  }
}

export default Measure;
