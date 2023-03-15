import { getRepoMetricStandard, getUsers } from './setting';

beforeEach(() => {
  console.error = jest.fn();
});

describe('设置相关接口测试', () => {
  test('/user/status/getData', async () => {
    const resp = await getUsers({
      account_status: 1,
      page: 1,
      ps: 10,
    });
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/repo-metric', async () => {
    const resp = await getRepoMetricStandard({
      repo_uuid: '6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
    });
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
