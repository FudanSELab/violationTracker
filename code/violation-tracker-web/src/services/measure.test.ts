import {
  getChangeFileNumData,
  getCloneData,
  getCodeQualityData,
  getCommitData,
  getCommitStandardData,
  getCurrentMeasureData,
  getDeveloperListByRepoUuid,
  getIssueTypeCountData,
  getLatestCloneData,
  getLifeCycleData,
  getLineCountData,
  getLineCountTree,
  getSelfIssueLifeCycleForDevelopers,
  getWorkloadData,
} from './measure';

beforeEach(() => {
  console.error = jest.fn();
});

describe('measure相关接口测试', () => {
  test('/user/developers', async () => {
    const resp = await getDeveloperListByRepoUuid(
      {
        asc: true,
        order: 'developerName',
        repo_uuids: '',
        page: 1,
        ps: 10,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/developer/work-load', async () => {
    const resp = await getWorkloadData(
      {
        developers: 'songr0,yuping,Guicheng Wang,shaoxi,zhangjingfu',
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
        since: '2020-09-02',
        until: '2021-09-02',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/codewisdom/issue/developer/code-quality', async () => {
    const resp = await getCodeQualityData(
      {
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
        since: '2020-09-02',
        until: '2021-09-02',
      },
      true,
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/codewisdom/code/lifecycle', async () => {
    const resp = await getLifeCycleData(
      {
        asc: true,
        developers: 'yuping',
        repo_uuids: '',
        since: '',
        until: '',
      },
      'live',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/codewisdom/code/line-count', async () => {
    const resp = await getLineCountData(
      {
        developers: 'yuping',
        repo_uuids: '',
        since: '',
        until: '',
      },
      'developer',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/codewisdom/code/line-count-tree', async () => {
    const resp = await getLineCountTree({
      developers: 'yuping',
      type: 'loss',
    });
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/statistics/focus/file/num', async () => {
    const resp = await getChangeFileNumData(
      {
        developers: 'songr0,yuping,Guicheng Wang,shaoxi,zhangjingfu',
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
        since: '2020-09-02',
        until: '2021-09-02',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/commit-standard', async () => {
    const resp = await getCommitStandardData(
      {
        developers: 'songr0,yuping,Guicheng Wang,shaoxi,zhangjingfu',
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
        since: '2020-09-02',
        until: '2021-09-02',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/codewisdom/issue/developer-data/living-issue-count/self', async () => {
    const resp = await getSelfIssueLifeCycleForDevelopers({
      developers: 'songr0,yuping,Guicheng Wang,shaoxi,zhangjingfu',
      repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      percent: -2,
      status: 'living',
      tool: 'sonarqube',
      target: 'self',
      since: '2020-09-02',
      until: '2021-09-02',
      page: 1,
      ps: 10,
    });
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/cloneMeasure', async () => {
    const resp = await getCloneData(
      {
        developers: 'yuping',
        repo_uuids: '',
        since: '',
        until: '',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/repository', async () => {
    const resp = await getCommitData(
      {
        granularity: 'day',
        repo_uuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
        since: '2021-09-01',
        until: '2021-09-01',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/repository/current/repo-measure', async () => {
    const resp = await getCurrentMeasureData(
      {
        repo_uuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/cloneMeasure/latestCloneLines', async () => {
    const resp = await getLatestCloneData(
      'a140dc46-50db-11eb-b7c3-394c0d058805',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measurement/issue-type-counts', async () => {
    const resp = await getIssueTypeCountData(
      {
        repo_uuids: '6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        tool: 'sonarqube',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
