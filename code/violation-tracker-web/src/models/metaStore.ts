import { EdgeItem, NodeItem } from '@/components/GitGraph';
// import { LineRange } from '@/utils/line-range';
import { sortNodesByEdges } from '@/utils/methodTrace';
// import { convData2Camel } from '@/utils/conversion';
import { action, computed, makeAutoObservable, runInAction } from 'mobx';
// import { getIssueFailed, getRawIssueHistoryInfo } from '../services/issue';
import {
  getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation,
  // postMethodInfosAndCommitInfos,
} from '../services/method';
import { IssueItem } from './issueStore';

const initailMeta = {
  fileName: '-',
  className: '-',
  trackerNum: 0,
  packageName: '-',
  methodName: '-',
};

export const LINK_METHOD_TAG = '@fn@';

export type BugLineType = { detail: string; lines: number[] };

export default class MetaStore {
  issueCommitRange?: { from: string; to: string };
  methodInfos: API.MethodInfo[] = [];
  commitTotalTimes: number = 0;
  graphPages: number = 0;
  // historyCommitChains: API.HistoryCommitChain[] = [];
  historyCommitGraph: {
    nodes: NodeItem[];
    edges: EdgeItem[];
  } = {
    nodes: [],
    edges: [],
  };
  bugLinesCommitMethodMap: Map<string, Map<string, BugLineType>> = new Map<
    string,
    Map<string, BugLineType>
  >();
  issueListCommitMap: Map<string, IssueItem[]> = new Map();
  meta: API.MethodMeta = initailMeta;
  constructor() {
    makeAutoObservable(this);
  }
  @computed get methodUuids() {
    return this.methodInfos.map(({ metaUuid }) => metaUuid);
  }
  @computed get statementListMethodMap() {
    const map = new Map<string, string[]>();
    this.methodInfos.forEach(({ metaUuid, statementList }) => {
      map.set(metaUuid, statementList);
    });
    return map;
  }
  @computed get level() {
    return this.methodInfos[0]?.level ?? '';
  }

  @action async fetchMetaInfoAndCommitInfoAndIssueLocation(
    params: {
      issue_uuid: string;
      repo_uuid: string;
      issue_type?: string;
      show_all: boolean;
      type: 'issue';
      page: number;
      ps?: number;
      level: string;
    },
    userToken?: string,
  ) {
    const resp = await getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation(
      params,
      userToken,
    );
    let issueList: API.RawIssueHistoryItem[] = [];
    if (typeof resp === 'boolean' || resp === null) return false;
    if (params.issue_uuid !== undefined) {
      if (Array.isArray(resp.issueLocations)) issueList = resp.issueLocations;
      const bugLinesCommitMethodMap = new Map<
        string,
        Map<string, BugLineType>
      >();
      // 将issue和method\commit关联
      issueList.forEach((issue: API.RawIssueHistoryItem) => {
        // location 和 locations字段在后端返回时会改变，但是定义一样
        issue.locations !== undefined
          ? issue.locations?.forEach(
              ({ startLine, endLine, offset, filePath, methodName }) => {
                const methodUniqueKey = `${filePath}${LINK_METHOD_TAG}${methodName}`;
                const methodLine = startLine - (offset ?? 0);
                // const methodLine = startLine;
                const relativeStartLine = offset ?? 0;
                const relativeEndLine = endLine - methodLine;
                const bugLines = [];
                for (let i = relativeStartLine; i <= relativeEndLine; i++) {
                  bugLines.push(i);
                }
                if (!bugLinesCommitMethodMap.has(methodUniqueKey)) {
                  bugLinesCommitMethodMap.set(
                    methodUniqueKey,
                    new Map<string, BugLineType>(),
                  );
                }
                if (
                  !bugLinesCommitMethodMap
                    .get(methodUniqueKey)
                    ?.has(issue.commitId)
                ) {
                  bugLinesCommitMethodMap
                    .get(methodUniqueKey)
                    ?.set(issue.commitId, {
                      detail: issue.detail ?? '',
                      lines: [],
                    });
                }
                bugLines.forEach((bugLine) =>
                  bugLinesCommitMethodMap
                    .get(methodUniqueKey)
                    ?.get(issue.commitId)
                    ?.lines?.push(bugLine),
                );
              },
            )
          : issue.location?.forEach(
              ({ startLine, endLine, offset, filePath, methodName }) => {
                const methodUniqueKey = `${filePath}${LINK_METHOD_TAG}${methodName}`;
                const methodLine = startLine - (offset ?? 0);
                // const methodLine = startLine;
                const relativeStartLine = offset ?? 0;
                const relativeEndLine = endLine - methodLine;
                const bugLines = [];
                for (let i = relativeStartLine; i <= relativeEndLine; i++) {
                  bugLines.push(i);
                }
                if (!bugLinesCommitMethodMap.has(methodUniqueKey)) {
                  bugLinesCommitMethodMap.set(
                    methodUniqueKey,
                    new Map<string, BugLineType>(),
                  );
                }
                if (
                  !bugLinesCommitMethodMap
                    .get(methodUniqueKey)
                    ?.has(issue.commitId)
                ) {
                  bugLinesCommitMethodMap
                    .get(methodUniqueKey)
                    ?.set(issue.commitId, {
                      detail: issue.detail ?? '',
                      lines: [],
                    });
                }
                bugLines.forEach((bugLine) =>
                  bugLinesCommitMethodMap
                    .get(methodUniqueKey)
                    ?.get(issue.commitId)
                    ?.lines?.push(bugLine),
                );
              },
            );
      });
      runInAction(() => {
        this.bugLinesCommitMethodMap = bugLinesCommitMethodMap;
      });
      const issueListCommitMap = new Map<string, IssueItem[]>();
      // 将 issue 和 commit 关联
      issueList.forEach((issue: API.RawIssueHistoryItem) => {
        if (!issueListCommitMap.has(issue.commitId)) {
          issueListCommitMap.set(issue.commitId, []);
        }
        // 这里还是默认为locations吧，原本要location和locations都支持
        const lines = Array.isArray(issue.locations)
          ? issue.locations.reduce((acc, { startLine, endLine }) => {
              const bugLines = [];
              for (let i = startLine; i <= endLine; i++) {
                bugLines.push(i);
              }
              return acc.concat(bugLines);
            }, [] as number[])
          : [];
        issueListCommitMap.get(issue.commitId)?.push({
          type: issue.type,
          detail: issue.detail ?? '',
          lines,
        });
      });
      runInAction(() => {
        this.issueListCommitMap = issueListCommitMap;
      });
    }
    // 处理 Git Graph 的数据
    const nodes = Array.isArray(resp.node?.rows)
      ? resp.node.rows.map((item) => ({
          ...item,
          id: item.commitId,
        }))
      : [];
    if (params.page === 1) {
      runInAction(() => {
        this.commitTotalTimes = resp.metaInfo.trackerNum;
        this.graphPages = resp.node.total;
        this.methodInfos = resp.methodInfo ?? [];
        this.meta = resp.metaInfo ?? initailMeta;
        this.historyCommitGraph = {
          nodes: sortNodesByEdges(nodes, resp.edge),
          edges: resp.edge,
        };
      });
    } else {
      const edges = this.historyCommitGraph?.edges.concat(resp.edge);
      const sortedNodes = sortNodesByEdges(
        this.historyCommitGraph?.nodes.concat(nodes),
        edges,
      );
      runInAction(() => {
        this.historyCommitGraph = {
          nodes: sortedNodes,
          edges,
        };
      });
    }
    return true;
  }

  @action
  clear() {
    this.meta = initailMeta;
    this.graphPages = 0;
    this.commitTotalTimes = 0;
    this.historyCommitGraph = {
      nodes: [],
      edges: [],
    };
    // this.historyCommitChains = [];
    this.issueCommitRange = undefined;
    this.methodInfos = [];
  }
}
