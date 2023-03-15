import { notification } from 'antd';
import { parse, stringify } from 'query-string';
import { extend } from 'umi-request';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};
/**
 * 异常处理程序
 */
const errorHandler = (error: { response: Response }) => {
  const { response } = error;
  if (response && response.status) {
    //@ts-ignore
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    if (status === 200) {
      return error;
    }
    notification.error({
      message: `请求错误 ${status}: ${url}`,
      description: errorText,
    });
  }

  // if (!response) {
  // notification.error({
  //   description: '请求超时或被中止',
  //   message: '请求失败',
  // });
  // console.error({
  //   description: '请求超时或被中止',
  // });
  // }
  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  throw error;
};

const request = extend({
  timeout: 600000, // 60s * 10
  errorHandler,
});

// 使用 parse -> stringify 转义字符功能
function encodeQueryParams(str: string) {
  const [url, uri] = str.split('?');
  const query = parse(uri);
  return url + '?' + stringify(query);
}

function LoginGet(url: string) {
  const urlencode = encodeQueryParams(url);
  // const urlencode = url;
  return request(urlencode, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function get(url: string, userToken?: string, signal?: AbortSignal | null) {
  const urlencode = encodeQueryParams(url);
  // const urlencode = url;
  return request(urlencode, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(userToken ? { token: userToken } : {}),
    },
    signal: signal,
  });
  // .then((response) => {
  //   return handleResponse(url, response);
  // })
  // .catch((err) => {
  //   console.error(`Request failed. Url = ${url} . Message = ${err}`);
  //   return null;
  // })
}

function download(url: string, userToken?: string) {
  const urlencode = encodeQueryParams(url);
  return request(urlencode, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(userToken ? { token: userToken } : {}),
    },
    responseType: 'blob',
    getResponse: true,
  });
}

function getWithoutHeaders(url: string, signal?: AbortSignal) {
  const urlencode = encodeQueryParams(url);
  // const urlencode = url;
  return request(urlencode, {
    method: 'GET',
    signal,
  });
  // .then((response) => {
  //   return handleResponse(url, response);
  // })
  // .catch((err) => {
  //   console.error(`Request failed. Url = ${url} . Message = ${err}`);
  //   return null;
  // })
}

function post(
  url: string,
  data: Object,
  userToken?: string,
  signal?: AbortSignal | null,
) {
  console.log('111');
  console.log(data);
  return request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(userToken ? { token: userToken } : {}),
    },
    body: JSON.stringify(data),
    signal: signal,
  });
  // .then((response) => {
  //   return handleResponse(url, response);
  // })
  // .catch((err) => {
  //   console.error(`Request failed. Url = ${url} . Message = ${err}`);
  //   return null;
  // })
}

// function postNoUserToken(url: string, data: Object) {
//   return request(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(data),
//   })
//     .then((response) => {
//       return handleResponse(url, response);
//     })
//     .catch((err) => {
//        console.error(`Request failed. Url = ${url} . Message = ${err}`);
//       return null;
//     });
// }

function postFile(
  url: string,
  data:
    | string
    | Blob
    | ArrayBufferView
    | ArrayBuffer
    | FormData
    | URLSearchParams
    | ReadableStream<Uint8Array>
    | null,
  userToken?: string,
) {
  return request(url, {
    method: 'POST',
    headers: {
      // 'Content-Type': 'application/vnd.ms-excel',
      // 'Content-Type':'multipart/form-data',
      ...(userToken ? { token: userToken } : {}),
    },
    body: data,
  });
  // .then((response) => {
  //   return handleResponse(url, response);
  // })
  // .catch((err) => {
  //   console.error(`Request failed. Url = ${url} . Message = ${err}`);
  //   return null;
  // })
}

function put(url: string, data?: Object, userToken?: string) {
  return request(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(userToken ? { token: userToken } : {}),
    },
    body: JSON.stringify(data),
  });
  // .then((response) => {
  //   return handleResponse(url, response);
  // })
  // .catch((err) => {
  //   console.error(`Request failed. Url = ${url} . Message = ${err}`);
  //   return null;
  // })
}

function requestDelete(url: string, userToken?: string) {
  return request(url, {
    method: 'Delete',
    headers: {
      ...(userToken ? { token: userToken } : {}),
    },
  });
  // .then((response) => {
  //   return handleResponse(url, response);
  // })
  // .catch((err) => {
  //   console.error(`Request failed. Url = ${url} . Message = ${err}`);
  //   return null;
  // })
}

function listDelete(
  url: string,
  data?:
    | string
    | Blob
    | ArrayBufferView
    | ArrayBuffer
    | FormData
    | URLSearchParams
    | ReadableStream<Uint8Array>
    | null,
  userToken?: string,
) {
  return request(url, {
    method: 'Delete',
    headers: {
      ...(userToken ? { token: userToken } : {}),
    },
    body: data,
  });
  // .then((response) => {
  //   return handleResponse(url, response);
  // })
  // .catch((err) => {
  //   console.error(`Request failed. Url = ${url} . Message = ${err}`);
  //   return null;
  // })
}

// function handleResponse(url: string, response: Response) {
//   if (response.status < 500) {
//     return response.json();
//   } else {
//     console.error(
//       `Request failed. Url = ${url} . Message = ${response.statusText}`,
//     );
//     return { error: { message: 'Request failed due to server error ' } };
//   }
// }

export {
  get,
  post,
  put,
  requestDelete,
  LoginGet,
  listDelete,
  postFile,
  // postNoUserToken,
  getWithoutHeaders,
  download,
};
