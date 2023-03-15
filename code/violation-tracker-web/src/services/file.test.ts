import {
  downloadExcel,
  getAllDevelopmentHistory,
  getChangedFileList,
  getFileHistoryInfoListByCommitId,
} from './file';

beforeEach(() => {
  console.error = jest.fn();
});

describe('文件数相关接口测试', () => {
  test('/codewisdom/code/file/detail', async () => {
    const resp = await getChangedFileList({
      min: 20,
      page: 1,
      ps: 10,
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/codewisdom/code/file/detail/download', async () => {
    const resp = await downloadExcel({
      min: 20,
      page: 1,
      ps: 10,
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/history/all', async () => {
    const resp = await getAllDevelopmentHistory(
      {
        repo_uuid: '6b90a778-0596-11ec-9cd5-111bf661566f',
        since: '2020-09-02',
        until: '2021-09-02',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/development-history/file', async () => {
    const resp = await getFileHistoryInfoListByCommitId({
      commit_id: 'effaaf056643aa31f92dc84be093d21d69bbc1f1',
    });
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
