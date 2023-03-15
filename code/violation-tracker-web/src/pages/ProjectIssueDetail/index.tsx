import React, { Component } from 'react';
import { Radio, Select } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import intl from 'react-intl-universal';
import Measure from './components/Measure';
import '@/assets/css/IssueLocation.css';
import '@/assets/css/Project.css';
import './styles.css';
import BackButton from '../../components/BackButton';
import { parse, stringify } from 'query-string';
import HistoryContext from '../historyContext';
import DevelopmentTrace from '../../components/DevelopmentTrace';
import { getAllProject, getRepositoryScanStatus } from '@/services/issue';
import IssueTable from '../Index/components/IssueTable';
import ProjectStore, { Project } from '@/models/projectStore';
import { inject, observer } from 'mobx-react';

const { Option } = Select;

interface IIssueDetailState {
  currentProject: string;
  currentRepoID: string;
  currentRadio: string;
  currentUuid: string;
  rawIssueId: number;
  displayId: number;
  currentTraceRadio: string;
  // currentBranch: string;
  currentProjectName: string;
  currentRepoName: string;
  projectList: string[];
  repoIds: string[];
  repoNames: string[];
  projectRepo: Project;
}

interface IIssueHistroySearch {
  radioChoice?: string;
  project_name: string;
  repo_uuids: string;
}

interface IProps {
  projectStore: ProjectStore;
}
@inject('projectStore')
@observer
class ProjectIssueDetail extends Component<IProps, IIssueDetailState> {
  historySearch?: IIssueHistroySearch;
  controller?: AbortController;
  developmentTraceRef: any;
  static contextType = HistoryContext;
  constructor(props: IProps) {
    super(props);
    if ('AbortController' in window) {
      this.controller = new window.AbortController();
    }
    this.state = {
      currentProject: '',
      currentRepoID: '',
      currentUuid: sessionStorage.getItem('projectID') ?? '',
      currentRadio: 'issueStatistics',
      rawIssueId: -1,
      displayId: -1,
      currentTraceRadio: sessionStorage.getItem('developmentRadio') ?? 'demo',
      // currentBranch: sessionStorage.getItem('branch') ?? '',
      currentProjectName: '',
      currentRepoName: '',
      projectList: [],
      repoIds: [],
      repoNames: [],
      projectRepo: {} as any,
    };
  }

  componentDidMount() {
    this.historySearch = (parse(
      this.context.location.search,
    ) as unknown) as IIssueHistroySearch;
    this.setState(
      {
        currentRadio: this.historySearch.radioChoice ?? 'issueStatistics',
        currentProject: this.historySearch.project_name ?? '',
        currentRepoID: this.historySearch.repo_uuids ?? '',
      },
      () => {
        getAllProject(
          sessionStorage.getItem('userToken') ?? '',
          this.controller?.signal,
        ).then((d: Project | null | true) => {
          if (!d || typeof d === 'boolean') return;
          const repoListForThisProject = this.state.currentProject
            ? d[this.state.currentProject]
            : [];
          // const repoListForThisProject = this.state.currentProject
          //   ? d[this.state.currentProject].repoList
          //   : [];
          const projectList = Object.keys(d);
          const repoNames = repoListForThisProject.map(({ name }) => name);
          const repoIds = repoListForThisProject.map(({ repo_id }) => repo_id);
          // const repoNames = repoListForThisProject.map(
          //   ({ repoName }) => repoName,
          // );
          // const repoIds = repoListForThisProject.map(
          //   ({ repoUuid }) => repoUuid,
          // );
          const currentProjectName = this.state.currentProject;
          const currentRepoName = this.state.currentRepoID
            ? repoListForThisProject.find(
                ({ repo_id }) => repo_id === this.state.currentRepoID,
              )?.name
            : '';
          // const currentRepoName = this.state.currentRepoID
          //   ? repoListForThisProject.find(
          //       ({ repoUuid }) => repoUuid === this.state.currentRepoID,
          //     )?.repoName
          //   : '';
          this.setState(
            {
              projectRepo: d,
              projectList,
              repoNames,
              repoIds,
              currentProjectName,
              currentRepoName: currentRepoName ?? '',
            },
            () => {
              if (sessionStorage.getItem('dimension') === 'project') {
                this.filterProject(this.state.currentProject ?? '');
                this.filterRepo('All');
              }
            },
          );
        });
      },
    );
  }

  componentWillUnmount() {
    // 若有未处理完的请求，则取消（适用于fetch）
    if ('AbortController' in window) {
      this.controller?.abort();
    }
  }

  // 筛选项目，同时筛选对应的库列表
  filterProject(value: string) {
    let { projectRepo } = this.state;
    this.setState({
      currentProjectName: value,
      currentRepoName: 'All',
    });
    let names = [],
      ids = [];
    for (let project in projectRepo) {
      if (value === project || value === 'All') {
        for (let repo of projectRepo[project]) {
          names.push(repo.name);
          ids.push(repo.repo_id);
        }
        // for (let repo of projectRepo[project].repoList) {
        //   names.push(repo.repoName);
        //   ids.push(repo.repoUuid);
        // }
      }
    }
    this.setState({
      repoNames: names,
      repoIds: ids,
    });
    this.context.history.replace(
      `${window.location.pathname}?${stringify({
        ...this.historySearch,
        project_name: value,
        repo_uuids: ids.join(','),
      })}`,
    );
  }

  // 筛选库，点击库进入时自动筛选库，点击项目进入时自动为‘All’
  filterRepo(value: string) {
    let { currentProjectName, projectRepo, repoIds, repoNames } = this.state;
    if (value === 'All') {
      for (let project in projectRepo) {
        if (currentProjectName === project) {
          let repoUuids = [];
          for (let repo of projectRepo[project]) {
            if (repo.repo_id !== null) {
              repoUuids.push(repo.repo_id);
            }
          }
          sessionStorage.setItem('repoId', '');
          sessionStorage.setItem('projectID', '');
          this.setState({
            currentProject: project,
            currentRepoID: repoUuids.join(','),
            currentUuid: '',
            // currentBranch: '',
          });
          this.context.history.replace(
            `${window.location.pathname}?${stringify({
              ...this.historySearch,
              project_name: project,
              repo_uuids: repoUuids.join(','),
            })}`,
          );
        }
      }
    } else {
      let repoUuid = '';
      for (let project in projectRepo) {
        for (let repo of projectRepo[project]) {
          if (repo.repo_id === repoIds[repoNames.indexOf(value)]) {
            repoUuid = repo.repo_id;
          }
        }
        // for (let repo of projectRepo[project].repoList) {
        //   if (repo.repoUuid === repoIds[repoNames.indexOf(value)]) {
        //     repoUuid = repo.repoUuid;
        //   }
        // }
      }
      getRepositoryScanStatus(
        { repo_uuids: repoUuid },
        sessionStorage.getItem('userToken') ?? '',
      ).then((data) => {
        if (typeof data !== 'boolean' && data) {
          sessionStorage.setItem('lastScanTime', data[0].endScanTime);
        }
      });

      for (let project of this.props.projectStore?.projectSimpleList ?? []) {
        for (let repo of project.repoList) {
          if (repoIds[repoNames.indexOf(value)] === repo.repoUuid) {
            sessionStorage.setItem('projectName', project.projectName);
            this.changeRepo(
              project.projectName,
              repo.repoName,
              repo.repoUuid,
              project.projectId,
              // project.branch,
            );
            this.context.history.replace(
              `${window.location.pathname}?${stringify({
                ...this.historySearch,
                project_name: project.projectName,
                repo_uuids: repo.repoUuid,
              })}`,
            );
          }
        }
      }
    }
    this.setState({
      currentRepoName: value,
    });
  }

  changeRepo = (
    project: string,
    repoName: string,
    repoId: string,
    uuid: string,
    // branch: string,
  ) => {
    sessionStorage.setItem('repoId', repoId);
    // sessionStorage.setItem('currentBranch', branch);
    sessionStorage.setItem('projectID', uuid);
    this.setState(
      {
        currentProject: project,
        currentRepoID: repoId,
        currentUuid: uuid,
        // currentBranch: branch,
      },
      // this.getSearchProjectData,
    );
  };

  getRawIssueID = (displayId: any) => {
    this.setState(() => ({
      displayId,
    }));
  };

  onRadioChange = (e: RadioChangeEvent) => {
    const radioChoice = e.target.value;
    if (radioChoice !== 'development') {
      if (this.developmentTraceRef) {
        this.developmentTraceRef.removeJsplumbPointers();
        if (this.developmentTraceRef.timerID)
          clearInterval(this.developmentTraceRef.timerID);
      }
    }
    if (radioChoice !== this.state.currentRadio) {
      sessionStorage.setItem('rawIssueRadio', radioChoice);
      this.setState({
        currentRadio: radioChoice,
      });
      this.context.history.replace(
        `${window.location.pathname}?${stringify({
          project_name: this.state.currentProject,
          repo_uuids: this.state.currentRepoID,
          radioChoice,
        })}`,
      );
    }
  };

  onTraceRadioChange = (e: RadioChangeEvent) => {
    if (e.target.value !== this.state.currentTraceRadio) {
      sessionStorage.setItem('developmentRadio', e.target.value);
      this.setState({
        currentTraceRadio: e.target.value,
      });
    }
  };

  render() {
    const {
      currentProject,
      currentRadio,
      currentRepoID,
      currentTraceRadio,
      projectList,
      currentProjectName,
      repoNames,
      currentRepoName,
    } = this.state;
    sessionStorage.setItem('rawIssueRadio', currentRadio);
    return (
      <div id="issdet">
        <div className={'issloca'}>
          <div id="menuProject">
            <BackButton />
            {currentRadio === 'issueList' ? (
              <div>{''}</div>
            ) : (
              <div>
                <span className="projectMeasure">
                  <strong className={'filterText'}>
                    {intl.get('project')}
                  </strong>
                  <Select
                    showSearch
                    style={{ width: 180 }}
                    value={currentProjectName}
                    onChange={this.filterProject.bind(this)}
                  >
                    {/* <Option
                      style={{ fontStyle: 'italic' }}
                      key="All"
                      value="All"
                      title="All"
                    >
                      {'All'}
                    </Option> */}
                    {projectList.map((element) => (
                      <Option key={element} value={element} title={element}>
                        {element}
                      </Option>
                    ))}
                  </Select>
                </span>
                <span className="projectMeasure">
                  <strong className={'filterText'}>{intl.get('repo')}</strong>
                  <Select
                    showSearch
                    placeholder={intl.get('repo filter')}
                    style={{ width: 180 }}
                    value={currentRepoName}
                    onChange={this.filterRepo.bind(this)}
                  >
                    {currentProjectName !== 'All' ? (
                      <Option
                        style={{ fontStyle: 'italic' }}
                        key="All"
                        value="All"
                        title="All"
                      >
                        {'All'}
                      </Option>
                    ) : (
                      ''
                    )}
                    {repoNames.map((element) => (
                      <Option key={element} value={element} title={element}>
                        {element}
                      </Option>
                    ))}
                  </Select>
                </span>
              </div>
            )}
            <Radio.Group
              className={'rawIssueRadioBlock'}
              value={currentRadio}
              onChange={this.onRadioChange}
            >
              <Radio.Button className="radiobuttons" value="issueStatistics">
                {intl.get('statistics')}
              </Radio.Button>
              <Radio.Button className="radiobuttons" value="issueList">
                {intl.get('issue list')}
              </Radio.Button>
              <Radio.Button className="radiobuttons" value="development">
                {intl.get('development')}
              </Radio.Button>
            </Radio.Group>
            {currentRadio === 'issueList' ? (
              <div></div>
            ) : currentRadio === 'development' ? (
              <div id={'developmentTraceRadio'}>
                <Radio.Group
                  defaultValue={currentTraceRadio}
                  onChange={this.onTraceRadioChange}
                >
                  <Radio.Button className="radiobuttons" value="demo">
                    {intl.get('demo')}
                  </Radio.Button>
                  <Radio.Button className="radiobuttons" value="commit">
                    {intl.get('commit')}
                  </Radio.Button>
                </Radio.Group>
              </div>
            ) : null}
          </div>
        </div>
        <div id="issuePage">
          <div id="radioGroups">
            {currentRadio === 'issueList' ? (
              <div id="rawisstab">
                <IssueTable ignoreManage />
                {/* <IndexIssueTable
                  projectName={currentProject}
                  repoUuids={currentRepoID.split(',')}
                /> */}
              </div>
            ) : currentRadio === 'development' ? (
              <DevelopmentTrace
              // currentTraceRadio={currentTraceRadio}
              // onRef={(ref: any) => {
              //   this.developmentTraceRef = ref;
              // }}
              // projectName={currentProject}
              // currentRepoID={currentRepoID}
              // currentRadio={currentRadio}
              />
            ) : (
              // 度量统计
              <Measure
                currentProject={currentProject}
                currentRepoUuid={currentRepoID}
                currentRepoName={currentRepoName}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ProjectIssueDetail;
