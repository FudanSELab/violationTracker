import { EdgeItem, NodeItem } from '@/components/GitGraph';
import { getChildren } from '@/components/GitGraph/utils';

export const createHighlightMap = (results: API.RetrospectResult[]) => {
  const map = new Map<string, number[]>();
  results.forEach(({ histories }) => {
    histories.forEach(({ commitId, lineBegin, lineEnd, changeStatus }) => {
      // if (changeStatus !== 'CHANGE_LINE') {
      if (!map.has(commitId)) {
        map.set(commitId, []);
      }
      for (let i = lineBegin; i <= lineEnd; i++) {
        map.get(commitId)?.push(i);
      }
      // }
    });
  });
  return map;
};

export function sortNodesByEdges(nodes: NodeItem[], edges: EdgeItem[]) {
  for (let i = 0; i < nodes.length; i++) {
    const children = getChildren(edges, nodes[i].commitId);
    const childrenIdxs = children.map((child) => {
      return nodes.findIndex((node) => node.commitId === child);
    });
    let current = i;
    childrenIdxs.forEach((index) => {
      if (index > current) {
        const tmp = nodes[current];
        nodes[current] = nodes[index];
        nodes[index] = tmp;
        current = index;
      }
    });
    if (current !== i) {
      i--;
    }
  }
  return nodes;
}
// export const createRetrospectChains = (
//   history: API.HistoryCommitChain[],
//   issueRange: { from: string; to: string },
// ): API.CommitInfoItem[] => {
//   let chains = [];
//   let inRange = false;
//   for (let i = 0; i < history.length; i++) {
//     let solved = false;
//     if (history[i].commitId === issueRange.from) {
//       inRange = true;
//     }
//     if (history[i].commitId === issueRange.to) {
//       inRange = false;
//       solved = true;
//     }
//     chains.push({
//       commitId: history[i].commitId,
//       commitDate: history[i].date,
//       committer: history[i].committer,
//       foundBug: inRange,
//       solved,
//     });
//   }
//   return chains;
// };
