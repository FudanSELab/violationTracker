// import { toBeWithinRange } from '../libs/jest-with-assert-type';

import { getProjectCCnLOCDaily, getProjectIssueCount } from './charts';

beforeEach(() => {
  console.error = jest.fn();
});

describe('图表相关接口测试', () => {
  test('/issue/repository/issue-count', async () => {
    const resp = await getProjectIssueCount(
      {
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
        since: '2021-08-01',
        until: '2021-09-01',
        tool: 'sonarqube',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).toBeInstanceOf(Array);
    resp.forEach((item: any) => {
      expect(item).toMatchObject({
        date: expect.any(String),
        newIssueCount: expect.any(Number),
        eliminatedIssueCount: expect.any(Number),
        remainingIssueCount: expect.any(Number),
      });
    });
  }, 60000);

  test('/measure/repository/commit-count&LOC-daily', async () => {
    const resp = await getProjectCCnLOCDaily({
      repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      since: '2021-08-01',
      until: '2021-09-01',
    });
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
