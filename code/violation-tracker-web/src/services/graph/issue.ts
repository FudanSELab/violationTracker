import { get } from '@/request';
import { baseUrl } from '@/urlConfig';
import { stringify } from 'query-string';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../../utils/response';

export type IssueBarData = {
  issueType: string;
  quantity: number; // 总数 solved + open
  solved: number;
  open: number;
};

export async function getIssueTop5Data(
  params: {
    developer: string;
    order?: 'quantity' | 'solved' | 'open';
    tool?: string;
  },
  userToken: string,
) {
  const url = `${baseUrl}issue/top5`;
  return get(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<IssueBarData[]>(url))
    .catch(createHandleCatched(url));
}

export type ProjectViewData<T> = {
  projectId: string;
  projectName: string;
  date: string;
  option?: T[];
  [key: string]: any;
};
export type LivingIssueDetailItem = {
  issueUuid: string;
  type: string;
  repoName: string;
  branch: string;
  startCommitDate: string;
  targetFiles: string;
};
export type LivingIssueProjectViewData = {
  num: number;
} & ProjectViewData<LivingIssueDetailItem>;
