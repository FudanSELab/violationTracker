import { get } from '@/request';
import { stringify } from 'query-string';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '@/utils/response';
import { TreeMapData } from '@/components/graph/D3TreeMap3';

export async function getCommitsAndFileTreeOfRepo(
  params: {
    type: number;
    repo_uuid: string;
    repo_name: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `/code-portrait`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        commits: Pick<
          CP.CommitLineStockItem,
          'commitId' | 'commitDate' | 'committer'
        >[];
        fileTree: TreeMapData;
      }>(url),
    )
    .catch(createHandleCatched(url));
}

export async function getHistoryCommitsList(
  params: {
    type?: number;
    repo_uuid: string;
    begin_commit?: string;
    end_commit?: string;
    num?: number;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `/code-portrait/history/commits`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<CP.CommitItem[]>(url))
    .catch(createHandleCatched(url));
}

export async function getFileBaseList(
  params: {
    type?: number;
    repo_uuid: string;
    repo_name?: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `/code-portrait/history/files/base`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<CP.FileBaseItem<CP.LineItemWithEvoluation>[]>(url),
    )
    .catch(createHandleCatched(url));
}

export async function getAllLiveLinesOfCommit(
  params: {
    type?: number;
    repo_uuid: string;
    commit_id: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `/code-portrait/history/lines`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<CP.LineBaseItem[]>(url))
    .catch(createHandleCatched(url));
}

export async function getOneCommitChange(
  params: {
    type?: number;
    index: number;
    repo_uuid: string;
    commit_id: string;
  },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `/code-portrait/history/one`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<CP.CommitLineIncrementalItem>(url))
    .catch(createHandleCatched(url));
}
