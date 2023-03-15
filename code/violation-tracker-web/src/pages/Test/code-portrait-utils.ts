import { compressLineRange } from '@/utils/line-range';
import { v4 as uuidv4 } from 'uuid';

const HIDDEN_RELATION = 'HIDDEN';
export function generateDefaultLineEvoluation({
  key,
  current,
}: {
  key: string;
  current: CP.LineCurrentType;
}): CP.LineEvoluationItem {
  const DEFAULT_STATUS: CP.LineEvoluationItem = {
    key,
    current,
    filePath: '',
    code: '',
    committers: [],
    relation: HIDDEN_RELATION,
    lineBegin: 0,
    lineEnd: 0,
  };
  return DEFAULT_STATUS;
}

function generateNextRelation(relation: CP.ChangeRelation): CP.ChangeRelation {
  // 前一个 relation 为 HIDDEN 时保持，为 DELETE 时设为 HIDDEN，否则设为 KEEP
  return relation === HIDDEN_RELATION || relation === 'DELETE'
    ? HIDDEN_RELATION
    : 'KEEP';
}

export function calculateDefaultEvoluationStatusByBefore(
  before: Map<string, CP.LineEvoluationItem>,
  currentInfo: {
    commitId: string;
    getFilePath: (lineUuid: string) => string | undefined;
  },
) {
  const { commitId, getFilePath } = currentInfo;
  const map = new Map<string, CP.LineEvoluationItem>();
  before.forEach((value, key) => {
    const nextRelation = generateNextRelation(value.relation);
    map.set(key, {
      ...value,
      committers: [...value.committers],
      key: commitId,
      relation: nextRelation,
      // 若在增量中找到文件修改，更新文件名，否则用前一个commit的文件名
      filePath: getFilePath(key) ?? value.filePath,
      code: nextRelation === 'HIDDEN' ? '' : value.code,
    });
  });
  return map;
}

function calculateEvoluationByLine(
  line: CP.LineIncrementalChangeItem,
  commitId: string,
): CP.LineEvoluationItem {
  let relation = line.relation;
  let current: CP.LineCurrentType = 'LIVE';
  let lineBegin = line.lineBegin ?? 0;
  let lineEnd = line.lineEnd ?? 0;
  if (line.relation === 'DELETE' || line.relation === HIDDEN_RELATION) {
    current = 'NIL';
    lineBegin = 0;
    lineEnd = 0;
  }
  // @ts-ignore
  if (line.relation === 'SELF_CHANGE') {
    relation = 'CHANGE';
  }
  return {
    key: commitId,
    committers: [],
    filePath: line.filePath,
    code: line.code,
    relation,
    current,
    lineBegin: lineBegin,
    lineEnd: lineEnd,
  };
}

export function calculateEvoluationByIncrementalData(
  incremental: CP.CommitLineIncrementalItem,
  before: Map<string, CP.LineEvoluationItem>,
  line2fileMap: Map<string, string>,
): Map<string, CP.LineEvoluationItem> {
  const { commitId, committer, lines } = incremental;
  // console.log('before', before);
  // 复制前一个演化状态为现在的初始状态
  const currentStatusMap = calculateDefaultEvoluationStatusByBefore(before, {
    commitId,
    getFilePath: (lineUuid: string) => line2fileMap.get(lineUuid),
  });
  // console.log('default', currentStatusMap);
  /**
   * 计算代码行演化状态
   * */
  if (!Array.isArray(lines)) return currentStatusMap;
  lines.forEach((line) => {
    if (line.lineUuid === '') {
      console.log('发现 Line 数据有误, commit id:', commitId);
      return;
    }
    // CHANGE_LINE 属于行号变更，相当于 KEEP，但需更新行号
    if (line.relation === 'CHANGE_LINE') {
      if (!currentStatusMap.has(line.lineUuid)) {
        return;
      }
      const currentStatus = currentStatusMap.get(
        line.lineUuid,
      ) as CP.LineEvoluationItem;
      currentStatus.lineBegin = line.lineBegin;
      currentStatus.lineEnd = line.lineEnd;
      return;
    }
    const evoluationOfLine = calculateEvoluationByLine(line, commitId);
    if (!currentStatusMap.has(line.lineUuid)) {
      return;
    }
    const currentStatusOfLine = currentStatusMap.get(
      line.lineUuid,
    ) as CP.LineEvoluationItem;
    // 更新成最新一次Commit的commiters
    let currentCommitters = currentStatusOfLine.committers;
    if ((committer ?? '') !== '') {
      currentCommitters = Array.from(
        new Set([...currentCommitters, committer as string]),
      );
    }
    currentStatusMap.set(line.lineUuid, {
      ...evoluationOfLine,
      committers: currentCommitters,
    });
  });
  // console.log('next', currentStatusMap);
  return currentStatusMap;
}

/** 文件演化 */
function generateCommittersItemOnHistoryTime(
  lines: Pick<CP.LineItemWithEvoluation, 'status'>[],
  historyIdx: number,
) {
  return Array.from(
    new Set(
      lines.reduce(
        (res, line) => res.concat(line.status[historyIdx].committers),
        [] as string[],
      ),
    ),
  );
}
export function generateOneFileEvoluation(
  lines: Omit<CP.LineItemWithEvoluation, 'fileUuid' | 'filePath'>[],
  historyIdx: number,
): CP.FileEvoluationItem {
  /**
   *        |         LIVE(latest)         |         NIL(latest)          |
   * -------| LIVE(current) | NIL(current) | LIVE(current) | NIL(current) |
   * ADD    |     LIVE      |      -       |    WILL_NIL   |      -       |
   * CHANGE |     LIVE      |      -       |    WILL_NIL   |      -       |
   * KEEP   |     LIVE      |      -       |    WILL_NIL   |      -       |
   * DELETE |       -       |      -       |       -       |     NIL      |
   * HIDDEN |       -       |  WILL_LIVE   |       -       |     NIL      |
   * 当前版本总代码行 = LIVE(ADD) + LIVE(CHANGE) + LIVE(KEEP)
   * 新增最新版本留存 = LIVE(ADD)
   * 新增最新版本消失 = WILL_NIL(ADD)
   * 修改最新版本留存 = LIVE(CHANGE)
   * 修改最新版本消失 = WILL_NIL(CHANGE)
   * 不变最新版本留存 = LIVE(KEEP)
   * 不变最新版本消失 = WILL_NIL(KEEP)
   * 删除最新版本消失 = NIL(DELETE)
   * 当前不存在最新版本存在 = 未来新增 = WILL_LIVE(HIDDEN)
   * 当前不存在最新版本不存在 = 历史删除 = NIL(HIDDEN)
   * --------------------------------------------------
   * LIVE      = LIVE(latest) & LIVE(current)
   * WILL_LIVE = LIVE(latest) & NIL(current)
   * NIL       = NIL(latest)  & NIL(current)
   * WILL_NIL  = NIL(latest)  & LIVE(current)
   */
  const change = {
    create: [0, 0],
    modify: [0, 0],
    normal: [0, 0],
    remove: [0, 0],
    hidden: [0, 0],
  };
  const lineRanges = {
    create: {
      live: [],
      nil: [],
    } as CP.LineRangeWithLatestStatus,
    modify: {
      live: [],
      nil: [],
    } as CP.LineRangeWithLatestStatus,
    normal: {
      live: [],
      nil: [],
    } as CP.LineRangeWithLatestStatus,
    hidden: {
      live: [],
      nil: [],
    } as CP.LineRangeWithLatestStatus,
  };
  const beforeLineRanges = {
    remove: {
      live: [],
      nil: [],
    } as CP.LineRangeWithLatestStatus,
  };
  lines.forEach((line) => {
    // console.log('line', historyIdx, line.status[historyIdx]);
    const { latest } = line;
    const { relation } = line.status[historyIdx];
    const key =
      relation === 'ADD'
        ? 'create'
        : relation === 'CHANGE'
        ? 'modify'
        : relation === 'KEEP'
        ? 'normal'
        : relation === 'DELETE'
        ? 'remove'
        : relation === HIDDEN_RELATION
        ? 'hidden'
        : '<none>';
    if (key === '<none>') return;
    // console.log(key, latest);
    if (latest === 'LIVE') {
      change[key][0] += 1;
      if (key === 'remove') {
        if (historyIdx > 0) {
          beforeLineRanges[key].live.push({
            start: line.status[historyIdx - 1].lineBegin,
            end: line.status[historyIdx - 1].lineEnd,
          });
        }
      } else {
        lineRanges[key].live.push({
          start: line.status[historyIdx].lineBegin,
          end: line.status[historyIdx].lineEnd,
        });
      }
    } else if (latest === 'NIL') {
      change[key][1] += 1;
      if (key === 'remove') {
        if (historyIdx > 0) {
          beforeLineRanges[key].nil.push({
            start: line.status[historyIdx - 1].lineBegin,
            end: line.status[historyIdx - 1].lineEnd,
          });
        }
      } else {
        lineRanges[key].nil.push({
          start: line.status[historyIdx].lineBegin,
          end: line.status[historyIdx].lineEnd,
        });
      }
    }
  });
  const live =
    change.create[0] +
    change.create[1] +
    change.modify[0] +
    change.modify[1] +
    change.normal[0] +
    change.normal[1];
  // 压缩 lineRanges
  Object.values(lineRanges).forEach((v) => {
    v.live = compressLineRange(
      v.live.sort(({ start: a }, { start: b }) => a - b),
      1,
    );
    v.nil = compressLineRange(
      v.nil.sort(({ start: a }, { start: b }) => a - b),
      1,
    );
  });
  return {
    key: lines[0].status[historyIdx].key,
    filePath: lines[0].status[historyIdx].filePath,
    committers: generateCommittersItemOnHistoryTime(lines, historyIdx),
    value: live,
    change,
    lineRanges,
    beforeLineRanges,
  };
}
// export function createFileEvoluation(
//   lines: Omit<CP.LineItemWithEvoluation, 'fileUuid' | 'filePath'>[],
// ): CP.FileEvoluationItem[] {
//   const historyNum = lines[0].status.length;
//   const historyDetail = [];
//   for (let i = 0; i < historyNum; i++) {
//     historyDetail.push(generateOneFileEvoluation(lines, i));
//   }
//   return historyDetail;
// }

/** TREE 相关 **/
export function hasChildDirMap_DFS(
  map: Map<string, any>,
  dirs: string[],
  cur: number,
): Map<string, any> {
  if (!map.has(dirs[cur])) {
    map.set(dirs[cur], new Map<string, any>());
  }
  if (cur + 1 >= dirs.length) {
    return map.get(dirs[cur]);
  }
  return hasChildDirMap_DFS(map.get(dirs[cur]), dirs, cur + 1);
}
export function setChildDirMap<T>(
  map: Map<string, T>,
  dirs: string[],
  file: T & {
    filename: string;
  },
) {
  const childMap = hasChildDirMap_DFS(map, dirs, 0);
  const { filename, ...rest } = file;
  childMap.set(filename, rest);
}
export function transformMap2TreeList<T>(
  map: Map<string, T>,
): CP.FileTreeItem<T>[] {
  const tree: CP.FileTreeItem<T>[] = [];
  map.forEach((value, name) => {
    const key = uuidv4();
    if (value instanceof Map) {
      let children = transformMap2TreeList(value);
      tree.push({
        name,
        key,
        children,
      });
    } else {
      tree.push({
        name,
        key,
        ...value,
        isLeaf: true,
      });
    }
  });
  return tree.sort(({ name: a = '' }, { name: b = '' }) => {
    return a.localeCompare(b);
  });
}
export function fileList2TreeList<T>(list: CP.FileBaseItem<T>[]) {
  const dirMap = new Map<string, CP.FileBaseItem<T>>();
  for (let file of list) {
    const paths = file.filePath.split('/');
    const filename = paths.pop() ?? '<unknown>';

    setChildDirMap(dirMap, paths, {
      filename,
      ...file,
    });
  }
  return transformMap2TreeList(dirMap);
}

export function compressTree<T>(tree: CP.FileTreeItem<T>): CP.FileTreeItem<T> {
  const isLeafNode = (acc: boolean, item: CP.FileTreeItem<T>) => {
    return acc || (item.isLeaf ?? false);
  };
  const { children, ...self } = tree;
  if (children === undefined) return tree;
  let compressChildren = children.map(compressTree);
  const hasLeaf = compressChildren.reduce(isLeafNode, false);
  // 若没有直属叶节点
  if (!hasLeaf) {
    compressChildren = compressChildren
      .map((child) => {
        if (child.children === undefined || child.children.length !== 1)
          return child;
        const hasChildLeft = child.children.reduce(isLeafNode, false);
        if (!hasChildLeft) {
          child.children.forEach((cc) => {
            cc.name = child.name + '/' + cc.name;
          });
          return child.children;
        }
        return child;
      })
      .flat();
  }
  return {
    ...self,
    children: compressChildren,
  };
}
