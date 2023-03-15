const oldCode = `
Class A {
  public static main() {
    System.out.println('hello');
  }
}
const hello = '';
`;
const newCode = `
Class A {
  public static main(String[] args) {

    System.out.println('hello');
  }
  @Override
  public String printf() {
    return "hello world";
  }
}
`;

export const methodInfo = {
  metaUuid: 'string',
  commitId: 'commit',
  statementList: [],
  projectName: 'project',
};

export const methodAndDiff = {
  total: 10,
  methodMeta: {
    methodName: 'func',
    fileName: 'hello.java',
    packageName: 'edu.cn',
    projectName: 'issue-tracker',
  },
  commitInfoList: [
    { commitId: 'beafa1334', status: false },
    { commitId: 'beafa1334', status: false },
    { commitId: '134cdfea1', status: true },
    { commitId: '134cfeadf', status: false },
  ],
  diff: {
    language: 'java',
    left: {
      title: {
        changeStatus: 'ADD',
        date: '2020-09-10',
        commitId: 'fea13af3452',
        committer: 'gutenbay',
        message: 'commit message hello wrold',
        lineBegin: 1,
      },
      code: oldCode,
    },
    right: {
      title: {
        changeStatus: 'CHANGE',
        date: '2020-11-10',
        commitId: 'fea13af3338252',
        committer: '赵维扬',
        message: 'commit message hello wrold change',
        lineBegin: 1,
      },
      code: newCode,
    },
  },
};

export const retrospectStatement = {
  statementResultList: [
    {
      title: 'if (isMethodName(str)) {',
      histories: [
        {
          changeStatus: 'ADD',
          date: '2020-09-10',
          commitId: 'fea13af3452',
          committer: 'gutenbay',
          content: 'cfaefojoiaejfoiaiejfoiafj',
          begin: 10,
          end: 10,
        },
        {
          changeStatus: 'CHANGE',
          date: '2020-09-10',
          commitId: 'fea13af3452',
          committer: 'gutenbay',
          content: 'cfaefojoiaejfoiaiejfoiafj',
          begin: 1,
          end: 1,
        },
        {
          changeStatus: 'DELETE',
          date: '2020-09-10',
          commitId: 'fea13af3452',
          committer: 'gutenbay',
          content: 'cfaefojoiaejfoiaiejfoiafj',
          begin: 3,
          end: 4,
        },
      ],
    },
    {
      title: 'if (isMethodName(str)) {',
      histories: [
        {
          changeStatus: 'DELETE',
          date: '2020-09-10',
          commitId: 'fea13af3452',
          committer: 'gutenbay',
          content: 'cfaefojoiaejfoiaiejfoiafj',
          begin: 3,
          end: 4,
        },
      ],
    },
    {
      title: 'if (isMethodName(str)) {',
      histories: [
        {
          changeStatus: 'DELETE',
          date: '2020-09-10',
          commitId: 'fea13af3452',
          committer: 'gutenbay',
          content: 'cfaefojoiaejfoiaiejfoiafj',
          begin: 3,
          end: 4,
        },
      ],
    },
    {
      title: 'if (isMethodName(str)) {',
      histories: [
        {
          changeStatus: 'DELETE',
          date: '2020-09-10',
          commitId: 'fea13af3452',
          committer: 'gutenbay',
          content: 'cfaefojoiaejfoiaiejfoiafj',
          begin: 3,
          end: 4,
        },
      ],
    },
  ],
};
