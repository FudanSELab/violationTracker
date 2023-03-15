import { Project, ProjectWithId } from '@/models/projectStore';
import { stringify } from 'query-string';
import { get, post, put, requestDelete } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

// TODO: 前端接口测试
export function checkUpdateAndScanning(
  params: { repo_uuid?: string },
  userToken: string,
) {
  const url = `${baseUrl}code?${stringify(params)}`;
  return post(url, '', userToken)
    .then((pack) => {
      if (pack.error) {
        console.error(pack.error);
        return false;
      }
      if (pack.code === 200) {
        return pack.data === 'Updated';
      } else {
        console.error(pack.msg ?? '获取 repository 数据失败');
        return false;
      }
    })
    .catch((error) => {
      console.error('获取 repository 数据失败', error);
      return false;
    });
}

// todo
export async function getProjectList(
  // 2 -> 已结项项目
  // 1 -> 未结项项目
  // 0 -> 全部项目
  params: { life_status?: API.ProjectLifeStatus },
  userToken: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}project/list`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.ProjectItem[]>(url))
    .catch(createHandleCatched(url));
}

export function getAllProjectsWithId(token?: string, signal?: AbortSignal) {
  const url = `${baseUrl}project/all-id`;
  return get(url, token, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<ProjectWithId>(url))
    .catch(createHandleCatched(url));
}

export function getAllProject(token?: string, signal?: AbortSignal) {
  return get(`${baseUrl}project/all`, token, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<Project>('project/all'))
    .catch(createHandleCatched('project/all'));
}

// TODO: 前端接口测试
export function addProjectByProjectName(
  projectName: string,
  token?: string,
  signal?: AbortSignal,
) {
  return post(
    `${baseUrl}project?project_name=${projectName}`,
    '',
    token,
    signal,
  )
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>('project'))
    .catch(createHandleCatched('project'));
}
// TODO: 前端接口测试
export function deleteProjectByProjectName(
  projectName: string,
  token?: string,
  signal?: AbortSignal,
) {
  return (
    requestDelete(`${baseUrl}project?project_name=${projectName}`, token)
      .then(handleError)
      .then((d) => d as any)
      // .then(createHandleResponse<any>('project/info'))
      .catch(createHandleCatched('project/info'))
  );
}
// TODO: 接口测试
export async function deleteProjectByUuid(uuid: string, userToken: string) {
  const url = `${baseUrl}project`;
  return requestDelete(`${url}/${uuid}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any[]>(url))
    .catch(createHandleCatched(url));
}

// 没有用到的接口
// export function getProjectInfoByAccountName(
//   accountName: string,
//   token?: string,
//   signal?: AbortSignal,
// ) {
//   return (
//     get(`${baseUrl}project/info?accountName=${accountName}`, token, signal)
//       .then(handleError)
//       .then((d) => d as any)
//       .then((d: { account_name: string; project_name: string }[]) => {
//         return d
//           .filter(({ account_name }) => account_name === accountName)
//           .map(({ project_name }) => project_name);
//       })
//       // .then(createHandleResponse<any>('project/info'))
//       .catch(createHandleCatched('project/info'))
//   );
// }

// export function getDeveloperList(token: string, repoIds?: string) {
//   return get(
//     `${baseUrl}measure/developer-list` +
//       (repoIds ? `?repo_uuids=${repoIds}` : ''),
//     token,
//   )
//     .then(handleError)
//     .then((d) => d as any)
//     .then(createHandleResponse<API.DeveloperItem[]>('measure/developer-list'))
//     .catch(createHandleCatched('measure/developer-list'));
// }

// TODO: 前端接口测试
export async function addAccountForProject(
  params: { newLeaderId: string; projectId: string },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}project/leader?${stringify(params)}`;
  return post(url, params, userToken, signal)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function deleteAccountForProject(
  params: {
    LeaderId: string;
    projectId: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}project/leader`;
  return requestDelete(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function changeProjectName(
  params: {
    old_project_name: string;
    new_project_name: string;
  },
  userToken: string,
) {
  const url = `${baseUrl}project`;
  return put(`${url}?${stringify(params)}`, {}, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function putProjectLifeStatus(
  params: { life_status: API.ProjectLifeStatus; project_name: string },
  userToken?: string,
) {
  const url = `${baseUrl}project/life-status`;
  return put(`${url}?${stringify(params)}`, {}, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.ProjectLifeStatus>(url))
    .catch(createHandleCatched(url));
}
