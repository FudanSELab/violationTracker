import { getRepositoryScanStatus } from '@/services/issue';
import {
  action,
  computed,
  makeAutoObservable,
  observable,
  runInAction,
} from 'mobx';
import { getAllProject } from '@/services/issue';

export type Project = { [projectName: string]: API.RepoItem[] };
export type ProjectWithId = {
  [key: string]: API.ProjectSimpleItem;
};

export default class ProjectStore {
  @observable projects?: Project = undefined;
  @observable projectsWithId?: ProjectWithId = undefined;
  static projectNameList: any;
  constructor() {
    makeAutoObservable(this);
  }
  @computed get projectNameList() {
    return Object.keys(this.projects ?? {});
  }
  @computed get projectSimpleList() {
    return Object.values(this.projectsWithId ?? {});
  }
  @computed get repoList() {
    return Object.values(this.projects ?? {}).reduce((a, b) => a.concat(b), []);
  }
  @computed get repositoryList() {
    return this.projectSimpleList.reduce(
      (a, b) => a.concat(b.repoList),
      [] as API.RepositoryItem[],
    );
  }
  @action async getSearchProjectData(
    params: API.ProjectScanSearchParams,
    userToken?: string,
    signal?: AbortSignal,
  ): Promise<API.TableListResponse<API.ProjectScanItem>> {
    // todo set page and page size
    const scanStatusResp = await getRepositoryScanStatus(
      {
        page: 1,
        ps: 1000,
      },
      userToken ?? '',
    );
    const scanStatusList = Array.isArray(scanStatusResp) ? scanStatusResp : [];
    const resultList = scanStatusList.map((item) => {
      return {
        ...item,
        scanStatus: item?.scanStatus,
        endScanTime: item?.endScanTime,
        elapsedTime: item?.scanTime,
        toolStatuses: [
          {
            service: 'issue',
            scanStatus: item?.scanStatus,
          },
        ],
      };
    });
    // todo
    return {
      total: resultList.length,
      page: 1,
      records: resultList.length,
      rows: resultList as API.ProjectScanItem[],
    };
  }
  @action async getProjects() {
    const projects = await getAllProject();
    runInAction(() => {
      if (typeof projects !== 'boolean' && projects !== null) {
        this.projects = (projects as unknown) as Project;
      }
    });
  }
  // @action async getProjectsWithId() {
  //   const projectsWithId = await getAllProjectsWithId();
  //   runInAction(() => {
  //     if (typeof projectsWithId !== 'boolean' && projectsWithId !== null) {
  //       this.projectsWithId = projectsWithId;
  //     }
  //   });
  // }
  @action
  getRepoListByProjectName(projectName: string) {
    return this.projects?.[projectName] ?? [];
  }
  @action
  getRepoListByProjectNames(projectNames: string[]) {
    return Array.isArray(projectNames) && projectNames.length > 0
      ? projectNames.map(this.getRepoListByProjectName.bind(this)).flat()
      : [];
  }
  @action
  getRepoListByProjectId(projectId: string) {
    return this.projectsWithId?.[projectId].repoList ?? [];
  }
  @action
  getRepoListByProjectIds(projectIds: string[]) {
    return Array.isArray(projectIds) && projectIds.length > 0
      ? projectIds.map(this.getRepoListByProjectId.bind(this)).flat()
      : [];
  }
  @action
  getProjectByRepoUuid(repoUuid: string) {
    if (!this.projects) return undefined;
    return Object.keys(this.projects).find((key) =>
      this.projects?.[key].map(({ repo_id }) => repo_id).includes(repoUuid),
    );
  }
  @action
  getProjectIdByProjectName(projectName: string) {
    const project = this.projectSimpleList.find(
      ({ projectName }) => projectName === '平台',
    );
    return project?.projectId;
  }
}
