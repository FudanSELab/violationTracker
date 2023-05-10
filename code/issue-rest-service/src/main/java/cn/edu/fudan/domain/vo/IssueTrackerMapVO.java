package cn.edu.fudan.domain.vo;

import cn.edu.fudan.domain.dbo.*;
import cn.edu.fudan.domain.enums.IssueTrackerStatus;
import cn.edu.fudan.domain.enums.RawIssueStatus;
import cn.edu.fudan.domain.enums.SolveWayEnum;
import cn.edu.fudan.util.DateTimeUtil;
import cn.edu.fudan.util.StringsUtil;
import com.alibaba.fastjson.JSON;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

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
        // Tracker number
        this.metaInfo.setTrackerNum(rawIssueMatchInfoList.size());
        log.debug("tracker num is {}", rawIssueMatchInfoList.size());
        if (rawIssueList == null || rawIssueList.isEmpty()) {
            log.debug("add or mapped raw-issue list is empty");
            return;
        }
        // key: commit id, value commit
        Map<String, Commit> commitMap = new HashMap<>(32);
        commitList.forEach(commit -> commitMap.put(commit.getCommitId(), commit));
        // set commit time
        updateRawIssueCommitInfo(rawIssueList, commitMap);

        rawIssueList.sort(Comparator.comparing(RawIssue::getCommitTime));
        this.metaInfo.setFileName(rawIssueList.get(0).getFileName());
        this.metaInfo.setClassName(findClassName(rawIssueList.get(0).getFileName()));

        log.debug("solved raw-issue list size is {}", solvedPreRawIssueList.size());
        log.debug("failed commit list size is {}", failedCommitList.size());

        // file deletion
        Set<String> fileDeleteSet = new HashSet<>(8);
        Map<String, String> solvedRawIssueUuidMap = new HashMap<>(8);
        // Categorically counts the status of issues under different commits.
        Map<String, Set<String>> trackerCommitMap = getTrackerCommitMap(rawIssueMatchInfoList, fileDeleteSet, solvedRawIssueUuidMap);

        // Initialize the tracker nodes
        List<IssueTrackerNode> nodes = getTrackerNodes(commitMap, rawIssueList, solvedPreRawIssueList, solvedRawIssueUuidMap, fileDeleteSet, trackerCommitMap);


        nodes.sort(Comparator.comparing(IssueTrackerNode::getCommitTime).reversed());
        if (page == 1) {
            //  Returned only in the first request
            this.setIssueLocations(rawIssueList);
        }

        if (Boolean.TRUE.equals(showAll)) {
            // All nodes
            PagedGridResult<IssueTrackerNode> nodePagedGridResult = PagedGridResult.restPage(nodes, page, ps);
            this.setNode(nodePagedGridResult);
            // set edges
            this.setEdge(handleIndirectEdges(page, ps, nodes, commitMap));
        } else {
            // filter nodes with issues changed
            log.debug("filter nodes with issues changed");
            List<IssueTrackerNode> filterNodes = new ArrayList<>();
            nodes.forEach(n -> {
                if (!IssueTrackerStatus.NOT_CHANGED.getType().equals(n.getIssueStatus())) {
                    filterNodes.add(n);
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
            log.debug("update the edges of the nodes");
            // the edges of the nodes
            this.setEdge(handleIndirectEdges(page, ps, filterNodes, commitMap));
        }
    }

    private void updateRawIssueCommitInfo(List<RawIssue> rawIssueList, Map<String, Commit> commitMap) {
        // set commit time, developer
        rawIssueList.forEach(rawIssue -> {
            if (commitMap.containsKey(rawIssue.getCommitId())) {
                rawIssue.setMessage(commitMap.get(rawIssue.getCommitId()).getMessage());
                rawIssue.setCommitTime(DateTimeUtil.stringToDate(commitMap.get(rawIssue.getCommitId()).getCommitTime()));
            } else {
                rawIssue.setMessage("");
                rawIssue.setCommitTime(new Date());
            }
        });
    }

    private Map<String, Set<String>> getTrackerCommitMap(List<RawIssueMatchInfo> rawIssueMatchInfoList, Set<String> fileDeleteSet, Map<String, String> solvedRawIssueUuidMap) {
        // key: status, value: list of commit ids
        Map<String, Set<String>> trackerCommitMap = new HashMap<>();
        //      a. changed commits（all）
        trackerCommitMap.put(IssueTrackerStatus.CHANGED.getType(), new HashSet<>());
        //      b. Issues were introduced in these commits
        trackerCommitMap.put(IssueTrackerStatus.BUG_ADD.getType(), new HashSet<>());
        //      c. Issues were changed in these commits
        trackerCommitMap.put(IssueTrackerStatus.BUG_CHANGED.getType(), new HashSet<>());
        //      d. Issues may be changed in these commits（default and failed）
        trackerCommitMap.put(IssueTrackerStatus.BUG_MAY_CHANGED.getType(), new HashSet<>());
        //      e. Issues were solved in these commits
        trackerCommitMap.put(IssueTrackerStatus.SOLVED.getType(), new HashSet<>());
        //      f. not changed commits
        trackerCommitMap.put(IssueTrackerStatus.NOT_CHANGED.getType(), new HashSet<>());

        for (RawIssueMatchInfo info : rawIssueMatchInfoList) {
            if (RawIssueStatus.DEFAULT.getType().equals(info.getStatus())) {
                trackerCommitMap.get(IssueTrackerStatus.NOT_CHANGED.getType()).add(info.getCurCommitId());
                continue;
            }
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
            } else if (RawIssueStatus.CHANGED.getType().equals(info.getStatus()) ||
                    RawIssueStatus.MERGE_CHANGED.getType().equals(info.getStatus())) {
                trackerCommitMap.get(IssueTrackerStatus.BUG_CHANGED.getType()).add(info.getCurCommitId());
            }
        }
        // scan failed
        // fixme 暂时不记录扫描失败的 commit，只记录 add~solved 之间的
//        trackerCommitMap.get(IssueTrackerStatus.BUG_MAY_CHANGED.getType()).addAll(failedCommitList);
        return trackerCommitMap;
    }

    /**
     * 初始化 tracker node
     *
     * @param commitMap commitId -> commit
     * @return tracker nodes
     */
    private List<IssueTrackerNode> getTrackerNodes(Map<String, Commit> commitMap, List<RawIssue> rawIssues, List<RawIssue> solvedPreRawIssues,
                                                   Map<String, String> solvedRawIssueUuidMap, Set<String> fileDeleteSet, Map<String, Set<String>> trackerCommitMap) {
        // commit -> rawIssue
        Map<String, RawIssue> rawIssueMap = new HashMap<>(16);
        rawIssues.forEach(rawIssue -> rawIssueMap.put(rawIssue.getCommitId(), rawIssue));
        // raw issue uuid -> rawIssue
        Map<String, RawIssue> preRawIssueMap = new HashMap<>(8);
        solvedPreRawIssues.forEach(rawIssue -> preRawIssueMap.put(rawIssue.getUuid(), rawIssue));

        // 不直接通过 repo uuid 查找 commit 表，存在一个 commit 属于多个 repo 的情况，获取的 commit 列表不全
        List<IssueTrackerNode> trackerNodes = new ArrayList<>();
        Set<String> distinctCommits = new HashSet<>();
        for (Map.Entry<String, Set<String>> commitEntry : trackerCommitMap.entrySet()) {
            commitEntry.getValue().forEach(c -> {
                if (!distinctCommits.contains(c)) {
                    IssueTrackerNode trackerNode = new IssueTrackerNode();
                    trackerNode.setCommitId(c);
                    updateTrackerNodeCommitInfo(trackerNode, commitMap.get(c));
                    String filePath;
                    if (fileDeleteSet.contains(trackerNode.getCommitId())) {
                        // 以 file delete 方式解决的 commit，文件路径应当为空
                        filePath = "";
                        trackerNode.setSolveWay(SolveWayEnum.FILE_DELETE.lowercase);
                    } else if (solvedRawIssueUuidMap.containsKey(c)) {
                        filePath = findFilePath(preRawIssueMap.get(solvedRawIssueUuidMap.get(c)));
                        trackerNode.setSolveWay("others");
                    } else {
                        filePath = findFilePath(rawIssueMap.get(c));
                    }
                    trackerNode.setFilePath(filePath);
                    // 更新状态
                    trackerNode.setIssueStatus("");
                    if (!commitEntry.getKey().equals(IssueTrackerStatus.CHANGED.getType())) {
                        trackerNode.setIssueStatus(commitEntry.getKey());
                    }
                    trackerNodes.add(trackerNode);
                    distinctCommits.add(trackerNode.getCommitId());
                }
            });
        }
        log.debug("all nodes size is {}", trackerNodes.size());
        for (Map.Entry<String, Set<String>> entry : trackerCommitMap.entrySet()) {
            log.debug("{} nodes size is {}", entry.getKey(), entry.getValue().size());
        }
        return trackerNodes;
    }


    private void updateTrackerNodeCommitInfo(IssueTrackerNode trackerNode, Commit commit) {
        if (commit != null) {
            List<String> parentCommit = StringsUtil.parseParentCommits(commit.getParentCommits());
            StringJoiner sj = new StringJoiner(",");
            parentCommit.forEach(sj::add);
            trackerNode.setParentCommit(sj.toString());
            trackerNode.setCommitter(commit.getDeveloper());
            trackerNode.setCommitTime(DateTimeUtil.stringToDate(commit.getCommitTime()));
            trackerNode.setAuthorTime(DateTimeUtil.stringToDate(commit.getAuthorTime()));
        } else {
            trackerNode.setCommitTime(new Date());
            trackerNode.setCommitter("");
        }
    }

    /**
     * Indirect edges
     *
     * @param page      page num
     * @param ps        page size
     * @param nodes     nodes
     * @param commitMap commit id -> commit
     * @return edges
     */
    private List<CommitEdge> handleIndirectEdges(Integer page, Integer ps, List<IssueTrackerNode> nodes,
                                                 Map<String, Commit> commitMap) {
        List<CommitEdge> edges = new ArrayList<>();
        // Current page
        List<IssueTrackerNode> curNodes = nodes.subList((page - 1) * ps, Math.min(page * ps, nodes.size()));
        // All nodes before the current page
        List<IssueTrackerNode> beforeNodes = nodes.subList(0, Math.min(page * ps, nodes.size()));
        if (curNodes.isEmpty()) return edges;
        Set<String> curCommitSet = curNodes.stream().map(IssueTrackerNode::getCommitId).collect(Collectors.toSet());
        for (IssueTrackerNode trackerNode : beforeNodes) {
            Set<String> directParents = commitMap.get(trackerNode.getCommitId()) == null ? new HashSet<>() :
                    new HashSet<>(StringsUtil.parseParentCommits(commitMap.get(trackerNode.getCommitId()).getParentCommits()));
            // Look for the parents of the current revision
            List<String> allParents = findParentCommits(trackerNode.getCommitId(), commitMap);
            findEdgeInCommitSet(trackerNode, directParents, allParents, curCommitSet, edges);
        }
        List<String> beforeCommitList = beforeNodes.stream().map(IssueTrackerNode::getCommitId).collect(Collectors.toList());
        edges.removeAll(filterRedundantEdge(edges, beforeCommitList));
        log.debug("indirect edges size: {}", edges.size());
        return edges;
    }

    private void findEdgeInCommitSet(IssueTrackerNode node, Set<String> directParents, List<String> allParents,
                                     Set<String> curCommitSet, List<CommitEdge> edges) {
        for (String parent : allParents) {
            if (curCommitSet.contains(parent) && !parent.equals(node.getCommitId())) {
                // Keep only the edges between commits on the current page.
                CommitEdge e = CommitEdge.builder()
                        .target(node.getCommitId())
                        .source(parent)
                        .changeRelation(IssueTrackerStatus.NOT_CHANGED.getType().equals(node.getIssueStatus()) ? "UNCHANGED" : "CHANGED")
                        .type(directParents.contains(parent) ? "direct" : "indirect")
                        .build();
                edges.add(e);
            }
        }
    }

    private List<CommitEdge> filterRedundantEdge(List<CommitEdge> edges, List<String> commits) {
        // Filter out redundant edges, and if there are a->c a->b b->c, then delete a->c.
        Map<String, List<CommitEdge>> commitEdgeMap = edges.stream().collect(Collectors.groupingBy(commitEdge -> commitEdge.getTarget() + "_" + commitEdge.getSource()));
        List<CommitEdge> removeEdgeList = new ArrayList<>();
        for (int i = 0; i < commits.size(); i++) {
            for (int j = i + 1; j < commits.size() - 1; j++) {
                if (commitEdgeMap.containsKey(commits.get(i) + "_" + commits.get(i + 1)) &&
                        commitEdgeMap.containsKey(commits.get(j) + "_" + commits.get(j + 1))) {
                    removeEdgeList.addAll(commitEdgeMap.getOrDefault(commits.get(i) + "_" + commits.get(j + 1), new ArrayList<>()));
                }
            }
        }
        return removeEdgeList;
    }

    /**
     * Look for the parents in the revision in commitOfCurrentPage and put the result in parents
     *
     * @param commitId  commit id
     * @param commitMap commit id -> commit
     */
    private List<String> findParentCommits(String commitId, Map<String, Commit> commitMap) {
        if (commitMap.get(commitId) == null) {
            return Collections.emptyList();
        }
        List<String> parentCommitList = new ArrayList<>();
        Queue<String> parentCommitQueue = new LinkedList<>();
        parentCommitQueue.offer(commitId);
        while (!parentCommitQueue.isEmpty()) {
            String indexCommit = parentCommitQueue.poll();
            parentCommitList.add(indexCommit);
            if (commitMap.containsKey(indexCommit)) {
                List<String> parents = StringsUtil.parseParentCommits(commitMap.get(indexCommit).getParentCommits());
                for (String parent : parents) {
                    if (!parentCommitList.contains(parent) && !parentCommitQueue.contains(parent)) {
                        parentCommitQueue.offer(parent);
                    }
                }
            }
        }
        return parentCommitList;
    }

    /**
     * Get the file path of raw issue
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
     * Get the class name
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

}
