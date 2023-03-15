import { stringify } from 'query-string';
import { requestDelete } from '../request';
import { baseUrl } from '../urlConfig';
import {
  createHandleCatched,
  createHandleResponse,
  handleError,
} from '../utils/response';

// export async function getIgnoreList(params: {}, userToken: string) {
//   const url = `${baseUrl}repository`;
//   return get(`${url}?${stringify(params)}`, userToken)
//     .then(handleError)
//     .then((d) => d as any)
//     .then(createHandleResponse<any[]>(url))
//     .catch(createHandleCatched(url));
// }

export async function deleteIgnore(
  params: {
    'repo-id': string;
    level: string;
    type: string;
    tool: string;
  },
  userToken: string,
) {
  const url = `${baseUrl}repository`;
  return requestDelete(`${url}?${stringify(params)}`, userToken)
    .then(handleError)
    .then((d) => d as any)
    .then(createHandleResponse<null>(url))
    .catch(createHandleCatched(url));
}
