import { get, post } from '@/request';
import { baseUrl } from '@/urlConfig';
import {
  handleError,
  createHandleResponse,
  createHandleCatched,
} from '@/utils/response';
import { stringify } from 'query-string';

// todo
export async function getRepositoryScanStatus(
  params: {
    repo_uuids?: string;
    page?: number;
    ps?: number;
  },
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}scan/status`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.RepoScanStatus[]>(url))
    .catch(createHandleCatched(url));
}

export async function getRepositoryServiceScanValues(
  params: { repo_uuid?: string },
  userToken?: string,
) {
  const url = `${baseUrl}scan/repository/tool`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{ startCommitTime: string; usedTool: string[] }>(
        url,
      ),
    )
    .catch(createHandleCatched(url));
}

export async function getScanTools(userToken?: string) {
  const url = `${baseUrl}tool`;
  return get(`${url}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<string[]>(url))
    .catch(createHandleCatched(url));
}

export async function postInitialScanTools(
  data: {
    url?: string;
    branch?: string;
    address?: string;
    repoName?: string;
    projectName?: string;
    startCommitTime?: string;
    command?: string;
    toolNames: string[];
  },
  userToken?: string,
) {
  const url = `${baseUrl}scan/repository/tool`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

export async function postRepositoryScanTools(
  data: {
    repoUuid?: string;
    startCommitTime: string | null;
    toolNames: string[];
  },
  userToken?: string,
) {
  const url = `${baseUrl}scan/repository/tool`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

export type ScanSeriveceParams = {
  repoUuid?: string;
  branch?: string;
  beginCommit?: string;
};

export async function scanIssueSerivce(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}issue/sonarqube`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
export async function scanCloneSerivce(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}clone/saga-CPU`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
export async function scanCodeTrackerSerivce(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}codeTracker/codeTracker`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
export async function scanMeasureSerivce(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/xxx`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
export async function scanCycleDependSerivce(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}depend/xxx`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
export async function scanTaskManageSerivce(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}jira/xxx`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
export async function scanTripartiteDependencySerivce(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}tripartite/xxx`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
