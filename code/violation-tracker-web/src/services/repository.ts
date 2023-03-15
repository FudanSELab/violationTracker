import { stringify } from 'query-string';
import request from 'umi-request';
import { post, put, requestDelete } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

export async function postLocalImportRepo(
  params: {
    path: string;
    project_name: string;
    addCommitTime: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}repo/add-path`;
  return request(url, {
    method: 'POST',
    headers: {
      ...(userToken ? { token: userToken } : {}),
    },
    params,
  })
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

export async function postLocalImportMultiRepo(
  params: {
    project_name: string;
  },
  data: FormData,
  userToken?: string,
) {
  const url = `${baseUrl}repo/multi-add`;
  return request(url, {
    method: 'POST',
    headers: {
      ...(userToken ? { token: userToken } : {}),
    },
    data,
    params,
    requestType: 'form',
  })
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

// 根据命令行添加库
export async function postImportRepoByRepoCommand(
  data: {
    command: string;
    projectName: string;
    repoSource: string;
    privateRepo: boolean;
    addCommitTime: string;
  },
  // data: FormData,
  params?: { scan: boolean },
  userToken?: string,
) {
  const url = `${baseUrl}repo`;
  return request(url, {
    method: 'POST',
    headers: {
      ...(userToken ? { token: userToken } : {}),
    },
    data,
    params,
    requestType: 'json',
  })
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

// 根据命令行添加库信息
export async function postImportRepoByGitCommand(
  data: {
    command: string;
    projectName: string;
    repoSource: string;
    privateRepo: boolean;
    addCommitTime: string;
  },
  // data: FormData,
  userToken?: string,
) {
  const url = `${baseUrl}repo/add`;
  return request(url, {
    method: 'POST',
    headers: {
      ...(userToken ? { token: userToken } : {}),
    },
    data,
    requestType: 'json',
  })
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

// 根据命令行下载库
// 只有Git命令行需要
export async function postDownloadRepoByCommand(
  params: {
    // command: string;
    url: string;
    branch: string;
    re_download?: 0 | 1;
    scan?: boolean;
  },
  userToken?: string,
) {
  const url = `${baseUrl}repo/download`;
  return request(url, {
    method: 'POST',
    headers: {
      ...(userToken ? { token: userToken } : {}),
    },
    params,
    requestType: 'form',
  })
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function postRepository(
  data: {
    url: string;
    repoName: string;
    privateRepo: boolean;
    projectName: string;
    username?: string;
    password?: string;
    branch: string;
    repoSource: string;
    addCommitTime: string;
  },
  userToken: string,
) {
  const url = `${baseUrl}repo/add`;
  return post(`${url}`, data, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

export async function postDownloadRepository(
  params: {
    url: string;
    branch: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}repo/download`;
  return post(
    `${url}?${stringify({ ...params, re_download: 1 })}`,
    {},
    userToken,
  )
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function putRepository(
  data: {
    oldRepoName: string;
    newRepoName: string;
    repoUuid: string;
  },
  userToken: string,
) {
  const url = `${baseUrl}repo`;
  return put(`${url}`, data, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
// 没用到
// export async function postMultipleRepositoryByFile(
//   data: FormData,
//   userToken: string,
// ) {
//   const url = `${baseUrl}project/multiple`;
//   return postFile(url, data, userToken ?? '')
//     .then(handleError)
//     .then((d) => d as any)
//     .then(createHandleResponse<null>(url))
//     .catch(createHandleCatched(url));
// }

// TODO: 前端接口测试
export async function putProjectOfRepository(
  data: {
    oldProjectName: string;
    newProjectName: string;
    repoUuid: string;
  },
  userToken: string,
) {
  const url = `${baseUrl}repo`;
  return put(`${url}`, data, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function updateRepositoryRecycleStatus(
  params: {
    recycled: 0 | 100000000; // 当前回收状态 0：不在回收站；100000000：在回收站
    repo_uuid: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}repo/recycle`;
  return put(`${url}?${stringify(params)}`, {}, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any[]>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
// export async function deleteRepoByRepoUuidHard(
//   repo_uuid: string,
//   userToken?: string,
// ) {
//   const url = `${baseUrl}repo?${stringify({ repo_uuid })}`;
//   return requestDelete(url, userToken)
//     .then(handleError)
//     .then((d) => d as any)
//     .then(createHandleResponse<any[]>(url))
//     .catch(createHandleCatched(url));
// }

// TODO: 前端接口测试
export async function deleteRepoFromRecycleByRepoUuidSoft(
  repoUuid: string,
  userToken?: string,
) {
  const url = `${baseUrl}repo?${stringify({ repo_uuid: repoUuid })}`;
  return requestDelete(url, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any[]>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
// export async function deleteRepoFromRecycleByRepoUuidHard(
//   repoUuid: string,
//   userToken?: string,
// ) {
//   const url = `${baseUrl}repo/project?${stringify({ repo_uuid: repoUuid })}`;
//   return requestDelete(url, userToken)
//     .then(handleError)
//     .then((d) => d as any)
//     .then(createHandleResponse<any[]>(url))
//     .catch(createHandleCatched(url));
// }
