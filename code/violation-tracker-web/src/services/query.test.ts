import { queryFilesOrMethods } from './query';

beforeEach(() => {
  console.error = jest.fn();
});

describe('query相关接口测试', () => {
  test('/codewisdom/code/list', async () => {
    const resp = await queryFilesOrMethods({
      repo_uuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      key: 'a',
      level: 'method',
      page: 1,
      ps: 50,
    });
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
