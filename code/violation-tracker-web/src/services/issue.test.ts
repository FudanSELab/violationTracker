import {
  downloadExcel,
  downloadStaticIssueAnalysisListExcel,
  getIssueFailed,
  getIssueIntroducers,
  getIssueListBySearch,
  getIssuePriorityList,
  getIssueStatusList,
  getIssueTypesCount,
  getRawIssueHistoryInfo,
  getStaticIssueAnalysisList,
} from './issue';

beforeEach(() => {
  console.error = console.log;
  // console.warn = jest.useFakeTimers;
});

describe('缺陷服务相关接口测试', () => {
  test('/issue/scan/failed', async () => {
    const resp = await getIssueFailed(
      {
        repo_uuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/issue-introducers', async () => {
    const resp = await getIssueIntroducers(
      'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/issue-status', async () => {
    const resp = await getIssueStatusList('ec15d79e36e14dd258cfff3d48b73d35');
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/issue-severities', async () => {
    const resp = await getIssuePriorityList('ec15d79e36e14dd258cfff3d48b73d35');
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/filter/sidebar', async () => {
    const resp = await getIssueTypesCount(
      {
        types: 'String literals should not be duplicated',
        project_names: '平台',
        detail: false,
        page: 1,
        ps: 10,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/filter', async () => {
    const resp = await getIssueListBySearch(
      {
        detail: false,
        page: 1,
        ps: 10,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
    expect(resp).not.toEqual(true);
    expect(typeof resp !== 'boolean' ? resp?.total : -1).toBeGreaterThanOrEqual(
      0,
    );
  }, 60000);

  test('/raw-issue', async () => {
    const resp = await getRawIssueHistoryInfo(
      'c0e9c736-7f2d-466c-9e5d-eb73c94fa63c',
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  // test('/issue/ignore/list', async () => {
  //   const resp = await putIgnoreIssueList(
  //     [],
  //     'ec15d79e36e14dd258cfff3d48b73d35',
  //   );
  //   expect(resp).not.toEqual(null);
  // }, 60000);

  test('/issue/filter/download', async () => {
    const resp = await downloadExcel(
      {
        page: 1,
        ps: 10,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/risk', async () => {
    const resp = await getStaticIssueAnalysisList(
      {
        page: 1,
        ps: 10,
        // repo_uuids: 'c28a14bc-8236-11eb-9988-b1d413682f00',
        project_names: '平台',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/issue/risk/download', async () => {
    const resp = await downloadStaticIssueAnalysisListExcel(
      {
        page: 1,
        ps: 10,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
