import { stringify } from 'query-string';
import { get } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

export async function getProjectIssueCount(
  data: {
    since: string;
    until: string;
    repo_uuids: string;
    tool?: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}issue/repository/issue-count`;
  const params = { ...data, tool: data.tool ?? 'sonarqube' };
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}
export async function getProjectCCnLOCDaily(
  data: {
    since: string;
    until: string;
    repo_uuids: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measure/repository/commit-count&LOC-daily`;
  return get(`${url}?${stringify(data)}`, userToken, signal)
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}
