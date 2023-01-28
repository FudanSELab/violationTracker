package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.issueservice.domain.dbo.Commit;

import java.util.*;

import static cn.edu.fudan.issueservice.util.StringsUtil.parseParentCommits;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc 统计 commit 的各种数据
 * @date 2022-11-10 09:28
 */
public class MeasureCommitUtil {
    /**
     * @param fromCommitId    起始子节点
     * @param toCommitId      目标父节点
     * @param untilCommitTime 最多查找至 untilCommitTime
     * @param commitMap       commit 节点数据
     * @return
     */
    public static Integer shortestPathBetweenTwoCommits(String fromCommitId, String toCommitId, String untilCommitTime, Map<String, Commit> commitMap) {
        // 从 from commit 开始已访问的节点数据
        Deque<Commit> children = new ArrayDeque<>();
        int minNum = Integer.MAX_VALUE;
        Commit childCommit = commitMap.get(fromCommitId);
        try {
            children.push(childCommit);
            while (true) {
                if (childCommit != null && childCommit.getCommitId().equals(toCommitId) && (children.size() - 1) < minNum) {
                    minNum = children.size() - 1;
                }
                if (childCommit == null || childCommit.getCommitId().equals(toCommitId) ||
                        (!isCherryPick(childCommit, commitMap) && childCommit.getCommitTime().compareTo(untilCommitTime) <= 0) ||
                        (children.size() - 1) >= minNum) {
                    Commit lastParent = children.pop();
                    List<String> ps = null;
                    while (lastParent == null || (!children.isEmpty() && ((ps = parseParentCommits(children.peek().getParentCommits())).size() < 2 ||
                            (ps.get(1) != null && (lastParent.getCommitId().equals(ps.get(1))))))) {
                        lastParent = children.pop();
                    }
                    if (children.isEmpty()) {
                        break;
                    }
                    childCommit = commitMap.get(ps.get(1));
                    children.push(childCommit);
                } else {
                    List<String> parents = parseParentCommits(childCommit.getParentCommits());
                    childCommit = parents.isEmpty() ? null : commitMap.get(parents.get(0));
                    children.push(childCommit);
                }
            }
        } catch (Exception e) {
            return Integer.MAX_VALUE;
        }
        return minNum;
    }


    /**
     * 旧版根据提交时间是否呈递减关系判断 curCommit 是否属于 cherry pick 数据
     * 新版数据库中已存入 author time 与 commit time，比较两个时间是否一致
     *
     * @param curCommit
     * @param commitMap
     * @return
     */
    public static boolean isCherryPick(Commit curCommit, Map<String, Commit> commitMap) {
        if (curCommit.getAuthorTime() == null) {
            Set<String> parentCommitIds = new HashSet<>(parseParentCommits(curCommit.getParentCommits()));
            // 分析至多三个相邻 commit 的时间是否呈线性
            for (String pId : parentCommitIds) {
                Commit pCommit = commitMap.get(pId);
                if (pCommit != null) {
                    Set<String> gpCommitIds = new HashSet<>(parseParentCommits(pCommit.getParentCommits()));
                    for (String gpId : gpCommitIds) {
                        Commit gpCommit = commitMap.get(gpId);
                        if ((gpCommit != null && !(gpCommit.getCommitTime().compareTo(pCommit.getCommitTime()) < 0 && pCommit.getCommitTime().compareTo(curCommit.getCommitTime()) < 0))
                                || pCommit.getCommitTime().compareTo(curCommit.getCommitTime()) >= 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        return !Objects.equals(curCommit.getAuthorTime(), curCommit.getCommitTime());
    }
}
