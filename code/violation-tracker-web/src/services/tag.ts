import { get, post, put, requestDelete } from '@/request';
import { baseUrl } from '@/urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '@/utils/response';
import { stringify } from 'query-string';

export async function getCodeAddressByRepo(
  params: { repo_uuid: string; file_path?: string },
  userToken?: string,
) {
  const url = `${baseUrl}code/addr`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.FileTreeItems>(url))
    .catch(createHandleCatched(url));
}

// 不知道干嘛的
export async function getCodeListFromFile(
  params: { file_path: string },
  userToken?: string,
) {
  const url = `${baseUrl}code/list`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(
      createHandleResponse<{ file_counts: string; file_list: string[] }>(url),
    )
    .catch(createHandleCatched(url));
}

export async function postSetTagAtFilePaths(
  body: {
    tagId: string;
    repoUuid: string;
    parentDirUuid?: string;
    filePathList: any[];
  },
  userToken: string,
) {
  const url = `${baseUrl}tag/path`;
  return post(`${url}`, body, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>(url))
    .then(createHandleCatched);
}

// 获取标签列表
export async function getTagList(
  params: {
    tag_id?: string;
    tag_name?: string;
    update_time?: string;
    deleted?: number;
  },
  userToken: string,
) {
  const url = `${baseUrl}tag/list`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.TagItems[]>(url))
    .catch(createHandleCatched(url));
}

// 获取单个标签规则
export async function getSimgleTag(tag_id: string, userToken?: string) {
  const url = `${baseUrl}tag/${tag_id}`;
  return get(`${url}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<API.TagItems>(url))
    .catch(createHandleCatched(url));
}

// 添加新的标签
export async function postNewTag(
  params: { name: string; description: string },
  userToken: string,
) {
  const url = `${baseUrl}tag`;
  return post(`${url}?${stringify(params)}`, {}, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>(url))
    .then(createHandleCatched);
}

// 删除存在的标签
export async function deleteExistTag(tag_id: string, userToken: string) {
  const url = `${baseUrl}tag/${tag_id}`;
  return requestDelete(`${url}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}

// 修改存在的标签
export async function putEditTag(
  params: {
    // 两个之中一定要改一个
    name?: string;
    description?: string;
    tag_id: string;
  },
  userToken: string,
) {
  const url = `${baseUrl}tag`;
  return put(`${url}?${stringify(params)}`, {}, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}
