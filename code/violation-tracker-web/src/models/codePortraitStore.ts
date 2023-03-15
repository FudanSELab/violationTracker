import {
  calculateEvoluationByIncrementalData,
  compressTree,
  fileList2TreeList,
  generateDefaultLineEvoluation,
  generateOneFileEvoluation,
} from '@/pages/Test/code-portrait-utils';
import {
  getAllLiveLinesOfCommit,
  getFileBaseList,
  getHistoryCommitsList,
  getOneCommitChange,
} from '@/services/middleware/code-portrait';
import { action, computed, makeAutoObservable, runInAction } from 'mobx';

const initialLineMapWithSetValueFunc = <T>(
  fileList: CP.FileBaseItem<CP.LineItemWithEvoluation>[],
  setValue: (file: CP.FileBaseItem<CP.LineItemWithEvoluation>) => T,
): Map<string, T> => {
  const lineMap = new Map();
  fileList.forEach((file) => {
    file.lines.forEach(({ lineUuid }) => {
      lineMap.set(lineUuid, setValue(file));
    });
  });
  return lineMap;
};

export default class CodePortraitStore {
  commits: CP.CommitItem[] = [];
  fileList: CP.FileBaseItem<CP.LineItemWithEvoluation>[] = [];
  line2FileMap: Map<string, string> = new Map();
  lineEvoluationMapList: Map<string, CP.LineEvoluationItem>[] = [];
  constructor() {
    makeAutoObservable(this);
  }

  @computed get fileBaseTree() {
    return {
      key: `project-master`,
      treemap: {
        name: `project-master`,
        key: '1',
        children: fileList2TreeList(this.fileList).map(compressTree).flat(),
      },
    };
  }

  @computed get keys() {
    return this.commits.map(({ commitId, ...rest }) => {
      return {
        id: commitId,
        extra: rest,
      };
    });
  }

  @action
  async initialCodePortraitDataByRepoUuid({
    repoUuid,
    repoName,
    testValue,
    beginCommitId,
    endCommitId,
    number,
  }: {
    repoUuid: string;
    repoName: string;
    testValue?: number;
    beginCommitId?: string;
    endCommitId?: string;
    number?: number;
  }) {
    const [list, fileBaseList] = await Promise.all([
      getHistoryCommitsList({
        type: testValue,
        repo_uuid: repoUuid,
        begin_commit: beginCommitId,
        end_commit: endCommitId,
        num: number,
      }),
      getFileBaseList({
        type: testValue,
        repo_uuid: repoUuid,
        repo_name: repoName,
      }),
    ]);
    runInAction(() => {
      if (list !== null && typeof list !== 'boolean') {
        this.commits = list;
        this.lineEvoluationMapList = new Array(list.length);
      }
      if (fileBaseList !== null && typeof fileBaseList !== 'boolean') {
        this.fileList = fileBaseList;
        this.line2FileMap = initialLineMapWithSetValueFunc(
          fileBaseList,
          (file) => file.filePath,
        );
      }
    });
  }

  @action
  private async initialFirstEvoluationMap(
    {
      lineMap,
      commitId,
      repoUuid,
      testValue,
    }: {
      lineMap: Map<string, CP.LineEvoluationItem>;
      commitId: string;
      repoUuid: string;
      testValue?: number;
    },
    signal?: AbortSignal,
  ) {
    // 获得第一个commit的存活数据
    const lineBaseList = await getAllLiveLinesOfCommit(
      {
        type: testValue,
        repo_uuid: repoUuid,
        commit_id: commitId,
      },
      undefined,
      signal,
    );
    if (lineBaseList !== null && typeof lineBaseList !== 'boolean') {
      // 设置第一个commit语句的当前存活状态
      const liveLineCodeMap = new Map(
        lineBaseList.map(({ lineUuid, code, filePath }) => [
          lineUuid,
          { filePath, code },
        ]),
      );
      lineMap.forEach((v, lineUuid) => {
        if (liveLineCodeMap.has(lineUuid)) {
          v.current = 'LIVE';
          v.relation = 'KEEP';
          v.filePath = liveLineCodeMap.get(lineUuid)?.filePath ?? '';
          v.code = liveLineCodeMap.get(lineUuid)?.code ?? '';
        } else {
          v.current = 'NIL';
        }
      });
    }
    const change = await getOneCommitChange(
      {
        type: testValue,
        index: 0,
        repo_uuid: repoUuid,
        commit_id: commitId,
      },
      undefined,
      signal,
    );
    if (change !== null && typeof change !== 'boolean') {
      // 设置第一个commit语句的其他演化状态
      const { committer, lines } = change;
      if (Array.isArray(lines)) {
        lines.forEach((line) => {
          const evoluation = lineMap.get(line.lineUuid);
          if (evoluation !== undefined) {
            // 设置历史提交者
            let currentCommitters = evoluation.committers;
            if ((committer ?? '') !== '') {
              currentCommitters = Array.from(
                new Set([...currentCommitters, committer as string]),
              );
            }
            // console.log('ev', evoluation.code, 'line', line.code);
            // if (line.code !== undefined) {
            evoluation.code = line.code;
            // }
            evoluation.committers = currentCommitters;
            evoluation.filePath = line.filePath;
            evoluation.relation = line.relation;
            // 对新增的多进行一次处理
            if (line.relation === 'ADD' && evoluation.current === 'NIL') {
              console.error(`此lineUuid: ${line.lineUuid} 存活数据有误`);
              evoluation.current = 'LIVE';
            }
            evoluation.lineBegin = line.lineBegin;
            evoluation.lineEnd = line.lineEnd;
          }
        });
      }
    }
    this.lineEvoluationMapList[0] = lineMap;
    this.addLinesStatus2FileListInIdx(this.fileList, lineMap, 0);
    return lineMap;
  }

  @action
  private async generateLineEvoluationOfIdx(
    {
      idx,
      repoUuid,
      testValue,
    }: {
      idx: number;
      repoUuid: string;
      testValue?: number;
    },
    signal?: AbortSignal,
  ) {
    // console.log('get line evoluation', idx);
    if (idx - 1 < 0) {
      throw Error('历史演化数组不存在');
      // initialFirstEvoluationMap(, 1);
    }
    let before = this.lineEvoluationMapList[idx - 1];
    if (before === undefined) {
      await this.generateLineEvoluationOfIdx(
        {
          idx: idx - 1,
          repoUuid,
          testValue,
        },
        signal,
      );
      before = this.lineEvoluationMapList[idx - 1];
    }
    const currentCommitId = this.commits[idx].commitId;
    // 获取语句增量变化数据
    const change = await getOneCommitChange(
      {
        type: testValue,
        index: idx,
        repo_uuid: repoUuid,
        commit_id: currentCommitId,
      },
      undefined,
      signal,
    );
    // 生成 idx 的语句演化
    if (change === null || typeof change === 'boolean') {
      throw Error(`未获取到语句变化（${currentCommitId})`);
    }
    const evoluationMap = calculateEvoluationByIncrementalData(
      change,
      before,
      this.line2FileMap,
    );
    this.lineEvoluationMapList[idx] = evoluationMap;
    this.addLinesStatus2FileListInIdx(this.fileList, evoluationMap, idx);
  }

  // @action
  // private generateFileEvoluationAnd2Tree(
  //   fileList: CP.FileBaseItem<CP.LineItemWithEvoluation>[],
  //   idx: number,
  // ) {
  //   // 生成文件演化
  //   const fileListWithEvoluation = (fileList.map((file) => {
  //     return {
  //       ...file,
  //       lines: undefined,
  //       historyDetail: generateOneFileEvoluation(file.lines, idx),
  //     };
  //   }) as unknown) as CP.FileBaseItem<any>[];
  //   // 返回 TreeMap Data
  //   return {
  //     key: `project-master`,
  //     treemap: {
  //       name: `project-master`,
  //       key: '1',
  //       children: fileList2TreeList(fileListWithEvoluation)
  //         .map(compressTree)
  //         .flat(),
  //     },
  //   };
  // }

  @action
  private generateFileEvoluationMap(
    fileList: CP.FileBaseItem<CP.LineItemWithEvoluation>[],
    idx: number,
  ) {
    const map = new Map();
    // 生成文件演化
    fileList.forEach((file) => {
      // console.log(file.lines);
      map.set(file.fileUuid, generateOneFileEvoluation(file.lines, idx));
    });
    return map;
  }

  @action
  async getFileEvoluationMapByIdx(
    {
      idx,
      repoUuid,
      testValue,
    }: {
      idx: number;
      repoUuid: string;
      testValue?: number;
    },
    signal?: AbortSignal,
  ) {
    if (this.fileList.length === 0 || this.lineEvoluationMapList.length < 0) {
      return null;
    }
    if (this.lineEvoluationMapList[idx] === undefined) {
      if (idx === 0) {
        // console.log('initial');
        const firstCommitId = this.commits[0].commitId;
        const lineMap = initialLineMapWithSetValueFunc(this.fileList, () =>
          generateDefaultLineEvoluation({
            key: firstCommitId,
            current: 'NIL',
          }),
        );
        // console.log('firstEvoluation start');
        await this.initialFirstEvoluationMap(
          {
            lineMap,
            commitId: firstCommitId,
            repoUuid,
            testValue,
          },
          signal,
        );
        // console.log('firstEvoluation end');
      } else {
        // console.log('increamental');
        await this.generateLineEvoluationOfIdx(
          {
            idx,
            repoUuid,
            testValue,
          },
          signal,
        );
      }
      // return this.generateFileEvoluationAnd2Tree(this.fileList, idx);
      return this.generateFileEvoluationMap(this.fileList, idx);
    } else {
      // return this.generateFileEvoluationAnd2Tree(this.fileList, idx);
      return this.generateFileEvoluationMap(this.fileList, idx);
    }
  }

  @action
  addLinesStatus2FileListInIdx(
    fileList: CP.FileBaseItem<CP.LineItemWithEvoluation>[],
    lineEvoluationMap: Map<string, CP.LineEvoluationItem>,
    index: number,
  ) {
    fileList.forEach((file) => {
      file.lines.forEach((line) => {
        const status = lineEvoluationMap.get(line.lineUuid);
        if (status !== undefined) {
          const len = line.status.length;
          // console.log('len/index', len, index);
          for (let i = len; i < index; i++) {
            line.status.push(undefined as any);
          }
          if (line.status.length === index) {
            line.status.push({ ...status });
          }
        }
      });
    });
  }

  @action
  clear() {
    this.commits = [];
    this.fileList = [];
    this.lineEvoluationMapList = [];
    this.line2FileMap = new Map();
  }
}
