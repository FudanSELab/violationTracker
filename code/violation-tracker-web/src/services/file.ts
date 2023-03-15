import { downloadBlob } from '@/utils/table';
import { stringify } from 'query-string';
import { download, get } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

export async function getChangedFileList(
  params: API.ChangedFilesDetailSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/file/detail`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.ChangedFilesTotalItem>>(
        url,
      ),
    )
    .catch(createHandleCatched(url));
}

export function downloadExcel(
  params: API.ChangedFilesDetailSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/file/detail/download`;
  return download(`${url}?${stringify(params)}`, userToken)
    .then(({ data: blob, response }) => {
      const disposition = response.headers.get('Content-disposition');
      const type = response.headers.get('Content-type');
      return {
        blob: new Blob([blob], {
          type: type ?? '',
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

export async function getAllDevelopmentHistory(
  params: {
    commit_id?: string;
    repo_uuid: string;
    since: string;
    until: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}history/all`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any[]>(url))
    .catch(createHandleCatched(url));
}

export async function getFileHistoryInfoListByCommitId(
  params: {
    commit_id: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}measure/development-history/file`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any[]>(url))
    .catch(createHandleCatched(url));
}

export async function getFileCode(
  params: {
    repo_uuid: string;
    commit_id: string;
    file_path: string;
    start: number;
    end: number;
  },
  userToken?: string,
) {
  const url = `${baseUrl}/issue/code/file`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        data: string;
        line: number;
      }>(url),
    )
    .catch(createHandleCatched(url));
}
