declare namespace CP {
  type CommitItem = {
    commitId: string;
    committer: string;
    commitDate: string;
    message: string;
  };

  type ChangeRelation =
    | 'ADD'
    | 'DELETE'
    | 'CHANGE'
    | 'KEEP'
    | 'HIDDEN'
    | 'CHANGE_LINE';

  type ChangeLine = {
    relation: ChangeRelation;
    lines: number;
  };
  type ChangeMap = {
    field: ChangeLine[] | null;
    method: ChangeLine[] | null;
    statement: ChangeLine[] | null;
    [key: string]: ChangeLine[] | null;
  };

  type FileChangeItem = {
    filePath: string;
    fileUuid: string;
    change: ChangeMap;
  };
  type LineRangeWithLatestStatus = {
    live: LineRange[];
    nil: LineRange[];
  };
  interface LineValue<T> {
    create: T;
    remove: T;
    modify: T;
    normal: T;
    hidden: T;
  }
  type FileEvoluationItem = {
    key: string;
    value: number;
    filePath: string;
    committers: string[];
    change: LineValue<number[]>;
    lineRanges: Omit<LineValue<LineRangeWithLatestStatus>, 'remove'>;
    beforeLineRanges: Pick<LineValue<LineRangeWithLatestStatus>, 'remove'>;
  };
  interface FileBaseItem<T> {
    filePath: string;
    fileUuid: string;
    historyLines?: number;
    lines: Omit<T, 'filePath' | 'fileUuid'>[];
  }
  interface FileItemWithEvoluation extends FileBaseItem<T> {
    historyDetail: FileEvoluationItem[];
  }
  type FileHistoryEvoluation = Pick<FileItemWithEvoluation, 'historyDetail'>;

  type LineType = 'method' | 'field' | 'statement';
  type LineCurrentType = 'NIL' | 'LIVE';
  type LineLatestType = LineCurrentType | 'UNKONWN';

  type LineIncrementalChangeItem = {
    filePath: string;
    fileUuid: string;
    type: LineType;
    lineUuid: string;
    code: string;
    relation: ChangeRelation;
    lineBegin: number;
    lineEnd: number;
  };

  type CommitLineIncrementalItem = {
    commitId: string;
    commitDate?: string;
    committer?: string;
    lines: LineIncrementalChangeItem[] | null;
  };

  interface LineBaseItem {
    lineUuid: string;
    filePath: string;
    fileUuid: string;
    type: LineType;
    code?: string;
    latest: LineLatestType;
  }
  interface LineStockItem extends LineBaseItem {
    relation: ChangeRelation;
  }

  type CommitLineStockItem = {
    commitId: string;
    commitDate?: string;
    committer?: string;
    lines: LineStockItem[];
  };

  interface LineItemWithEvoluation extends LineBaseItem {
    status: LineEvoluationItem[];
  }
  type LineEvoluationItem = {
    key: string;
    filePath: string;
    code: string;
    committers: string[];
    relation: ChangeRelation;
    current: LineCurrentType;
    lineBegin: number;
    lineEnd: number;
  };

  interface FileTreeItem<T> {
    name: string;
    key: string;
    children?: FileTreeItem[];
    isLeaf?: boolean;
    complete?: boolean;
    [key: keyof T]: T[key];
  }
}
