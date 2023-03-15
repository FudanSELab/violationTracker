import { EdgeItem, NodeItem } from '.';

export function getChildren(edges: EdgeItem[], current: string) {
  return edges.reduce((acc, { source, target }) => {
    if (source === current && !acc.includes(target)) {
      acc.push(target);
    }
    return acc;
  }, [] as string[]);
}

export function getParents(edges: EdgeItem[], current: string) {
  return edges.reduce((acc, { source, target }) => {
    if (target === current && !acc.includes(source)) {
      acc.push(source);
    }
    return acc;
  }, [] as string[]);
}

export function getDifferentParents(edges: EdgeItem[], current: string) {
  return edges.reduce((acc, { source, target, changeRelation }) => {
    if (
      target === current &&
      !acc.includes(source) &&
      (changeRelation === 'CHANGED' ||
        changeRelation === 'ADD' ||
        changeRelation === 'DELETE')
    ) {
      acc.push(source);
    }
    return acc;
  }, [] as string[]);
}

export function checkCompareStatus(
  edges: EdgeItem[],
  current?: string,
  lastCommit?: String,
) {
  const edgeInfo = edges.find(
    (data) => data.target === current && data.source === lastCommit,
  );
  return edgeInfo ? edgeInfo.comparable : true;
}

export function calculateOneLinePositionMap(nodes: NodeItem[]) {
  let openBranch = 0;
  const POSITION = new Map<string, { branch: number; parents: number }>();
  for (let index = 0; index < nodes.length; index++) {
    POSITION.set(nodes[index].id, { branch: openBranch, parents: 0 });
  }
  return POSITION;
}

export function calculatePositionMap(nodes: NodeItem[], edges: EdgeItem[]) {
  let openBranch = 0;
  const POSITION = new Map<string, { branch: number; parents: number }>();
  for (let index = 0; index < nodes.length; index++) {
    const children = getChildren(edges, nodes[index].id);
    if (children.length <= 0 || POSITION.size <= 0) {
      openBranch += 1;
      POSITION.set(nodes[index].id, { branch: openBranch, parents: 0 });
    } else {
      const perhapsResults = children.map((child) => ({
        id: child,
        pos:
          (POSITION.get(child)?.branch ?? 0) +
          (POSITION.get(child)?.parents ?? 0),
      }));
      const { id, pos } = perhapsResults.reduce(
        (acc, item) => (acc.pos > item.pos ? item : acc),
        {
          id: 'NULL',
          pos: Number.MAX_SAFE_INTEGER,
        } as { id: string; pos: number },
      );
      POSITION.set(nodes[index].id, { branch: pos, parents: 0 });
      if (POSITION.has(id)) (POSITION.get(id) as any).parents += 1;
    }
  }
  return POSITION;
}

export function calculateLineList(
  nodes: NodeItem[],
  edges: EdgeItem[],
  position: Map<string, { branch: number; parents: number }>,
) {
  const lines: {
    draw?: string;
    branch?: number;
    from: {
      source: string;
      target?: string;
      pos: number[];
    };
    to: {
      source: string;
      target?: string;
      pos: number[];
    };
  }[][] = new Array(nodes.length);
  let fromList: { source: string; target?: string; pos: number[] }[] = [];
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (lines[i] === undefined) lines[i] = [];
    const current = nodes[i];
    const next = i > 0 ? nodes[i - 1] : undefined;
    const from = {
      source: current.id,
      pos: [i, position.get(current.id)?.branch ?? 0],
    };
    addUniqueItemToList(from, fromList);
    const toList: { source: string; target?: string; pos: number[] }[] = [];
    for (let j = 0; j < fromList.length; j++) {
      const from = fromList[j];
      const fromId = from.source;
      const fromIdx = getNodeIndexById(nodes, fromId);
      // 判断线的起始id是否是当前节点的id
      if (fromIdx !== i) {
        // 不是当前节点，说明是接续的线
        const children = getChildren(edges, fromId);
        children.sort(
          (a, b) =>
            (position.get(a)?.branch ?? 0) - (position.get(b)?.branch ?? 0),
        );
        let to;
        // 若与下一个节点相连
        if (
          next !== undefined &&
          children.includes(next.id) &&
          next.id === from.target
        ) {
          to = {
            source: next.id,
            pos: [i - 1, position.get(next.id)?.branch ?? 0],
          };
        } else {
          const branchOfNextNode =
            i > 0 ? position.get(nodes[i - 1].id)?.branch ?? 0 : 0;
          const branchOfLeftLineTo =
            toList.length > 0 ? toList[toList.length - 1].pos[1] : 0;
          const nextBranch =
            branchOfNextNode === branchOfLeftLineTo + 1
              ? branchOfNextNode + 1
              : branchOfLeftLineTo + 1;
          to = {
            source: fromId,
            target: from.target,
            pos: [i - 1, nextBranch],
          };
        }
        addUniqueItemToList(to, toList);
        lines[i].push({
          from,
          to,
        });
        continue;
      }
      const children = getChildren(edges, fromId);
      // console.log('get children of ', fromId, children);
      children.sort(
        (a, b) =>
          (position.get(a)?.branch ?? 0) - (position.get(b)?.branch ?? 0),
      );
      children.forEach((child) => {
        const childIdx = getNodeIndexById(nodes, child);
        let to;
        // 直接连接下一个节点
        if (childIdx === i - 1) {
          to = {
            source: child,
            pos: [i - 1, position.get(child)?.branch ?? 0],
          };
        } else {
          const branchOfNextNode = position.get(nodes[i - 1].id)?.branch ?? 0;
          const branchOfLeftLineTo =
            toList.length > 0 ? toList[toList.length - 1].pos[1] : 0;
          const nextBranch =
            branchOfNextNode === branchOfLeftLineTo + 1
              ? branchOfNextNode + 1
              : branchOfLeftLineTo + 1;
          // console.log(fromId, child, nextBranch);
          to = {
            source: fromId,
            target: child,
            pos: [i - 1, nextBranch],
          };
        }
        addUniqueItemToList(to, toList);
        lines[i].push({
          from,
          to,
        });
      });
    }
    // console.log(i, fromList, toList);
    fromList = toList;
  }
  return lines;
}

function getNodeIndexById(nodes: NodeItem[], id: string) {
  return nodes.findIndex((node) => node.id === id);
}

function addUniqueItemToList(
  item: { source: string; target?: string; pos: number[] },
  list: { source: string; target?: string; pos: number[] }[],
) {
  if (
    list.findIndex(
      ({ source, target }) => source === item.source && target === item.target,
    ) < 0
  ) {
    list.push(item);
  }
  // const index = list.findIndex(({ pos }) => pos[0] === item.pos[0] && pos[1] === item.pos[1]);
  // if (index >= 0) {

  // }
  list.sort(({ pos: a }, { pos: b }) => a[1] - b[1]);
}

// function getNodeIdByIndex(nodes: NodeItem[], index: number) {
//   return nodes[index].id;
// }
