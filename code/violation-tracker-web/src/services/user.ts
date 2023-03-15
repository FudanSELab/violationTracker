import { message } from 'antd';
import { Base64 } from 'js-base64';
import { stringify } from 'query-string';
import { get, LoginGet, post, put } from '../request';
import { baseUrl } from '../urlConfig';
import { isEmail } from '../utils/check';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

export async function checkAccountName(value: string, userToken?: string) {
  const url = `${baseUrl}account/check-name`;
  return get(`${url}?${stringify({ accountName: value })}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<any>(url))
    .catch(createHandleCatched(url));
}

export async function getAccountByName(
  params: { account_name: string; need_admin?: boolean },
  userToken?: string,
  signal?: AbortSignal,
) {
  const url = `${baseUrl}account/name`;
  return get(`${url}?${stringify(params)}`, userToken, signal)
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .then((d) => d as API.Account)
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function postAccountList(list: string[], userToken?: string) {
  const url = `${baseUrl}account/update`;
  return post(`${url}`, list, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<string[]>(url))
    .catch(createHandleCatched(url));
}

export function login(values: { usernameOrEmail: string; password: string }) {
  let GetUrl = '';
  if (isEmail(values.usernameOrEmail)) {
    GetUrl =
      `${baseUrl}account/login?email=` +
      values.usernameOrEmail +
      '&password=' +
      Base64.encode(values.password);
  } else {
    GetUrl =
      `${baseUrl}account/login?username=` +
      values.usernameOrEmail +
      '&password=' +
      Base64.encode(values.password);
  }
  return LoginGet(GetUrl)
    .then(handleError)
    .then(createHandleResponse<any>('user/login'))
    .then((d) => d as API.UserInfo)
    .catch(createHandleCatched('user/login'));
}

// TODO: 前端接口测试
export async function resetPassword(params: {
  username: string;
  password: string;
}) {
  const url = `${baseUrl}account/password`;
  return put(`${url}?${stringify(params)}`, {})
    .then(handleError)
    .then(createHandleResponse<any>(url))
    .then((d) => d as API.UserInfo)
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function mergeAccounts(
  params: {
    major_name: string;
    sub_name: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}account/merge`;
  return put(`${url}?${stringify(params)}`, {}, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<string[]>(url))
    .catch(createHandleCatched(url));
}

export async function checkEmail(
  params: {
    email: string;
  },
  userToken?: string,
) {
  const url = `${baseUrl}account/check-email`;
  return get(`${url}?${stringify(params)}`, userToken ?? '')
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<boolean>(url))
    .catch(createHandleCatched(url));
}

// TODO: 前端接口测试
export async function register(data: {
  accountName: string;
  password: string;
  email: string;
}) {
  const url = `${baseUrl}account`;
  return post(`${url}`, data)
    .then(handleError)
    .then((d) => d as any)
    .then((d) => {
      if (d.code !== 200) {
        message.error(d.msg ?? `获取 ${url} 数据失败`);
      }
      return d;
    })
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
