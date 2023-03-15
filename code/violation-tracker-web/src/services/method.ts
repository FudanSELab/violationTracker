import { StatementInfoItem } from '@/components/RetrospectViewer/FileRetrospectViewer';
import { downloadBlob } from '@/utils/table';
import { stringify } from 'query-string';
import { download, get, post } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

export async function getMethodList(
  params: API.MethodCCNFilterSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/method/detail`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.TableListResponse<API.MethodTotalItem>>(url))
    .catch(createHandleCatched(url));
}

export const getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation = (
  params: {
    issue_uuid: string;
    repo_uuid: string;
    issue_type?: string;
    meta_uuid?: string;
    show_all?: boolean;
    type: API.TGitGraph;
    page: number;
    ps?: number;
    level: string;
  },
  userToken?: string,
) => {
  const url =
    params.level === 'file' && params.issue_uuid
      ? `${baseUrl}issue/tracker-map`
      : `${baseUrl}history/tracker-map`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        metaInfo: API.MethodMeta;
        methodInfo: API.MethodInfo[];
        issueLocations: API.RawIssueHistoryItem[];
        node: API.TableListResponse<API.CommitNodeItem>;
        edge: API.CommitEdgeItem[];
      }>(url),
    )
    .then((data) => {
      if (typeof data === 'boolean' || data === null) return data;
      const regex = /^'(.*)'$/;
      data.node.rows.forEach((item: any) => {
        if (item.filePath === '') item.filePath = undefined;
        if (regex.test(item.parentCommit)) {
          item.parentCommit = JSON.parse(
            item.parentCommit.replace(regex, (_: any, p1: any) => {
              return p1;
            }),
          );
        }
      });
      return data;
    })
    .catch(createHandleCatched(url));
};

export const postMethodInfosAndCommitInfos = (
  data:
    | API.RawIssueHistoryItem
    | {
        level: string;
        metaUuid: string;
      },
  userToken: string,
) => {
  const url = `${baseUrl}history/tracker-chain`;
  return post(`${url}`, data, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        methodInfo: API.MethodInfo[];
        commitInfo: {
          meta: API.MethodMeta;
          commitInfoList: API.HistoryCommitChain[];
        };
      }>(url),
    )
    .catch(createHandleCatched(url));
};

export const getMethodDiffData = (
  metaUuids: string[],
  level: string,
  preCommitId?: string,
  currentCommitId?: string,
  showUnchanged?: boolean,
  userToken?: string,
) => {
  const url = `${baseUrl}statistics/method/history`;
  const params = {
    meta_uuid: metaUuids.join(','),
    commit_id: `${preCommitId},${currentCommitId}`,
    level,
    show_unchanged: showUnchanged,
  };
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        language: string;
        left: API.CommitCodeInfo[];
        right: API.CommitCodeInfo[];
      }>(url),
    )
    .then((data) => {
      if (typeof data !== 'boolean' && data) {
        if (data.left) {
          data.left.forEach(
            (l: { message: string }) => (l.message = l.message?.trim()),
          );
        }
        if (data.right) {
          data.right.forEach(
            (r: { message: string }) => (r.message = r.message?.trim()),
          );
        }
      }
      return data;
    })
    .then((data) => {
      if (typeof data !== 'boolean' && data) {
        if (Array.isArray(data.left)) {
          data.left = data.left.filter(
            ({ metaUuid, filePath, signature }) => metaUuid !== undefined,
            // filePath !== undefined && signature !== undefined,
          );
        }
        if (Array.isArray(data.right)) {
          data.right = data.right.filter(
            ({ metaUuid, filePath, signature }) => metaUuid !== undefined,
            // filePath !== undefined && signature !== undefined,
          );
        }
      }
      return data;
    })
    .catch(createHandleCatched(url));
};

// export const getValidStatementList = (data: {
//   metaUuid: string;
//   commitDate: string;
//   methodBody: string;
// }) => {
//   const url = `${baseUrl}code-test/valid/statement`;
//   return post(url, data)
//     .then(handleError)
//     .then((d) => d as API.Response<boolean[]>)
//     .then(createHandleResponse<boolean[]>(url))
//     .catch(createHandleCatched(url));
// };

export const getStatementHistoryInfo = (
  data: {
    metaUuid: string;
    currentCommitId: string;
    statementInfoList?: {
      begin: number;
      end: number;
      code: string;
    }[];
  },
  userToken?: string,
) => {
  const url = `${baseUrl}statistics/statement/info`;
  return post(url, data, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        firstCommitDate: string;
        lifecycle: number;
        body: string;
      }>(url),
    )
    .catch(createHandleCatched(url));
};

// export function findCurrentFilePath(params: {
//   commitId: string;
//   fileUuid: string;
// }) {

// }

export function findMetaUuidOfStatement(
  data: {
    repoUuid: string;
    commitId: string;
    filePath?: string;
    locations: StatementInfoItem[];
  },
  userToken?: string,
) {
  const url = `${baseUrl}statistics/statement/meta`;
  return post(url, data, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<string[]>(url))
    .catch(createHandleCatched(url));
}

export const retrospectStatementHistories = (
  data: {
    metaUuid?: string;
    currentCommitId: string;
    statementInfoList?: any[];
    statementUuidList?: string[];
  },
  userToken: string,
): Promise<API.RetrospectResult[] | null | true> => {
  const url = `${baseUrl}statistics/statement/history`;
  return post(url, data, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.RetrospectResult[]>(url))
    .then((d) => {
      if (!d || typeof d === 'boolean') return d;
      return d.map(({ histories, title, begin, end }) => {
        const currentCommit = histories.find(
          ({ commitId }) => commitId === data.currentCommitId,
        );
        return {
          histories,
          title: currentCommit?.body ?? title,
          begin: currentCommit?.lineBegin ?? begin,
          end: currentCommit?.lineEnd ?? end,
        };
      });
    })
    .catch(createHandleCatched(url));
};

export function downloadExcel(
  params: API.MethodCCNFilterSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}codewisdom/code/method/detail/download`;
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
