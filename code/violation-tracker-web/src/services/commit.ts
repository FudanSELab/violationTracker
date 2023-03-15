import { downloadBlob } from '@/utils/table';
import { download, get, post } from '../request';
import { stringify } from 'query-string';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

export function getCommitterList(
  repo: string,
  token: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}measure/commit-standard/committers`;
  const params = repo ? { repo_uuids: repo } : {};
  return get(`${url}?${stringify(params)}`, token, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<string[]>(url))
    .catch(createHandleCatched(url));
}

export async function getCommitStandardList(
  params: API.CommitStandardSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/commit-standard/detail`;
  return get(`${url}?${stringify(params as any)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.CommitStandardTotalItem>>(
        url,
      ),
    )
    .catch(createHandleCatched(url));
}

export function downloadExcel(
  params: API.CommitStandardSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}measure/commit-standard/detail/download`;
  return download(`${url}?${stringify(params)}`, userToken)
    .then(({ data: blob, response }) => {
      const disposition = response.headers.get('Content-disposition');
      const type = response.headers.get('Content-type');
      return {
        blob: new Blob([blob], {
          type: type ?? '0,',
        }),
        filename: disposition
          ? (
              disposition
                .split(';')
                .find((item) => item.includes('filename')) ?? ''
            ).split('=')[1]
          : undefined,
      };
    })
    .then(({ blob, filename }) => {
      downloadBlob(blob, filename);
    });
}

export async function getCommitList(
  params: {
    repo_uuids: string;
    page?: number;
    ps: number;
    is_whole?: boolean;
  },
  userToken?: string,
) {
  const url = `${baseUrl}issue/commit-list`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        commitList?: API.CommitItem[];
        total: number;
        pageCount?: number;
      }>(url),
    )
    .catch(createHandleCatched(url));
}

export async function getCommitOverStockList(
  params: {
    repo_uuids: string;
    ps: 0;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}issue/commit-list`;
  return get(`${url}?${stringify(params)}`, userToken ?? '', signal)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        [repoUuid: string]: number;
      }>(url),
    )
    .catch(createHandleCatched(url));
}

export async function getCommitHistoryInfoList(
  params: {
    repo_uuid: string;
    since: string;
    until: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}measure/development-history/commit`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any[]>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function postCommitScan(
  data: {
    projectId: string;
    category: string;
    commitId: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}scan`;
  return post(url, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
