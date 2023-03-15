package cn.edu.fudan.util;


import cn.edu.fudan.domain.dbo.Commit;

import java.util.*;

import static cn.edu.fudan.util.StringsUtil.parseParentCommits;


/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @date 2022-11-10 09:28
 */
public class MeasureCommitUtil {
    /**
     * @param fromCommitId    from
     * @param toCommitId      to
     * @param untilCommitTime untilCommitTime
     * @param commitMap       commits
     * @return
     */
    public static Integer shortestPathBetweenTwoCommits(String fromCommitId, String toCommitId, String untilCommitTime, Map<String, Commit> commitMap) {
        // Accessed node data starting from fromCommitId
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
     * Determine whether curCommit is a cherry-pick commit
     *
     * @param curCommit
     * @param commitMap
     * @return
     */
    public static boolean isCherryPick(Commit curCommit, Map<String, Commit> commitMap) {
        if (curCommit.getAuthorTime() == null) {
            Set<String> parentCommitIds = new HashSet<>(parseParentCommits(curCommit.getParentCommits()));
            // Linearly incremental
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
