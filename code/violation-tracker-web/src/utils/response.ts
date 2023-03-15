import { message } from 'antd';

export const handleError = <T>(
  d: { error?: { message: any } } & API.Response<T>,
): API.Response<T> => {
  if (d.error) {
    throw new Error(JSON.stringify(d.error.message));
  } else {
    return d;
  }
};

export const createHandleCatched = (url: string): ((error: Error) => null) => {
  return (error) => {
    if (console) console.error(url, error);
    return null;
  };
};

export function createHandleResponse<T>(
  url: string,
): (resp: API.Response<T>) => T | null | true {
  return ({ code, msg, data }: API.Response<T>) => {
    if (code !== 200) {
      if (console) console.error(msg ?? `Fetch ${url} failed`);
      return null;
    } else {
      if (!data) message.success(msg ?? 'Success!');
      return data ?? true;
    }
  };
}
