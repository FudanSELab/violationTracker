declare namespace API {
  type TIssueStatus = 'add' | 'changed' | 'solved' | 'merge solved';

  type TChangeStatus =
    | 'DELETE'
    | 'ADD'
    | 'CHANGED'
    | 'SELF_CHANGE'
    | 'UNCHANGED'
    | 'MOVE'
    | 'NOTADDED' // 文件未添加
    | 'DELETED' // 文件已删除
    | 'CHANGE_LINE';

  type TLevel = 'method' | 'file' | 'field';

  type EvaluationLevel =
    | 'none'
    | 'worst'
    | 'worse'
    | 'normal'
    | 'better'
    | 'best';
  export interface Response<T> {
    code: number;
    msg?: string;
    data?: T;
  }

  export interface RepoCloneLineData {
    addCloneLocationMap: any;
    addLines: number;
    cloneLines: number;
    commitId: string;
    commitTime: string;
    newCloneLines: number;
    repoId: string;
    selfCloneLines: number;
    selfCloneLocationMap: any;
    uuid: string;
  }
  export interface IssueFilterSearchParams {
    asc?: boolean;
    order?: string;
    ps?: number;
    page?: number;
    tool?: string;
    detail?: boolean;
    since?: string;
    until?: string;
    issue_uuids?: string;
    repo_uuids?: string;
    status?: string[];
    introducer?: string[];
    priority?: string[];
    project_names?: string;
    types?: string;
    solved_types?: string;
    tag?: string;
    exclude?: boolean;
  }
  export interface MethodCCNFilterSearchParams {
    order?: string;
    asc?: boolean;
    meta_method_uuids?: string;
    project_names?: string;
    repo_uuids?: string;
    method_name?: string;
    min?: number;
    max?: number;
    since?: string;
    until?: string;
    consequence?: string;
    page: number;
    ps: number;
  }
  export interface DevelopersInfoInRepoUuidRequestParams {
    repo_uuids?: string;
    since?: string;
    until?: string;
    show_details?: boolean;
    developers?: string;
    order?: string;
    asc?: boolean;
    page?: number;
    ps?: number;
  }
  export interface DevelopersInfoInRepoUuidResponseItem {
    developerName: string;
  }
  export interface ReposInfoInRepoUuidResponseItem {
    repoUuid: string;
  }
  // export interface DevelopersInfoWithPageResponse<
  //   T extends DevelopersInfoInRepoUuidResponseItem
  // > {
  //   page: number;
  //   total: number; // 页数
  //   records: number; // 记录数
  //   rows: T[];
  // }
  export interface TableListResponse<T> {
    page: number;
    total: number; // 页数
    records: number; // 记录数
    ps?: number;
    rows: T[];
  }
  export interface DeveloperWorkLoadItem
    extends DevelopersInfoInRepoUuidResponseItem {
    addLines: number;
    changedFiles: number;
    commitCount: number;
    deleteLines: number;
  }
  interface StatementInfo {
    statementUuid: string;
    repoUuid: string;
    branch: string;
    begin: number;
    end: number;
    changeRelation: TChangeStatus;
    commitId: string;
    commitTime: string;
    commitMessage: string;
    committer: string;
  }

  export interface DeveloperCodeLifecycleItem
    extends DevelopersInfoInRepoUuidResponseItem {
    average: number;
    max: number;
    min: number;
    median: number;
  }
  export interface RepoCodeLifecycleItem
    extends ReposInfoInRepoUuidResponseItem {
    average: number;
    max: number;
    min: number;
    median: number;
    upperQuartile: number;
    lowerQuartile: number;
    list: number[];
    detail: StatementInfo[];
    maxStatementInfo: StatementInfo;
    minStatementInfo: StatementInfo;
  }
  interface CodeLineCount {
    total: number;
    detail: any[];
  }
  interface SelfAndOtherCodeLineCount extends CodeLineCount {
    others: CodeLineCount;
    self: CodeLineCount;
  }
  export interface DeveloperLineCountItem
    extends DevelopersInfoInRepoUuidResponseItem {
    total: number;
    add: CodeLineCount;
    current: CodeLineCount;
    change: SelfAndOtherCodeLineCount;
    delete: SelfAndOtherCodeLineCount;
    loss: CodeLineCount;
  }
  export interface RepoLineCountItem extends ReposInfoInRepoUuidResponseItem {
    total: number;
    add: CodeLineCount;
    current: CodeLineCount;
    change: SelfAndOtherCodeLineCount;
    delete: SelfAndOtherCodeLineCount;
  }
  export interface DeveloperCommitInfoItem {
    commitId: string;
    commitTime: string;
    developerName: string;
    jiraInfo: string;
    message: string;
    repoUuid: string;
  }
  export interface DeveloperCommitStandardItem
    extends DevelopersInfoInRepoUuidResponseItem {
    developerInvalidCommitCount: number;
    developerInvalidCommitInfo: DeveloperCommitInfoItem[];
    developerJiraCommitCount: number;
    developerJiraCommitInfo: DeveloperCommitInfoItem[];
    developerValidCommitCount: number;
    commitStandard: number;
  }
  export interface DeveloperSelfIssueLifeCycleItem
    extends DevelopersInfoInRepoUuidResponseItem {
    livingIssueCount: number;
  }
  export interface DeveloperAndRepoCloneMeasureItem
    extends DevelopersInfoInRepoUuidResponseItem {
    allEliminateCloneLines: number;
    eliminateCloneLines: number;
    increasedCloneLines: number;
    increasedCloneLinesRate: string;
    othersIncreasedCloneLines: number;
    selfIncreasedCloneLines: number;
    repoUuid: string;
    addLines: number;
  }
  interface CodeQuality {
    quantity: number;
    issueCount: number;
  }
  export interface DeveloperAllCodeQuality {
    eliminatedIssuePerHundredLine: number; // E/L
    notedIssuePreHundredLine: number; // N/L
    addedIssueCount: number;
    solvedIssueCount: number;
    loc: number;
  }
  export interface DeveloperCodeQualityItem
    extends DevelopersInfoInRepoUuidResponseItem {
    add: CodeQuality;
    solve: CodeQuality;
    loc: number;
  }
  export interface CodeLines {
    commentLines: number;
    codeLines: number;
  }
  export interface DeveloperRepoDetailItem {
    // ?
    repoUuid: string;
    add: CodeLines;
    delete: CodeLines;
    commitId: string;
    parentCommitIds: {
      first: string;
      second: string;
    };
    commitTime: string;
    commitMessage: string;
    developerName: string;
    files: number;
    classes: number;
    functions: number;
    ccn: number; // 圈复杂度
    changedFiles: number;
    javaDocs: {
      total: number;
      lines: number;
    };
    commentLines: {
      single: number;
      multi: number;
    };
    ncss: number; // ?
    uuid: string; // ?
    _merge: boolean;
  }
  export interface DeveloperChangeFileNumItem
    extends DevelopersInfoInRepoUuidResponseItem {
    num: number;
  }

  export interface UserInfo {
    username: string;
    token: string;
    right: number;
  }

  export interface IssueItem {
    displayId: number;
    uuid: string;
    type: string;
    issueCategory: string;
    repoUuid: string;
    targetFiles: string;
    producer: string;
    startCommitDate: string;
    status: TIssueStatus;
    priority: number;
    tag: string;
  }

  export type SideMenuItem = {
    language: string;
    categories: {
      name: string;
      total: number;
      types: {
        type: string;
        count: number;
      }[];
    }[];
  };

  export interface BugLocation {
    // bugLines: string;
    uuid?: string;
    startLine: number;
    endLine: number;
    bugLines?: number;
    startToken: number;
    endToken: number;
    filePath: string;
    className?: string;
    methodName?: string;
    rawIssueId?: string;
    code?: string;
    repoUuid?: string;
    offset: number;
    locationMatchResults: string[];
    matched: boolean;
    matchedIndex: number;
    tokens: number[];
  }

  export interface RawIssueHistoryItem {
    uuid: string;
    repoUuid: string;
    commitId: string;
    commitTime: string;
    committer: string;
    fileName: string;
    status: TIssueStatus;
    location?: BugLocation[];
    locations?: BugLocation[];
    message?: string;
    uuid?: string;
    version?: number;
    detail: string;
    type: string;
    tool?: string;
    scanId?: string;
    rawIssueHash?: string;
    priority?: number;
    matchResultDTOIndex?: number;
    matchInfos?: string[];
    matchDegree?: number;
    issueId?: string;
  }

  // method
  export interface MethodMeta {
    fileName: string;
    className: string;
    trackerNum: number;
    packageName: string;
    methodName: string;
  }

  type IssueState =
    | ''
    | 'bug_add'
    | 'bug_changed'
    | 'bug_may_changed'
    | 'solved'
    | 'failed';
  type TrackerState = '' | 'unchanged' | 'changed';

  export interface HistoryCommitChain {
    commitId: string;
    date: string;
    committer: string;
    status: IssueState;
  }

  export interface CommitNodeItem {
    commitId: string;
    committer: string;
    commitTime: string;
    parentCommit: string[];
    issueStatus: IssueState;
    // trackerStatus: TrackerState;
    filePath?: string;
  }

  export interface CommitEdgeItem {
    target: string;
    source: string;
    changeRelation: TChangeStatus;
    type?: string;
    comparable: boolean;
  }

  export interface MethodInfo {
    metaUuid: string;
    commitId: string;
    statementList: string[];
    level: string;
  }

  export interface CommitCodeInfoTitle {
    commitId: string;
    committer: string;
    message: string;
    date: string;
    filePath?: string;
    signature?: string; // 方法签名
    metaUuid: string;
    lineBegin: number;
    lineEnd: number;
    changeStatus: TChangeStatus;
  }

  export interface CommitCodeInfo extends CommitCodeInfoTitle {
    body: string;
  }

  export interface RetrospectFileOrMethodItem {
    metaUuid: string;
    fullName: string;
    filePath?: string;
  }

  export interface RetrospectHistory {
    commitId: string;
    committer: string;
    body: string;
    date: string;
    changeStatus: TChangeStatus;
    lineBegin: number;
    lineEnd: number;
  }

  export interface RetrospectResult {
    title: string;
    begin: number;
    end: number;
    // commitId: string;
    histories: RetrospectHistory[];
  }

  export interface AccountSimpleItem {
    account_name: string;
    account_uuid: string;
  }

  export interface Account {
    uuid: string;
    accountName: string;
  }

  export type UserItem = {
    uuid: string;
    accountName: string;
    dep: string; // 部门
    email: string;
    status: string; //在职状态
    role: string;
    right?: any; // 权限
  };

  export interface UserDetailSearchParams {
    page: number;
    ps: number;
    account_status?: 0 | 1;
  }

  export type ProjectLifeStatus = 0 | 1 | 2;
  /** Project */

  // fixme get repo from issue service for FSE
  export type RepoScanStatus = {
    repoUuid: string;
    scanStatus: string;
    endScanTime: string;
    totalCommitCount: number;
    scannedCommitCount: number;
    scanTime: number;

    tool: string;
  };
  export interface ProjectItem {
    projectId: string;
    projectName: string;
    lifeStatus: number;
    leaders: AccountSimpleItem[];
  }
  export interface ProjectSimpleItem {
    projectId: string;
    projectName: string;
    repoList: {
      repoUuid: string;
      repoName: string;
    }[];
  }
  export type ProjectScanItem = {
    leaders?: API.AccountSimpleItem[];
    repoUuid?: string;
    branch?: string;
    scanStatus?: string;
    endScanTime?: string;
    totalCommitCount?: number;
    scannedCommitCount?: number;
    scanTime?: number;
    toolStatuses?: {
      service: string;
      scanStatus:
        | 'waiting for scan'
        | 'analyze failed'
        | 'invoke tool failed'
        | 'complete'
        | 'scanning'
        | 'stop'
        | 'failed'
        | 'interrupt';
      // toolName: string;
    }[];
    overStock?: number;
  };
  export interface ProjectScanSearchParams {
    page: number;
    ps: number;
    project_name?: string;
    repo_name?: string;
    leaders?: string;
    order?: string;
    asc?: boolean;
  }
  export interface RepoItem {
    name: string;
    repo_id: string;
  }
  export interface RepositoryItem {
    repoName: string;
    repoUuid: string;
  }

  export interface WorkFocusTreeItem {
    node: string;
    name: string;
    quantity: number;
    uuid: string;
  }

  export type IgnoreItem = {
    //     branch: string,
    accountName: string;
    accountUuid?: string;
    ignoreTime: string;
    issueUuid: string;
    repoUuid: string;
    tag: string;
    tool: string;
    type: string;
    reason?: string;
  };

  // 这个接口可能没用了
  // 换成新接口DeveloperRankItem
  export type DeveloperItem = {
    developerName: string;
    totalLevel: number;
    quality: number;
    contribution: number;
    efficiency: number;
    dutyType: string;
    involvedRepoCount: number;
  };

  export type MethodTotalItem = {
    metaMethodUuid: string;
    repoUuid: string;
    methodName: string;
    cyclomaticComplexity: string; // 圈复杂度
    methodChangeCount: string; // 修改次数
    methodLatestChangeDate: string;
    methodLatestLineCount: string; // 最新行数
    latestIssueCount: number; // 最新静态缺陷数
    latestCommit: string;
    latestDeveloper: string;
    latestChangeRelation: TChangeStatus; // 当前状态
    latestFilePath: string;
    jiraType?: string; // Jira 任务类型
    consequence: string;
    deleted: boolean; // 已删除
  };

  export type ChangedFilesTotalItem = {
    projectName: string; // 项目名
    repoUuid: string; // 代码库名
    metaFileUuid: string; // 文件ID
    branchName: string; // 分支名
    fileName: string; // 文件名
    fileChangeCount: number; // 文件修改数
  };

  export interface ChangedFilesDetailSearchParams {
    page: number;
    ps: number;
    project_names?: string;
    repo_uuids?: string;
    branch_name?: string;
    file_name?: string;
    meta_file_uuids?: string;
    min?: number;
    max?: number;
    since?: string;
    until?: string;
    order?: string;
    asc?: boolean;
  }

  export type CommitStandardTotalItem = {
    projectId: string;
    projectName: string;
    repoUuid: string;
    repoName: string;
    commitId: string; // 提交id
    commitTime: string; // 提交时间
    committer: string; // 提交者
    message: string; // 提交内容
    isValid: boolean; // 提交规范指数
  };

  export interface CommitStandardSearchParams {
    page: number;
    ps: number;
    order?: string;
    asc?: boolean;
    project_names?: string;
    repo_uuids?: string;
    since?: string; // 提交开始时刻
    until?: string; // 提交结束时刻
    is_valid?: boolean;
    committer?: string;
    // total 总记录数
    // records 具体工作行数
  }

  /**
   * 1: 完全一致
   * 2: 部分一致
   */
  export type CloneType = 1 | 2;

  export type CloneGroupTotalItem = {
    projectName: string;
    projectId: string;
    commitId: string;
    date: string; // 扫描时间
    repoUuid: string; // key
    groupSum: number; // 克隆组数
    caseSum: number; // 实例数
    fileSum: number; // 文件数
    codeLengthAverage: number;
    cloneType: CloneType;
  };
  export interface CloneGroupSearchParams {
    page: number;
    ps: number;
    order?: string;
    asc?: boolean;
    project_names?: string;
    project_ids?: string;
    repo_uuids?: string;
    until?: string;
  }
  export interface CloneGroupDetailSearchParams {
    page: number;
    ps: number;
    project_names?: string;
    project_ids?: string;
    repo_uuids?: string;
    until?: string;
    overall?: boolean; // true
  }
  export interface CloneGroupRepoDetailSearchParams {
    page: number;
    ps: number;
    order?: string;
    asc?: boolean;
    project_ids?: string;
    project_names?: string;
    commit_id?: string;
    group_id?: number;
    overall?: boolean; // false
  }

  export type CloneGroupDetailItem = {
    uuid: string; // key
    projectName: string;
    projectId: string;
    repoUuid: string;
    commitId: string;
    groupId: number;
    cloneType: CloneType; // 克隆类型
    caseSum: number; // 克隆事件总数
    fileSum: number; // 文件总数
    codeLengthAverage: number; // 平均克隆代码行数
  };

  export type CloneGroupRepoDetailItem = {
    uuid: string; // key
    projectName: string;
    projectId: string;
    repoUuid: string;
    commitId: string;
    filePath: string;
    groupId: number;
    className: string;
    startLine: number;
    endLine: number;
    lineCount: number; // 克隆行数
    detail: string;
    cloneType: CloneType; // 克隆类型
  };

  export type LargeFileTotalItem = {
    projectId: string;
    projectName: string;
    repoUuid: string;
    repoName: string;
    filePath: string;
    currentModifyTime: string;
    currentLines: number;
  };

  export interface LargeFileSearchParams {
    page: number;
    ps: number;
    order?: string;
    asc?: boolean;
    // since?: string;
    // until?: string;
    current_modify_time?: string;
    project_names?: string;
    repo_uuids?: string;
    // repo_name?: string;
    // current_modify_time?: string;
  }

  export type DeveloperRankSimpleItem = {
    developerName: string;
    count: string;
  };

  export type DeveloperRankItem = {
    developerName: string;
    totalLevel: number;
    livingIssue: DeveloperLivingIssueItem;
    ccn: DeveloperCCNItem;
    codeStability: DeveloperCodeStabilityItem;
    commitStandard: DeveloperCommitStandardInfoItem;
    cloneLine: DeveloperCloneLineItem;
    bigMethods: DeveloperBigMethodsItem;
    dataWorkLoad: DeveloperDataWorkLoadItem;
    designContribution: DeveloperDesignContributionItem;
    completedJira: DeveloperCompletedJiraItem;
  };
  export interface DeveloperRankSearchParams {
    asc?: boolean;
    order?: string;
    page?: number;
    ps?: number;
    since?: string;
    until?: string;
    project_names?: string;
    repo_uuids?: string;
    developers?: string;
    detail?: boolean;
  }
  export interface DeveloperRankSearchResult {
    developerName: string;
    projectName?: string;
    num: number;
    levelNum: number;
    level: 'worst' | 'worse' | 'normal' | 'better' | 'best' | 'none';
    detail: any; // 根据具体情况
  }

  export interface DeveloperLivingIssueItem extends DeveloperRankSearchResult {}

  export interface DeveloperCCNItem extends DeveloperRankSearchResult {
    developerProjectCcnList?: string[]; //各项目圈复杂度修改明细
    totalDiffCcn?: number; // 指定时间段内的总修改圈复杂度
  }

  export interface DeveloperCodeStabilityItem
    extends DeveloperRankSearchResult {}

  export interface DeveloperCommitStandardInfoItem
    extends DeveloperRankSearchResult {
    developerValidCommitCount?: number;
    developerJiraCommitCount?: number; // Jira单号的提交次数
    commitStandard: number;
  }

  export interface DeveloperCloneLineItem extends DeveloperRankSearchResult {
    repoUuid: string;
    increasedCloneLines: number; // 作为分子
    selfIncreasedCloneLines?: number;
    othersIncreasedCloneLines?: number;
    increasedCloneLinesRate?: number;
    eliminateCloneLines: number;
    allEliminateCloneLines?: number;
    addLines: number; // 作为分母
  }

  export interface DeveloperBigMethodsItem extends DeveloperRankSearchResult {
    count: number;
  }

  export interface DeveloperDataWorkLoadItem extends DeveloperRankSearchResult {
    addLines: number;
    deleteLines: number;
    totalLoc: number; // 总物理行数
  }

  export interface DeveloperDesignContributionItem
    extends DeveloperRankSearchResult {}

  export interface DeveloperCompletedJiraItem
    extends DeveloperRankSearchResult {}

  export type Tool = {
    uuid: string;
    accountName: string;
    enabled: boolean;
    toolName: string;
    toolType: string;
    inastalled: boolean;
  };

  export type DependencyDetailItem = {
    projectName: string;
    repoUuid: string;
    until: string;
    groupId: string;
    sourceFile: string; // 依赖文件
    targetFile: string; // 被依赖文件
    relationType: string; // 依赖关系 && 次数
  };

  export type CycleDependencyTotalItem = {
    projectName: string;
    repoUuid: string;
    repoName: string;
    until: string;
    groupId: string;
    // files: string[];
    fileStrings: string[];
    // relationViews: string;
    commitId: string;
    id: string;
  };

  export interface CycleDependencySearchParams {
    page: number;
    ps: number;
    order?: string;
    asc?: boolean;
    project_names?: string;
    repo_uuids?: string;
    // group_id?: string;
    // commit_id?: string;
    scan_since?: string; // 当时开始时刻
    scan_until?: string; // 当时结束时刻
  }

  export type RepoMetricStandardDetailItem = {
    tag: string; // 维度
    updateTime: string;
    updater: string;
    bestMax: number;
    bestMin: number;
    betterMax: number;
    betterMin: number;
    normalMax: number;
    normalMin: number;
    worseMax: number;
    worseMin: number;
    worstMax: number;
    worstMin: number;
  };
  export interface RepoMetricStandardSearchParams {
    repo_uuid?: string;
  }

  export type RepoMetricStandardUpdateParams = {
    tag: string;
    repo_uuid: string;
    best_max: number;
    best_min: number;
    better_max: number;
    better_min: number;
    normal_max: number;
    normal_min: number;
    worse_max: number;
    worse_min: number;
    worst_max: number;
    worst_min: number;
  };

  export type DeveloperFocusedFileItem = {
    developerName: string;
    num: number;
  };

  export type DeveloperIssueLifecycleItem = {
    [developerName: string]: {
      quantity: number;
      min: number;
      max: number;
      mid: number;
    };
  };

  export type DependencyRateAllListItem = {
    id: number;
    projectName: string;
    repoName: string;
    repoUuid: string;
    commitId: string;
    commitTime: string;
    moduleName: string;
    groupId: string;
    artifactId: string;
    version: string;
  };

  export interface DependencyRateAllListSearchParams {
    project_names?: string;
    repo_uuids?: string;
    ps?: number;
    page?: number;
  }

  export type DependencyRateConflictListItem = {
    id: string; //唯一标识
    projectName: string;
    projectId: string;
    updateTime: string;
    artifactId: string;
    count: number;
    commitIds: string[];
  };

  export interface DependencyRateConflictListSearchParams {
    project_names?: string;
    artifact_ids?: string;
    ps?: number;
    page?: number;
  }

  export type DependencyRateConflictDetailItem = {
    id: number;
    repoUuid: string;
    moduleName: string;
    groupId: string;
    projectName: string;
    projectId: string;
    artifactId: string;
    commitId: string;
    commitTime: string;
    version: string;
  };
  export interface DependencyRateConflictDetailSearchParams {
    project_name?: string;
    project_id?: string;
    commit_ids?: string;
    artifact_id?: string;
    ps?: number;
    page?: number;
  }

  export type CommitItem = {
    commitId: string;
    commitTime: string;
    developer: string;
    developerEmail: string;
    message: string;
    repoId: string;
    uuid: string;
    scanned: boolean;
  };

  export interface AllMeasureSearchParams {
    developer: string;
    repo_uuids?: string;
    since?: string;
    until?: string;
  }

  export type MeasureCommitStandard = {
    developerValidCommitCount: number;
    developerJiraCount: number;
    commitStandard: number;
  };

  export type MeasureStatement = {
    developerAddStatement: number;
    developerChangeStatement: number;
    developerValidLine: number;
    totalAddStatement: number;
    totalValidLine: number;
    addStatementRate: number;
    surviveRate: number;
    deathRate: number;
  };
  export type MeasureCodeStandardAndIssue = {
    solvedSonarIssue: number;
    days: number;
    developerLOC: number;
    developerStandardIssueCount: number;
    totalStandardIssueCount: number;
    developerNewIssueCount: number;
    totalNewIssueCount: number;
    codeStandard: number;
    issueRate: number;
    issueDensity: number;
    solveSonarIssuePerDay: number;
  };
  export type MeasureClone = {
    developerAddLine: number;
    increasedCloneLines: number;
    defaultScore: number;
    nonRepetitiveCodeRate: number;
  };
  export type MeasureJira = {
    developerAssignedJiraCount: number;
    totalAssignedJiraCount: number;
    developerSolvedJiraCount: number;
    totalSolvedJiraCount: number;
    developerJiraBugCount: number;
    totalJiraBugCount: number;
    jiraBug: number;
    jiraFeature: number;
    days: number;
    defaultScore: number;
    assignedJiraRate: number;
    solvedJiraRate: number;
    jiraBugRate: number;
    jiraBugPerDay: number;
    jiraFeaturePerDay: number;
  };

  export type TGitGraph = 'issue';

  export type JiraTaskItem = {
    duration: string;
    issueType: string;
    jiraDescription: string;
    jiraSummary: string;
    jiraUuid: string;
    projectId: string;
    projectName: string;
    repoUuid: string;
    participants: number;
    status: string;
    totalCount: number;
    jiraTaskDetails: API.JiraTaskDetailItem[];
  };

  export interface JiraTaskSearchParams {
    jira_id?: string;
    project_names?: string;
    project_ids?: string;
    repo_uuids?: string;
    status?: string;
    ps?: number;
    page?: number;
  }

  export type JiraTaskDetailItem = {
    developer: string;
    commitId: string;
    commitTime: string;
    commitMessage: string;
  };

  export type StaticIssueAnalysisItem = {
    developer: string;
    introduceNum: number;
    selfIntroduceOpenNum: number;
    selfIntroduceSelfSolvedMiddleNum: number;
    selfIntroduceOthersSolveNum: number;
    selfIntroduceSelfSolvedNum: number;
    lastIntroduceTime: string;
    riskLevel: number;
  };

  export interface StaticIssueAnalysisSearchParams {
    order?: string;
    asc?: boolean;
    ps?: number;
    page?: number;
    developer?: string;
    project_names?: string;
    repo_uuids?: string;
  }

  export type DeveloperJiraMissionItem = {
    commitPerJira: {
      finishedJiraSum: number;
      commitSum: number;
      rate: number;
    };
    toDoJiraMessage: toDoJiraMessageItem[];
    defectRate: {
      teamBugSum: number;
      rate: number;
      individualBugSum: number;
    };
    timeSpan: {
      unfinishedJiraSum: number;
      timeSpanCommittedSum: number;
      averageTimeSpanCommittedSum: number;
      timeSpanCreatedSum: number;
      averageTimeSpanCreatedSum: number;
    };
    differentTypeSum: {
      duration: number;
      totalBugSum: number;
      completedTaskSum: number;
      totalTaskSum: number;
      completedBugSum: number;
      completedTaskSumPerDay: number;
      completedBugSumPerDay: number;
    };
    completionRate: {
      completedJiraSum: number;
      completionRate: number;
      jiraSoloSum: number;
    };
    assignedJiraRate: {
      teamJiraSum: number;
      individualRate: number;
      solvedIndividualJiraSum: number;
      solvedTeamJiraSum: number;
      individualJiraSum: number;
      solvedJiraRate: number;
    };
  };

  export type toDoJiraMessageItem = {
    createdTime: string;
    issueType: string;
    jiraDetails: jiraDetailsItem[];
    jiraUuid: string;
    status: string;
    summary: string;
  };

  export type jiraDetailsItem = {
    commitTime: string;
    commitUuid: string;
    developer: string;
    issueType: string;
    jiraUuid: string;
  };

  export interface DeveloperJiraMissionSearchParams {
    developer: string;
    repo_uuid?: string;
    status?: string; // done || inProgress
    since?: string;
    until?: string;
  }

  type CommitFilesMap = {
    [commit_id: string]: {
      RENAME: string[];
      ADD: string[];
      DELETE: string[];
      CHANGE: string[];
    };
  };

  export type TagItems = {
    id: string;
    name: string;
    description: string;
    createUserId: string;
    updateUserId?: string;
    updateTime?: string;
    deleted: number;
    relativeFilePath: string;
  };

  export type FileTreeItems = {
    file_counts: number;
    file_list: Object;
    // file_list: {
    // [key:string]:{filePath: string}
    // file_key: object;
    // };
  };
}
