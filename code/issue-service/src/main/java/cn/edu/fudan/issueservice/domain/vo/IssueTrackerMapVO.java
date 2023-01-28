package cn.edu.fudan.issueservice.domain.vo;

import cn.edu.fudan.issueservice.domain.dbo.*;
import cn.edu.fudan.issueservice.domain.enums.IssueTrackerStatus;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import cn.edu.fudan.issueservice.domain.enums.SolveWayEnum;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import cn.edu.fudan.issueservice.util.MeasureCommitUtil;
import cn.edu.fudan.issueservice.util.StringsUtil;
import com.alibaba.fastjson.JSON;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.io.Serializable;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author Jerry Zhang
 * create: 2022-06-24 15:29
 */
@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueTrackerMapVO implements Serializable {
    private PagedGridResult<IssueTrackerNode> node;
    private List<CommitEdge> edge;
    private List<RawIssue> issueLocations;
    private FileMetaInfo metaInfo;

    public void initTrackerMap(List<Commit> commitList, List<RawIssueMatchInfo> rawIssueMatchInfoList,
                               List<RawIssue> rawIssueList, List<RawIssue> solvedPreRawIssueList,
                               Set<String> failedCommitList, boolean showAll, Integer page, Integer ps) {
        this.metaInfo = new FileMetaInfo();
        // 追溯次数
        this.metaInfo.setTrackerNum(rawIssueMatchInfoList.size());
        log.debug("tracker num is {}", rawIssueMatchInfoList.size());
        if (rawIssueList == null || rawIssueList.isEmpty()) {
            log.debug("add or mapped raw-issue list is empty");
            return;
        }
        // 键值对 commit id -> commit
        Map<String, Commit> commitMap = new HashMap<>(32);
        commitList.forEach(commit -> commitMap.put(commit.getCommitId(), commit));

        // 设置 raw issue 时间
        rawIssueList.forEach(rawIssue -> {
            rawIssue.setMessage(commitMap.get(rawIssue.getCommitId()).getMessage());
            rawIssue.setCommitTime(DateTimeUtil.stringToDate(commitMap.get(rawIssue.getCommitId()).getCommitTime()));
        });
        rawIssueList.sort(Comparator.comparing(RawIssue::getCommitTime));
        this.metaInfo.setFileName(rawIssueList.get(0).getFileName());
        this.metaInfo.setClassName(findClassName(rawIssueList.get(0).getFileName()));

        log.debug("solved raw-issue list size is {}", solvedPreRawIssueList.size());
        log.debug("failed commit list size is {}", failedCommitList.size());

        // key: status, value: list of commit ids
        Map<String, Set<String>> trackerCommitMap = new HashMap<>();
        //      a. changed commits（all）
        trackerCommitMap.put(IssueTrackerStatus.CHANGED.getType(), new HashSet<>());
        //      b. 新增issue的commit
        trackerCommitMap.put(IssueTrackerStatus.BUG_ADD.getType(), new HashSet<>());
        //      c. issue变化的commit
        trackerCommitMap.put(IssueTrackerStatus.BUG_CHANGED.getType(), new HashSet<>());
        //      d. issue可能发生变化的commit（default、failed 等）
        trackerCommitMap.put(IssueTrackerStatus.BUG_MAY_CHANGED.getType(), new HashSet<>());
        //      e. 解决issue的commit
        trackerCommitMap.put(IssueTrackerStatus.SOLVED.getType(), new HashSet<>());

        // 以 file delete 方式修复的 commit
        Set<String> fileDeleteSet = new HashSet<>(8);
        Map<String, String> solvedRawIssueUuidMap = new HashMap<>(8);
        // 最早出现的日期
        Date addDate = null;
        for (RawIssueMatchInfo info : rawIssueMatchInfoList) {
            trackerCommitMap.get(IssueTrackerStatus.CHANGED.getType()).add(info.getCurCommitId());
            if (RawIssueStatus.SOLVED.getType().equals(info.getStatus()) ||
                    info.getStatus().contains("solve")) {
                trackerCommitMap.get(IssueTrackerStatus.SOLVED.getType()).add(info.getCurCommitId());
                solvedRawIssueUuidMap.put(info.getCurCommitId(), info.getPreRawIssueUuid());
                // file deletion
                if (info.getSolveWay() != null && info.getSolveWay().equals(SolveWayEnum.FILE_DELETE.lowercase)) {
                    fileDeleteSet.add(info.getCurCommitId());
                }
            } else if (RawIssueStatus.ADD.getType().equals(info.getStatus()) ||
                    RawIssueStatus.MERGE_NEW.getType().equals(info.getStatus()) ||
                    RawIssueStatus.REOPEN.getType().equals(info.getStatus()) ||
                    RawIssueStatus.MERGE_REOPEN.getType().equals(info.getStatus())) {
                trackerCommitMap.get(IssueTrackerStatus.BUG_ADD.getType()).add(info.getCurCommitId());
                // 最早出现的时间
                if (commitMap.get(info.getCurCommitId()) != null && (addDate == null ||
                        !after(commitMap.get(info.getCurCommitId()).getCommitTime(), addDate))) {
                    addDate = DateTimeUtil.stringToDate(commitMap.get(info.getCurCommitId()).getCommitTime());
                }
            } else if (RawIssueStatus.CHANGED.getType().equals(info.getStatus())) {
                trackerCommitMap.get(IssueTrackerStatus.BUG_CHANGED.getType()).add(info.getCurCommitId());
            } else if (RawIssueStatus.DEFAULT.getType().equals(info.getStatus())) {
                trackerCommitMap.get(IssueTrackerStatus.BUG_MAY_CHANGED.getType()).add(info.getCurCommitId());
            }
        }
        // 扫描失败的commit
        trackerCommitMap.get(IssueTrackerStatus.BUG_MAY_CHANGED.getType()).addAll(failedCommitList);

        // 初始化 tracker node 信息
        List<IssueTrackerNode> nodes = getTrackerNodes(commitList, rawIssueList, solvedPreRawIssueList, solvedRawIssueUuidMap, fileDeleteSet, trackerCommitMap);

        log.debug("all nodes size is {}", nodes.size());
        for (Map.Entry<String, Set<String>> entry : trackerCommitMap.entrySet()) {
            log.debug("{} nodes size is {}", entry.getKey(), entry.getValue().size());
        }
        nodes.sort(Comparator.comparing(IssueTrackerNode::getCommitTime).reversed());
        // commit 边关系
        Set<String> edgeSet = initEdges(nodes, commitMap, addDate);

        if (page == 1) {
            // 仅首次需要返回的信息
            this.setIssueLocations(rawIssueList);
        }

        if (Boolean.TRUE.equals(showAll)) {
            // 所有节点
            PagedGridResult<IssueTrackerNode> nodePagedGridResult = PagedGridResult.restPage(nodes, page, ps);
            this.setNode(nodePagedGridResult);
            if (nodePagedGridResult.getRows().isEmpty()) {
                return;
            }
            // 设置 commit 间的父子关系
            this.setEdge(handleDirectEdges(page, ps, nodes, edgeSet));
        } else {
            // 筛选有 issue 或追溯有变更的 node 历史
            log.debug("filter nodes with issues/changes");
            List<IssueTrackerNode> filterNodes = new ArrayList<>();
            nodes.forEach(n -> {
                for (RawIssueMatchInfo info : rawIssueMatchInfoList) {
                    if (n.getCommitId().equals(info.getCurCommitId())) {
                        filterNodes.add(n);
                        break;
                    }
                }
            });
            log.debug("{} nodes have issues or changes", filterNodes.size());
            filterNodes.sort(Comparator.comparing(IssueTrackerNode::getCommitTime).reversed());
            Set<String> filterCommits = filterNodes.stream().map(IssueTrackerNode::getCommitId).collect(Collectors.toSet());
            filterNodes.forEach(n -> {
                if (StringUtils.isEmpty(n.getFilePath()) && !n.getIssueStatus().equals("solved")) {
                    log.info("raw issue commits: {}", JSON.toJSONString(filterCommits));
                }
            });
            PagedGridResult<IssueTrackerNode> filterNodePage = PagedGridResult.restPage(filterNodes, page, ps);
            this.setNode(filterNodePage);
            log.debug("a total of {} node information are obtained on page {}", filterNodePage.getRows().size(), page);
            if (filterNodePage.getRows().isEmpty()) {
                return;
            }
            log.debug("update the edges of the nodes");
            // commit 间的非直接父子关系
            this.setEdge(handleIndirectEdges(page, ps,
                    new HashSet<>(trackerCommitMap.get(IssueTrackerStatus.CHANGED.getType())),
                    filterNodes, commitMap, rawIssueList));
        }
    }

    /**
     * 初始化 tracker node
     *
     * @param commitList
     * @return
     */
    private List<IssueTrackerNode> getTrackerNodes(List<Commit> commitList, List<RawIssue> rawIssues, List<RawIssue> solvedPreRawIssues,
                                                   Map<String, String> solvedRawIssueUuidMap, Set<String> fileDeleteSet, Map<String, Set<String>> trackerCommitMap) {
        // 键值对 commit -> rawIssue
        Map<String, RawIssue> rawIssueMap = new HashMap<>(16);
        rawIssues.forEach(rawIssue -> rawIssueMap.put(rawIssue.getCommitId(), rawIssue));
        // 键值对 raw issue uuid -> rawIssue
        Map<String, RawIssue> preRawIssueMap = new HashMap<>(8);
        solvedPreRawIssues.forEach(rawIssue -> preRawIssueMap.put(rawIssue.getUuid(), rawIssue));

        // 不直接通过 repo uuid 查找 commit 表，存在一个 commit 属于多个 repo 的情况，获取的 commit 列表不全
        List<IssueTrackerNode> trackerNodes = new ArrayList<>();
        Set<String> distinctCommits = new HashSet<>();
        for (Commit commit : commitList) {
            if (!distinctCommits.contains(commit.getCommitId())) {
                IssueTrackerNode trackerNode = new IssueTrackerNode();
                trackerNode.setCommitId(commit.getCommitId());
                List<String> parentCommit = StringsUtil.parseParentCommits(commit.getParentCommits());
                StringJoiner sj = new StringJoiner(",");
                parentCommit.forEach(sj::add);
                trackerNode.setParentCommit(sj.toString());
                trackerNode.setCommitter(commit.getDeveloper());
                trackerNode.setCommitTime(DateTimeUtil.stringToDate(commit.getCommitTime()));
                trackerNode.setAuthorTime(DateTimeUtil.stringToDate(commit.getAuthorTime()));
                String filePath;
                if (fileDeleteSet.contains(trackerNode.getCommitId())) {
                    // 以 file delete 方式解决的 commit，文件路径应当为空
                    filePath = "";
                    trackerNode.setSolveWay(SolveWayEnum.FILE_DELETE.lowercase);
                } else {
                    if (solvedRawIssueUuidMap.containsKey(commit.getCommitId())) {
                        filePath = findFilePath(preRawIssueMap.get(solvedRawIssueUuidMap.get(commit.getCommitId())));
                        trackerNode.setSolveWay("others");
                    } else {
                        filePath = findFilePath(rawIssueMap.get(commit.getCommitId()));
                    }
                }
                trackerNode.setFilePath(filePath);
                // 更新状态
                setTrackerStatus(trackerCommitMap, trackerNode);
                trackerNodes.add(trackerNode);
                distinctCommits.add(trackerNode.getCommitId());
            }
        }
        return trackerNodes;
    }

    /**
     * commit 父子关系
     *
     * @param nodes
     * @param commitMap
     * @param addDate
     * @return
     */
    private Set<String> initEdges(List<IssueTrackerNode> nodes, Map<String, Commit> commitMap, Date addDate) {
        Set<String> edgeSet = new HashSet<>();
        Set<String> commitSet = new HashSet<>(32);
        nodes.forEach(issueTrackerNode -> commitSet.add(issueTrackerNode.getCommitId()));
        for (IssueTrackerNode n : nodes) {
            if (n != null) {
                edgeSet.add(n.getCommitId() + "_" + n.getParentCommit());
                Set<String> changedResult = new HashSet<>();
                findParentCommits(n.getCommitId(), changedResult, commitSet, commitMap, addDate, new HashSet<>());
            }
        }
        return edgeSet;
    }

    /**
     * 直接父子关系
     *
     * @param page
     * @param ps
     * @param nodes   //     * @param allNodeMap
     * @param edgeSet
     * @return
     */
    private List<CommitEdge> handleDirectEdges(Integer page, Integer ps, List<IssueTrackerNode> nodes, Set<String> edgeSet) {
        List<CommitEdge> edges = new ArrayList<>();
        for (IssueTrackerNode n : nodes.subList((page - 1) * ps, Math.min(page * ps, nodes.size()))) {
            Set<String> parentCommitSet = new HashSet<>(StringsUtil.parseParentCommits(n.getParentCommit()));
            for (String parent : parentCommitSet) {
                CommitEdge e = CommitEdge.builder()
                        .target(n.getCommitId())
                        .source(parent)
                        .changeRelation("UNCHANGED").build();
                if (edgeSet.contains(n.getCommitId() + "_" + parent)) {
                    e.setChangeRelation("CHANGED");
                }
                edges.add(e);
            }
        }
        return edges;
    }

    /**
     * 间接父子关系
     *
     * @param page
     * @param ps
     * @param changedCommits
     * @param filterNodes
     * @param commitMap
     * @param rawIssues
     * @return
     */
    private List<CommitEdge> handleIndirectEdges(Integer page, Integer ps, Set<String> changedCommits,
                                                 List<IssueTrackerNode> filterNodes,
                                                 Map<String, Commit> commitMap,
                                                 List<RawIssue> rawIssues) {
        List<CommitEdge> edges = new ArrayList<>();
        // 当前page
        List<IssueTrackerNode> curNodes = filterNodes.subList((page - 1) * ps, Math.min(page * ps, filterNodes.size()));
        // 当前page前的所有node
        List<IssueTrackerNode> beforeNodes = filterNodes.subList(0, Math.min(page * ps, filterNodes.size()));
        if (curNodes.isEmpty()) return edges;
        Date minDate = curNodes.get(curNodes.size() - 1).getCommitTime();
        Set<String> curCommitSet = curNodes.stream().map(IssueTrackerNode::getCommitId).collect(Collectors.toSet());
        for (IssueTrackerNode n : beforeNodes) {
            Set<String> parents = new HashSet<>();
            Set<String> directParents = Set.of(commitMap.get(n.getCommitId()).getParentCommits().split(","));
            Set<String> visitedCommits = new HashSet<>();
            // 寻找commit的parents
            findParentCommits(n.getCommitId(), parents, curCommitSet, commitMap, minDate, visitedCommits);
            for (String parent : parents) {
                if (!curCommitSet.contains(parent)) {
                    // 只保留当前页面的commit作为source的edge
                    continue;
                }
                CommitEdge e = CommitEdge.builder()
                        .target(n.getCommitId())
                        .source(parent)
                        .changeRelation("UNCHANGED")
                        .type(directParents.contains(parent) ? "direct" : "indirect")
                        .build();
                if (changedCommits.contains(n.getCommitId())) {
                    int v1 = findVersion(rawIssues, n.getCommitId());
                    int v2 = findVersion(rawIssues, parent);
                    if (v2 != -1 && v1 != v2) {
                        e.setChangeRelation("CHANGED");
                    }
                }
                edges.add(e);
            }
        }
        log.debug("indirect edges size: {}", edges.size());
        return edges;
    }

    /**
     * 更新状态
     *
     * @param commitMap
     * @param node
     */
    private void setTrackerStatus(Map<String, Set<String>> commitMap, IssueTrackerNode node) {
        node.setIssueStatus("");
        for (Map.Entry<String, Set<String>> entry : commitMap.entrySet()) {
            if (!entry.getKey().equals(IssueTrackerStatus.CHANGED.getType()) &&
                    entry.getValue().contains(node.getCommitId())) {
                node.setIssueStatus(entry.getKey());
            }
        }
    }

    /**
     * 寻找 commitOfCurrentPage 中 commit 的 parent，结果放在 parents 中
     *
     * @param commitId
     * @param parents
     * @param commitOfCurrentPage
     * @param commitMap
     * @param minDate
     * @param visitedCommits
     */
    private void findParentCommits(String commitId, Set<String> parents, Set<String> commitOfCurrentPage, Map<String, Commit> commitMap, Date minDate, Set<String> visitedCommits) {
        if (commitOfCurrentPage.isEmpty() || commitMap.get(commitId) == null) {
            return;
        }
        Set<String> parentCommitSet = new HashSet<>(StringsUtil.parseParentCommits(commitMap.get(commitId).getParentCommits()));
        for (String parentCommit : parentCommitSet) {
            // 找到commitOfCurrentPage中它的indirect parent后结束
            if (!visitedCommits.contains(parentCommit)) {
                // visitedCommits表明已经遍历过，不再重复遍历
                visitedCommits.add(parentCommit);
                if (commitOfCurrentPage.contains(parentCommit)) {
                    parents.add(parentCommit);
                } else if (commitMap.get(parentCommit) != null && (after(commitMap.get(parentCommit).getCommitTime(), minDate)
                        || MeasureCommitUtil.isCherryPick(commitMap.get(parentCommit), commitMap))) {
                    // 注意检查是否因为 cherry-pick 导致的时间错乱，
                    findParentCommits(commitMap.get(parentCommit).getCommitId(), parents, commitOfCurrentPage, commitMap, minDate, visitedCommits);
                }
            }
        }
    }

    /**
     * 获取追溯版本号
     *
     * @param rawIssues
     * @param commitId
     * @return
     */
    private int findVersion(List<RawIssue> rawIssues, String commitId) {
        for (RawIssue rawIssue : rawIssues) {
            if (commitId.equals(rawIssue.getCommitId()))
                return rawIssue.getVersion();
        }
        return -1;
    }

    /**
     * 获取 raw issue location 文件路径
     *
     * @param rawIssue
     * @return
     */
    private String findFilePath(RawIssue rawIssue) {
        if (rawIssue == null) return "";
        for (Location location : rawIssue.getLocations()) {
            if (!location.getFilePath().isEmpty()) {
                return location.getFilePath();
            }
        }
        return "";
    }

    /**
     * 获取类名
     *
     * @param filePath
     * @return
     */
    private String findClassName(String filePath) {
        if (filePath != null && filePath.endsWith(".java")) {
            String[] paths = filePath.split("/");
            String fileName = paths[paths.length - 1];
            return fileName.substring(0, fileName.indexOf(".java"));
        }
        return "";
    }

    private boolean after(String time, Date date) {
        return DateTimeUtil.stringToDate(time).compareTo(date) >= 0;
    }
}
