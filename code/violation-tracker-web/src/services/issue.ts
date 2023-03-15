import { downloadBlob } from '@/utils/table';
import { stringify } from 'query-string';
import { download, get, post, put } from '../request';
import { baseIp, baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';
import { Project } from '@/models/projectStore';
import request from 'umi-request';
import { LivingIssueProjectViewData } from '@/services/graph/issue';
import { ScanSeriveceParams } from '@/services/scan';

export function getAllProject(token?: string, signal?: AbortSignal) {
  return get(`${baseUrl}issue/scan-repos`, token, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<Project>('issue/scan-repos'))
    .catch(createHandleCatched('issue/scan-repos'));
}

export function getProjectList(
  params: { life_status?: API.ProjectLifeStatus },
  userToken: string,
  signal?: AbortSignal,
) {
  return [
    {
      leaders: [],
      lifeStatus: 0,
      projectName: 'sonarqube',
      projectId: 'sonarqube',
    },
    {
      leaders: [],
      lifeStatus: 0,
      projectName: 'TscanCode',
      projectId: 'TscanCode',
    },
    {
      leaders: [],
      lifeStatus: 0,
      projectName: 'ESLint',
      projectId: 'ESLint',
    },
  ];
}

export async function getRepositoryScanStatus(
  params: {
    repo_uuids?: string;
    page?: number;
    ps?: number;
  },
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}/issue/scan-statuses`;
  return get(`${url}?${stringify(params)}`, '', signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.RepoScanStatus[]>(url))
    .catch(createHandleCatched(url));
}

export function getIssueFailed(
  params: {
    repo_uuid: string;
  },
  token: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}issue/scan/failed`;
  return get(`${url}?${stringify(params)}`, token, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        [commitId: string]: string;
      }>(url),
    )
    .catch(createHandleCatched(url));
}

export function getIssueIntroducers(
  repo: string,
  token: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}issue/issue-introducers`;
  const params = repo ? { repo_uuids: repo } : {};
  return get(`${url}?${stringify(params)}`, '', signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<string[]>(url))
    .catch(createHandleCatched(url));
}

export function getIssueStatusList(userToken: string) {
  const url = `${baseUrl}issue/issue-status`;
  return get(url, '')
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}

export function getIssuePriorityList(userToken: string) {
  const url = `${baseUrl}issue/issue-severities`;
  return get(url, '')
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}
export function getIssueTypesCount(
  params: API.IssueFilterSearchParams,
  userToken?: string,
) {
  const statusOrManualStatus = Array.isArray(params.status)
    ? params.status?.reduce(
        (acc, status) => {
          if (status === 'Open' || status === 'Solved') {
            acc.status.push(status);
          } else {
            acc.manual_status.push(status);
          }
          return acc;
        },
        { status: [] as string[], manual_status: [] as string[] },
      )
    : '';
  const url = `${baseUrl}issue/filter/sidebar`;
  const totalParams = {
    ...params,
    ...statusOrManualStatus,
  };
  return get(`${url}?${stringify(totalParams)}`, '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.SideMenuItem[]>(url))
    .catch(createHandleCatched(url));
}

export function getIssueListBySearch(
  params: API.IssueFilterSearchParams,
  userToken: string,
) {
  const url = `${baseUrl}issue/filter`;
  const statusOrManualStatus = Array.isArray(params.status)
    ? params.status?.reduce(
        (acc, status) => {
          if (status === 'Open' || status === 'Solved') {
            acc.status.push(status);
          } else {
            acc.manual_status.push(status);
          }
          return acc;
        },
        { status: [] as string[], manual_status: [] as string[] },
      )
    : '';
  const totalParams = {
    ...params,
    ...statusOrManualStatus,
  };
  return get(`${url}?${stringify(totalParams)}`, '')
    .then(handleError)
    .then((d) => {
      return d as any;
    })
    .then(
      createHandleResponse<{
        issueList: API.IssueItem[];
        total: number;
      }>(url),
    )
    .catch(createHandleCatched(url));
}

// function getLatestIssue(
//   data: API.RawIssueHistoryItem[],
// ): API.RawIssueHistoryItem {
//   let index = 0;
//   for (let i = 0; i < data.length; i++) {
//     if (data[i].location?.length !== 0) {
//       index = i;
//       break;
//     }
//   }
//   return data[index];
// }

export const getRawIssueHistoryInfo = (
  issueUuid: string,
  userToken: string,
) => {
  const url = `${baseUrl}raw-issue`;
  return get(`${url}?issue_uuid=${issueUuid}`, '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.RawIssueHistoryItem[]>(url));
};

// TODO: 前端接口测试
export function putIgnoreIssueList(
  ignoreRecords: API.IgnoreItem[],
  token: string,
) {
  const url = `${baseUrl}issue/ignore/list`;
  return put(url, ignoreRecords, token)
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .then((data) => {
      return data !== null;
    })
    .catch(createHandleCatched(url));
}

// 下载 缺陷总览表格
export function downloadExcel(
  params: API.IssueFilterSearchParams,
  userToken?: string,
) {
  const url = `${baseIp}:8005/issue/filter/download`;
  return download(
    `${url}?${stringify({ ...params, manual_status: 'Default' })}`,
    '',
  )
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

export function getStaticIssueAnalysisList(
  params: API.StaticIssueAnalysisSearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}issue/risk`;
  return get(`${url}?${stringify(params)}`, '')
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<API.TableListResponse<API.StaticIssueAnalysisItem>>(
        url,
      ),
    )
    .catch(createHandleCatched(url));
}

export function downloadStaticIssueAnalysisListExcel(
  params: API.StaticIssueAnalysisSearchParams,
  userToken: string,
) {
  const url = `${baseUrl}issue/risk/download`;
  return download(`${url}?${stringify(params)}`, '')
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

export async function getRawIssueDiff(
  params: {
    pre_commit: string;
    cur_commit: string;
    repo_uuid: string;
    file_path: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}raw-issue/diff`;
  return get(`${url}?${stringify(params)}`, '')
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{
        preRawIssues: API.RawIssueHistoryItem[];
        curRawIssues: API.RawIssueHistoryItem[];
      }>(url),
    )
    .catch(createHandleCatched(url));
}
type SearchParams = {
  project_ids?: string;
  since?: string;
  until: string;
  interval?: 'week' | 'month' | 'year' | 'day';
  detail?: boolean;
};

export async function getLivingIssueForGraph(
  params: SearchParams,
  userToken?: string,
) {
  const url = `${baseUrl}issue/living-issue-tendency`;
  return get(`${url}?${stringify(params)}`, '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<LivingIssueProjectViewData[]>(url))
    .catch(createHandleCatched(url));
}

export async function postScanRepo(data: FormData, userToken?: string) {
  const url = `${baseUrl}issue/scan`;
  return request(url, {
    method: 'POST',
    headers: {
      ...(userToken ? { token: '' } : {}),
    },
    data,
  })
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

export type ScanServiceParams = {
  repoUuid?: string;
  branch?: string;
  beginCommit?: string;
};
export async function postRescanIssue(
  data: ScanSeriveceParams,
  userToken?: string,
) {
  const url = `${baseUrl}issue/re-scan`;
  return post(url, data, '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
