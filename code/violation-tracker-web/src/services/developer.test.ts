import {
  getDeveloperRecentCommit,
  getWorkFocusTreeList,
  getDeveloperListByProjectNames,
  getDeveloperLivingIssueList,
  getDeveloperCCNList,
  getDeveloperCodeStabilityList,
  getDeveloperCommitStandardList,
  getDeveloperCloneLineList,
  getDeveloperBigMethodsList,
  getDeveloperDataWorkLoadList,
  getDeveloperDesignContributionList,
  getDeveloperCompletedJiraList,
  getDeveloperIssueLifecycleList,
  getDeveloperCommitRank,
  getDeveloperLocRank,
  getDeveloperCodeLineRank,
  getDeveloperJiraMission,
  getDeveloperCompetenceOfCommitStandard,
  getDeveloperCompetenceOfStatement,
  getDeveloperCompetenceOfIssue,
  getDeveloperCompetenceOfClone,
  getDeveloperCompetenceOfJira,
} from './developer';

beforeEach(() => {
  console.error = jest.fn();
  // console.warn = jest.useFakeTimers;
});

describe('开发者相关接口测试', () => {
  test('/measure/developer/recent-news', async () => {
    const resp = await getDeveloperRecentCommit(
      {
        developer: 'yuping',
        since: '2020-09-02',
        until: '2021-09-02',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/statistics/committer/temp/focus', async () => {
    const resp = await getWorkFocusTreeList(
      {
        developer: 'yuping',
        since: '2020-09-02',
        until: '2021-09-02',
        page: 1,
        ps: 10,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/user/developers', async () => {
    const resp = await getDeveloperListByProjectNames(
      {
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/developer/data/living-issue', async () => {
    const resp = await getDeveloperLivingIssueList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/codewisdom/code/developer/ccn-change', async () => {
    const resp = await getDeveloperCCNList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/codewisdom/code/stable', async () => {
    const resp = await getDeveloperCodeStabilityList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/developer/data/commit-standard', async () => {
    const resp = await getDeveloperCommitStandardList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/clone/developer/clone-line', async () => {
    const resp = await getDeveloperCloneLineList(
      {
        asc: true,
        developers: 'yuping',
        repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
        ps: 10,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/codewisdom/code/method/line', async () => {
    const resp = await getDeveloperBigMethodsList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/developer/data/work-load', async () => {
    const resp = await getDeveloperDataWorkLoadList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/codewisdom/code/design-contribution', async () => {
    const resp = await getDeveloperDesignContributionList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/jira/data/completed-jira-num', async () => {
    const resp = await getDeveloperCompletedJiraList(
      {
        asc: false,
        developers:
          'Guitenbay,SunYuJie,hzy,songr0,heyue,zwj,Guicheng Wang,Zrq-Q,yuping,zhangjingfu,shaoxi,Keyon-2580,zhoujie',
        repo_uuids:
          'a140dc46-50db-11eb-b7c3-394c0d058805,c28a14bc-8236-11eb-9988-b1d413682f00,6f1170ac-4102-11eb-b6ff-f9c372bb0fcb',
        ps: 50,
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/codewisdom/issue/lifecycle', async () => {
    const resp = await getDeveloperIssueLifecycleList({
      developers: 'yuping',
      percent: -2,
      repo_uuids: '',
      status: 'self_solved',
      target: 'self',
      tool: 'sonarqube',
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/repository/developer-rank/commit-count', async () => {
    const resp = await getDeveloperCommitRank({
      repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      since: '2021-08-02',
      until: '2021-09-02',
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/repository/developer-rank/loc', async () => {
    const resp = await getDeveloperLocRank({
      repo_uuids: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      since: '2021-08-02',
      until: '2021-09-02',
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/statistics/top', async () => {
    const resp = await getDeveloperCodeLineRank({
      repo_uuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      since: '2021-08-02',
      until: '2021-09-02',
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/measure/developer/competence-measure', async () => {
    const resp = await getDeveloperCompetenceOfCommitStandard(
      {
        developer: 'yuping',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/developer/competence-codetracker', async () => {
    const resp = await getDeveloperCompetenceOfStatement(
      {
        developer: 'yuping',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/developer/competence-issue', async () => {
    const resp = await getDeveloperCompetenceOfIssue(
      {
        developer: 'yuping',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/developer/competence-clone', async () => {
    const resp = await getDeveloperCompetenceOfClone(
      {
        developer: 'yuping',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
  test('/measure/developer/competence-jira', async () => {
    const resp = await getDeveloperCompetenceOfJira(
      {
        developer: 'yuping',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  // test('/measure/statement', async () => {
  //   const resp = await getDeveloperAverageCodeLineDayily({
  //     developer: 'yuping',
  //     repo_uuids: '',
  //   });
  //   expect(resp).not.toEqual(null);
  // }, 60000);

  test('/jira/developer-msg', async () => {
    const resp = await getDeveloperJiraMission(
      {
        developer: 'wangguicheng',
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
