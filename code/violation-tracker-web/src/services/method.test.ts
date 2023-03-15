import {
  getMethodList,
  getMethodDiffData,
  retrospectStatementHistories,
  downloadExcel,
  getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation,
} from './method';

beforeEach(() => {
  console.error = jest.fn();
});

describe('圈复杂度相关接口测试', () => {
  test('/codewisdom/code/method/detail', async () => {
    const resp = await getMethodList({
      page: 1,
      ps: 10,
    });
    expect(resp).not.toEqual(null);
  }, 60000);

  // test('/history/issue/method', async () => {
  //   const resp = await getMethodInfosAndCommitInfos(
  //     {''},
  //     'ec15d79e36e14dd258cfff3d48b73d35',
  //   );
  //   expect(resp).not.toEqual(null);
  // }, 60000);

  test('/history/tracker-map', async () => {
    const resp = await getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation({
      issue_uuid: '3ba9b194-7db2-43d3-b5d1-3aef10c978c8',
      repo_uuid: '9330670c-51de-11ec-91d3-25428d7dd7b5',
      type: 'issue',
      page: 1,
      level: 'method',
    });
    expect(resp).toEqual(null);
  }, 60000);

  test('/issue/tracker-map', async () => {
    const resp = await getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation({
      issue_type: 'Generic%20exceptions%20should%20never%20be%20thrown',
      issue_uuid: '053bb6ba-a0c7-412c-a167-bd3e315f2d48',
      level: 'file',
      page: 1,
      repo_uuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      show_all: false,
      type: 'issue',
    });
    expect(resp).toEqual(null);
  }, 60000);

  // test('/history/tracker-chain', async () => {
  //   const resp = await postMethodInfosAndCommitInfos(
  //     {
  //       fileName:
  //         'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //       repoUuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
  //       committer: 'zwj',
  //       commitTime: '2021-07-05T02:52:46.000+0800',
  //       location: [
  //         {
  //           endLine: 346,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 10,
  //           startLine: 346,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getCodeLifeCycle(String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 385,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 4,
  //           startLine: 385,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName: 'getCloneMeasure(String, String, String, String)',
  //         },
  //         {
  //           endLine: 366,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 7,
  //           startLine: 366,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName: 'getFocusFilesCount(String, String, String, String)',
  //         },
  //         {
  //           endLine: 232,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 7,
  //           startLine: 232,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getIssueCountByConditions(String, String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 425,
  //           code: '                url.append("&since=").append(since);\n',
  //           offset: 8,
  //           startLine: 425,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getJiraMsgOfOneDeveloper(String, String, String, String)',
  //         },
  //         {
  //           endLine: 294,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 11,
  //           startLine: 294,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getDayAvgSolvedIssue(String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 263,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 7,
  //           startLine: 263,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getAddIssueCount(String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 318,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 4,
  //           startLine: 318,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName: 'getStatements(String, String, String, String, String)',
  //         },
  //       ],
  //       commitId: '8f6ac88338c4130f2a41eee0546de18daf4c9d02',
  //       message: 'FDSE-985 antlr依赖添加',
  //       uuid: '73fb7310-86b0-4baa-8b1d-c49d4050aca6',
  //       version: 1,
  //       status: 'add',
  //       locations: [
  //         {
  //           endLine: 346,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 10,
  //           startLine: 346,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getCodeLifeCycle(String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 385,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 4,
  //           startLine: 385,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName: 'getCloneMeasure(String, String, String, String)',
  //         },
  //         {
  //           endLine: 366,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 7,
  //           startLine: 366,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName: 'getFocusFilesCount(String, String, String, String)',
  //         },
  //         {
  //           endLine: 232,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 7,
  //           startLine: 232,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getIssueCountByConditions(String, String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 425,
  //           code: '                url.append("&since=").append(since);\n',
  //           offset: 8,
  //           startLine: 425,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getJiraMsgOfOneDeveloper(String, String, String, String)',
  //         },
  //         {
  //           endLine: 294,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 11,
  //           startLine: 294,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getDayAvgSolvedIssue(String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 263,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 7,
  //           startLine: 263,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName:
  //             'getAddIssueCount(String, String, String, String, String, String)',
  //         },
  //         {
  //           endLine: 318,
  //           code: '            url.append("&since=").append(since);\n',
  //           offset: 4,
  //           startLine: 318,
  //           filePath:
  //             'measure-service/src/main/java/cn/edu/fudan/measureservice/component/RestInterfaceManager.java',
  //           methodName: 'getStatements(String, String, String, String, String)',
  //         },
  //       ],
  //       detail: 'false',
  //       type: ""
  //     },
  //     'ec15d79e36e14dd258cfff3d48b73d35',
  //   );
  //   expect(resp).not.toEqual(null);
  // }, 60000);

  test('/statistics/method/history', async () => {
    const resp = await getMethodDiffData([], 'method');
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/statistics/statement/history', async () => {
    const resp = await retrospectStatementHistories(
      {
        metaUuid: '4eb61bb1-a908-40a4-ad16-76726d8bc3d4',
        currentCommitId: '4eaed0de5fa1f59342e331398db0258105a560be',
        statementUuidList: [
          'b4bc4ccf-d8a8-418b-abbe-ad8067cfb67e',
          '7151ec4e-b2a1-4082-b9cc-9399fb8a9dcc',
          '723c37b5-42ef-4528-a709-d47159107ae9',
          'd47a3b69-3430-4b12-8af6-e167bc0c3007',
          '3372d39d-9f6a-48a0-914a-3bc82fc2da22',
          '11de0746-927c-492e-bddb-403459a17966',
          'bf85da35-3591-40f6-9ffb-76645cc87e90',
          'ca3b46ee-074e-420a-bb02-e10a8b93ced7',
        ],
      },
      'ec15d79e36e14dd258cfff3d48b73d35',
    );
    expect(resp).not.toEqual(null);
  }, 60000);

  test('/codewisdom/code/method/detail/download', async () => {
    const resp = await downloadExcel({
      page: 1,
      ps: 10,
    });
    expect(resp).not.toEqual(null);
  }, 60000);
});

export {};
