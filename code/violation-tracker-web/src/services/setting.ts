import { get, post, put } from '@/request';
import { baseUrl } from '@/urlConfig';
import { stringify } from 'query-string';
import {
  handleError,
  createHandleCatched,
  createHandleResponse,
} from '../utils/response';

export async function getUsers(
  params: API.UserDetailSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}account/status/getData`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.TableListResponse<API.UserItem>>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function putUsers(data: API.UserItem[], userToken?: string) {
  const url = `${baseUrl}account`;
  return put(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

export async function getRepoMetricStandard(
  params: API.RepoMetricStandardSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/repo-metric`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.RepoMetricStandardDetailItem[]>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function postMetricValueDetail(
  data: API.RepoMetricStandardUpdateParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/repo-metric`;
  return post(`${url}?${stringify(data)}`, {}, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}
