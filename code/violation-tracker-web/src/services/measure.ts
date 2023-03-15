import { stringify } from 'query-string';
import { get, getWithoutHeaders } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

/**
 * 返回值：
 * ['开发者1', '开发者2]
 * @param param0
 */
export async function getDeveloperListByRepoUuid(
  data: API.DevelopersInfoInRepoUuidRequestParams,
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}account/developers`;
  return get(`${url}?${stringify(data as any)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<
        API.TableListResponse<API.DevelopersInfoInRepoUuidResponseItem>
      >(url),
    )
    .catch(createHandleCatched(url));
}

// 获取workload数据
export async function getWorkloadData<T>(
  data:
    | API.DevelopersInfoInRepoUuidRequestParams
    | {
        developer: string;
        repo_uuids?: string;
        since?: string;
        until?: string;
      },
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measure/developer/work-load`;
  return get(`${url}?${stringify(data as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(createHandleResponse<T>(url))
    .catch(createHandleCatched(url));
}

// 获取缺陷统计数据
export async function getCodeQualityData<T>(
  data: API.DevelopersInfoInRepoUuidRequestParams,
  all: boolean,
  userToken?: string,
  signal?: AbortSignal,
) {
  // const type = sessionStorage.getItem('type')
  //   ? sessionStorage.getItem('type')
  //   : 'sonarqube';
  // TODO,待验证
  const url = `${baseUrl}codewisdom/issue/developer/code-quality`;
  const params = Object.assign({}, data, { all });
  return get(`${url}?${stringify(params as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(createHandleResponse<T>(url))
    .catch(createHandleCatched(url));
}

// 获取代码的生存周期
export async function getLifeCycleData(
  data: API.DevelopersInfoInRepoUuidRequestParams,
  type: 'change' | 'live' | 'loss' | 'delete',
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}codewisdom/code/lifecycle`;
  const params = { ...data, type };
  return get(`${url}?${stringify(params as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(
      createHandleResponse<
        API.TableListResponse<API.DeveloperCodeLifecycleItem>
      >(url),
    )
    .catch(createHandleCatched(url));
}
// 获取各个开发者在该段时间内的有效代码行数
export async function getLineCountData<T>(
  data: API.DevelopersInfoInRepoUuidRequestParams,
  level?: 'developer' | 'repo',
  userToken?: string,
  signal?: AbortSignal,
) {
  // TODO，分页
  const params = Object.assign({}, data, {
    level,
  });
  const url = `${baseUrl}codewisdom/code/line-count`;
  return get(`${url}?${stringify(params as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(createHandleResponse<API.TableListResponse<T>>(url))
    .catch(createHandleCatched(url));
}
export async function getLineCountTree(
  params: {
    developers: string;
    type: 'loss';
  },
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/line-count-tree`;
  return get(`${url}?${stringify(params as any)}`, userToken)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        developerName: string;
        total: number;
        type: 'loss';
        details: (API.WorkFocusTreeItem & {
          childList: API.WorkFocusTreeItem[];
        })[];
      }>(url),
    )
    .catch(createHandleCatched(url));
}
// 获取修改文件数
export async function getChangeFileNumData<T>(
  data: API.DevelopersInfoInRepoUuidRequestParams,
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}statistics/focus/file/num`;
  // TODO，分页
  return get(`${url}?${stringify(data as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(createHandleResponse<T>(url))
    .catch(createHandleCatched(url));
}
// 提交规范性
export async function getCommitStandardData<T>(
  data: API.DevelopersInfoInRepoUuidRequestParams,
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measure/commit-standard`;
  return get(`${url}?${stringify(data as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(createHandleResponse<T>(url))
    .catch(createHandleCatched(url));
}

// 自己引入未解决缺陷数
export async function getSelfIssueLifeCycleForDevelopers<T>(
  data: API.DevelopersInfoInRepoUuidRequestParams & {
    tool?: string;
    percent?: number;
    status?: string;
    target?: string;
  },
  // level: 'developer' | 'repo', // developer | repo
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}codewisdom/issue/developer-data/living-issue-count/self`;
  return get(`${url}?${stringify(data as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(createHandleResponse<T>(url))
    .catch(createHandleCatched(url));
}

// 获取自克隆率
export async function getCloneData<T>(
  data: API.DevelopersInfoInRepoUuidRequestParams,
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}cloneMeasure`;
  // TODO developers
  return get(`${url}?${stringify(data as any)}`, userToken, signal)
    .then((handleError as unknown) as (value: unknown) => Promise<any>)
    .then((d) => d as any)
    .then(createHandleResponse<T>(url))
    .catch(createHandleCatched(url));
}

// table 无关
// 获取项目详情的度量数据，如ccn
export async function getCommitData(
  params: {
    repo_uuid: string;
    since?: string;
    until: string;
    granularity?: string;
  },
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measure/repository`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any[]>(url))
    .catch(createHandleCatched(url));
}

// 获取项目详情的最新数据
export async function getCurrentMeasureData(
  params: {
    repo_uuid: string;
  },
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measure/repository/current/repo-measure`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}

// 获取项目详情的重复代码行数
export async function getLatestCloneData(
  repoUuid: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}cloneMeasure/latestCloneLines`;
  return getWithoutHeaders(`${url}?repo_uuid=${repoUuid}`, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.RepoCloneLineData>(url))
    .catch(createHandleCatched(url));
}

export async function getIssueTypeCountData(
  params: {
    tool?: string;
    repo_uuids: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measurement/issue-type-counts`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}
