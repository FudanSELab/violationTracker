import { action, makeAutoObservable, observable, runInAction } from 'mobx';
import {
  // getIssueIntroducers,
  getIssueListBySearch,
  getIssuePriorityList,
  getIssueStatusList,
  getRawIssueDiff,
  putIgnoreIssueList,
} from '../services/issue';

export type IssueItem = { type: string; detail: string; lines: number[] };

export default class IssueStore {
  @observable issueTableTotalNumber: number = 0;
  @observable issueTableList: any[] = [];
  @observable statusList?: string[] = undefined;
  @observable priorityList?: string[] = undefined;
  // @observable introducerList?: string[] = undefined;
  @observable ignore: boolean = false;
  @observable ignoreMap: Map<string, API.IgnoreItem> = new Map<
    string,
    API.IgnoreItem
  >();
  constructor() {
    makeAutoObservable(this);
  }
  @action async getStatusList(userToken: string) {
    const statusList = await getIssueStatusList(userToken);
    runInAction(() => {
      this.statusList = (statusList as unknown) as string[];
    });
  }
  @action async getPriorityList(userToken: string) {
    const priorityList = await getIssuePriorityList(userToken);
    runInAction(() => {
      this.priorityList = (priorityList as unknown) as string[];
    });
  }
  // @action async getIntroducerList(repo: string, userToken: string) {
  //   const introducerList = await getIssueIntroducers(repo, userToken);
  //   runInAction(() => {
  //     this.introducerList = introducerList ?? [];
  //   });
  // }
  @action
  search(params: API.IssueFilterSearchParams) {
    return getIssueListBySearch(
      params,
      sessionStorage.getItem('userToken') ?? '',
    ).then((data) => {
      if (typeof data !== 'boolean' && data) {
        runInAction(() => {
          this.issueTableList = data.issueList;
          this.issueTableTotalNumber = data.total;
        });
      }
    });
  }
  @action
  searchDetailByIssueUuid({
    detail,
    issue_uuids,
  }: API.IssueFilterSearchParams) {
    return getIssueListBySearch(
      {
        detail,
        issue_uuids,
      },
      sessionStorage.getItem('userToken') ?? '',
    ).then((data) => {
      if (
        typeof data !== 'boolean' &&
        data &&
        Array.isArray(this.issueTableList)
      ) {
        let index = this.issueTableList.findIndex(
          ({ uuid }) => uuid === issue_uuids,
        );
        if (index < 0) return;
        runInAction(() => {
          this.issueTableList[index] = {
            ...data.issueList[0],
            hasGetDetail: true,
          };
        });
      }
    });
  }
  @action setIgnore(value: boolean) {
    this.ignore = value;
  }
  @action setIgnoreItem(value: API.IgnoreItem) {
    if (
      !this.ignoreMap.has(value.issueUuid) &&
      value.reason &&
      value.reason !== ''
    ) {
      this.ignoreMap.set(value.issueUuid, value);
    }
  }
  @action removeIgnoreItem(issueUuid: string) {
    if (this.ignoreMap.has(issueUuid)) {
      this.ignoreMap.delete(issueUuid);
    }
  }
  @action putIgnoreIssueList(token: string) {
    return putIgnoreIssueList(Array.from(this.ignoreMap.values()), token).then(
      () => {
        runInAction(() => {
          this.ignoreMap = new Map<string, API.IgnoreItem>();
        });
      },
    );
  }

  @action async getIssueDiffList(
    params: {
      pre_commit: string;
      cur_commit: string;
      repo_uuid: string;
      file_path: string;
    },
    userToken?: string,
  ) {
    const transformIssueItem = (issue: API.RawIssueHistoryItem) => {
      const lines = Array.isArray(issue.locations)
        ? issue.locations.reduce((acc, { startLine, endLine }) => {
            const bugLines = [];
            for (let i = startLine; i <= endLine; i++) {
              bugLines.push(i);
            }
            return acc.concat(bugLines);
          }, [] as number[])
        : [];
      return {
        type: issue.type,
        detail: issue.detail,
        lines,
      };
    };
    let preList: IssueItem[] = [];
    let curList: IssueItem[] = [];
    const resp = await getRawIssueDiff(params, userToken);
    if (typeof resp === 'boolean' || resp === null) {
      return [preList, curList];
    }
    preList = resp.preRawIssues.map(transformIssueItem);
    curList = resp.curRawIssues.map(transformIssueItem);
    return [preList, curList];
  }
}
