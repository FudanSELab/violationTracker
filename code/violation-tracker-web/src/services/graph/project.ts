import { get } from '@/request';
import { baseUrl } from '@/urlConfig';
import { stringify } from 'query-string';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../../utils/response';

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
