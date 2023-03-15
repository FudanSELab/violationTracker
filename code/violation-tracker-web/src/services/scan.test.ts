import {
  getRepositoryScanStatus,
  getRepositoryServiceScanValues,
  getScanTools,
} from './scan';

beforeEach(() => {
  console.error = jest.fn();
});

describe('代码库(repository)相关接口测试', () => {
  test('/scan/status', async () => {
    const resp = await getRepositoryScanStatus(
      {
        repo_uuids: '7213b81e-2401-11eb-8dca-4dbb5f7a5f33',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('scan/repository/tool', async () => {
    const resp = await getRepositoryServiceScanValues(
      {
        repo_uuid: '7213b81e-2401-11eb-8dca-4dbb5f7a5f33',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/tool', async () => {
    const resp = await getScanTools('ec15d79e36e14dd258cfff3d48b73d35');
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
