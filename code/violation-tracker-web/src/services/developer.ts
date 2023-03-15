// export async function getIssueLifeCycle() {
//   return
// }

import { get } from '../request';
import { baseUrl } from '../urlConfig';
import { stringify } from 'query-string';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';
// const baseUrl = 'http://localhost:3000/api/';

export async function getDeveloperRecentCommit(
  params: {
    since: string;
    until: string;
    developer: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measure/developer/recent-news`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.DeveloperCommitInfoItem[]>(url))
    .catch(createHandleCatched(url));
}

export async function getWorkFocusTreeList(
  params: {
    meta_uuid?: string;
    level?: string;
    developer?: string;
    since?: string;
    until?: string;
    page?: number;
    ps?: number;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}statistics/committer/temp/focus`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.WorkFocusTreeItem>>(url),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperListByProjectNames(
  data: API.DeveloperRankSearchParams,
  userToken: string,
  // signal?: AbortSignal,
) {
  const url = `${baseUrl}account/developers`;
  return get(`${url}?${stringify(data as any)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<
        API.TableListResponse<API.DevelopersInfoInRepoUuidResponseItem>
      >(url),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperLivingIssueList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}developer/data/living-issue`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.DeveloperLivingIssueItem>>(
        url,
      ),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperCCNList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/developer/ccn-change`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.DeveloperCCNItem>>(url),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperCodeStabilityList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/stable`;
  return (
    get(`${url}?${stringify({ ...params, level: 'developer' })}`, userToken)
      .then(handleError)
      .then((d) => d as any)
      .then(
        createHandleResponse<
          API.TableListResponse<API.DeveloperCodeStabilityItem>
        >(url),
      )
      // .then((resp) => {
      //   if (resp === null) return null;
      //   resp.rows = resp.rows.map((item) => ({
      //     ...item,
      //     num: item.stableMaxMedian,
      //   }));
      //   return resp;
      // })
      .catch(createHandleCatched(url))
  );
}

export async function getDeveloperCommitStandardList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/developer/data/commit-standard`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<
        API.TableListResponse<API.DeveloperCommitStandardInfoItem>
      >(url),
    )
    .then((resp) => {
      if (!resp || typeof resp === 'boolean') return null;
      resp.rows = resp.rows.map((item) => ({
        ...item,
        num: +item.commitStandard.toFixed(4),
        // num: item.increasedCloneLines / item.addLines,
      }));
      return resp;
    })
    .catch(createHandleCatched(url));
}

export async function getDeveloperCloneLineList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}clone/developer/clone-line`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.DeveloperCloneLineItem>>(
        url,
      ),
    )
    .then((resp) => {
      if (!resp || typeof resp === 'boolean') return null;
      resp.rows = resp.rows.map((item) => ({
        ...item,
        num: item.increasedCloneLines,
        // num: item.increasedCloneLines / item.addLines,
      }));
      return resp;
    })
    .catch(createHandleCatched(url));
}

export async function getDeveloperBigMethodsList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/method/line`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.DeveloperBigMethodsItem>>(
        url,
      ),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperDataWorkLoadList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/developer/data/work-load`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<
        API.TableListResponse<API.DeveloperDataWorkLoadItem>
      >(url),
    )
    .then((resp) => {
      if (!resp || typeof resp === 'boolean') return null;
      resp.rows = resp.rows.map((item) => ({
        ...item,
        num: item.totalLoc,
      }));
      return resp;
    })
    .catch(createHandleCatched(url));
}

export async function getDeveloperDesignContributionList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/design-contribution`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<
        API.TableListResponse<API.DeveloperDesignContributionItem>
      >(url),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperCompletedJiraList(
  params: API.DeveloperRankSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}jira/data/completed-jira-num`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<
        API.TableListResponse<API.DeveloperCompletedJiraItem>
      >(url),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperIssueLifecycleList(
  params: {
    developers: string;
    repo_uuids?: string;
    since?: string;
    until?: string;
    tool: string;
    percent: -1 | -2;
    status: string;
    target: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/issue/lifecycle`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.DeveloperIssueLifecycleItem[]>(url))
    .catch(createHandleCatched(url));
}

export async function getDeveloperCommitRank(
  params: {
    repo_uuids: string;
    since: string;
    until: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}measure/repository/developer-rank/commit-count`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.DeveloperRankSimpleItem[]>(url))
    .catch(createHandleCatched(url));
}
export async function getDeveloperLocRank(
  params: {
    repo_uuids: string;
    since: string;
    until: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}measure/repository/developer-rank/loc`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.DeveloperRankSimpleItem[]>(url))
    .catch(createHandleCatched(url));
}
export async function getDeveloperCodeLineRank(
  params: {
    repo_uuid: string;
    since: string;
    until: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}statistics/top`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.DeveloperRankSimpleItem[]>(url))
    .catch(createHandleCatched(url));
}

export async function getDeveloperCompetenceOfCommitStandard(
  params: API.AllMeasureSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/developer/competence-measure`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.MeasureCommitStandard>(url))
    .catch(createHandleCatched(url));
}
export async function getDeveloperCompetenceOfStatement(
  params: API.AllMeasureSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/developer/competence-codetracker`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.MeasureStatement>(url))
    .catch(createHandleCatched(url));
}
export async function getDeveloperCompetenceOfIssue(
  params: API.AllMeasureSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/developer/competence-issue`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.MeasureCodeStandardAndIssue>(url))
    .catch(createHandleCatched(url));
}
export async function getDeveloperCompetenceOfClone(
  params: API.AllMeasureSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/developer/competence-clone`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.MeasureClone>(url))
    .catch(createHandleCatched(url));
}
export async function getDeveloperCompetenceOfJira(
  params: API.AllMeasureSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/developer/competence-jira`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.MeasureJira>(url))
    .catch(createHandleCatched(url));
}

export async function getDeveloperAverageCodeLineDayily(
  params: {
    developer: string;
    repo_uuids?: string;
    'begin-date'?: string;
    'end-date'?: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}measure/statement`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        totalStatement: number;
        workDays: number;
        dayAvgStatement: number;
      }>(url),
    )
    .catch(createHandleCatched(url));
}

export async function getDeveloperJiraMission(
  params: API.DeveloperJiraMissionSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}jira/developer-msg`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.DeveloperJiraMissionItem>(url))
    .catch(createHandleCatched(url));
}
