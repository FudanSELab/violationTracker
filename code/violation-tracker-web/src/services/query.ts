import { stringify } from 'query-string';
import { get } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

export function queryFilesOrMethods(params: {
  repo_uuid: string;
  key: string;
  level: API.TLevel;
  page: number;
  ps: number;
}) {
  // const url = `${baseUrl}codewisdom/code/list?repo_uuid=${repoUuid}&key=${key}&level=${level}`;
  // return get(url, repoUuid, key, level)
  const url = `${baseUrl}codewisdom/code/list`;
  return get(`${url}?${stringify(params)}`)
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .then(
      (d) =>
        d as { rows: API.RetrospectFileOrMethodItem[]; size: string | number },
    )
    .catch(createHandleCatched(url));
}

export function queryChangedFilesByCommitId(params: {
  repo_uuid: string;
  commit_id: string;
}) {
  const url = `${baseUrl}codewisdom/code/change/file`;
  return get(`${url}?${stringify(params)}`)
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .then((d) => d as API.CommitFilesMap)
    .catch(createHandleCatched(url));
}
