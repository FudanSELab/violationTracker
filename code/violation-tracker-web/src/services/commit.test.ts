import {
  getCommitHistoryInfoList,
  getCommitList,
  getCommitOverStockList,
  getCommitStandardList,
  getCommitterList,
} from './commit';

beforeEach(() => {
  console.error = jest.fn();
});

describe('提交规范性相关接口测试', () => {
  test('/measure/commit-standard/committers', async () => {
    const resp = await getCommitterList('', 'ec15d79e36e14dd258cfff3d48b73d35');
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/commit-standard/detail', async () => {
    const resp = await getCommitStandardList({
      page: 1,
      ps: 10,
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  // test('/measure/commit-standard/detail/download', async () => {
  //   const resp = await downloadExcel({
  //     page: 1,
  //     ps: 10,
  //   });
  //   expect(resp).not.toEqual(null);
  // }, 60000);

  test('/issue/commit-list', async () => {
    const resp = await getCommitList(
      {
        ps: 10,
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/commit-list', async () => {
    const resp = await getCommitOverStockList(
      {
        ps: 0,
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/development-history/commit', async () => {
    const resp = await getCommitHistoryInfoList(
      {
        repo_uuid: '6b90a778-0596-11ec-9cd5-111bf661566f',
        since: '2021-09-01 09:00:00',
        until: '2021-09-16 09:00:00',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  // test('/scan', async () => {
  //   const resp = await postCommitScan(
  //     {
  //       projectId: 'aa912c3b-d344-4a94-80a1-ac2f80407e77',
  //       category: '',
  //       commitId: 'a820e79512b67b1bfda20bdc32b47086d2b0910d',
  //     },
  //     'ec15d79e36e14dd258cfff3d48b73d35',
  //   );
  //   expect(resp).not.toEqual(null);
  // }, 60000);
});

export {};
