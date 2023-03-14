package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.issueservice.domain.dto.AnalysisIssue;
import cn.edu.fudan.issueservice.domain.enums.SolveWayEnum;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static cn.edu.fudan.issueservice.domain.enums.RawIssueStatus.*;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @date 2022-11-10 09:45
 */
public class MeasureIssueUtil {

    /**
     * Count the number of additions/reopen in the issue history
     *
     * @param beforeAddReopenIssueMap
     * @return
     */
    public static int measureAddNumber(Map<String, List<AnalysisIssue>> beforeAddReopenIssueMap) {
        AtomicInteger addNum = new AtomicInteger(0);
        beforeAddReopenIssueMap.forEach((s, issueList) -> issueList.forEach(issue -> {
            if (issue.getStatus().equals(ADD.getType())) {
                addNum.getAndIncrement();
            }
        }));
        return addNum.get();
    }

    /**
     * Calculate the solved day of the solved issues
     *
     * @param beforeAddReopenIssueMap
     * @param solvedIssues
     * @param solvedDays
     * @param solvedOthers
     * @param developer
     */
    public static void measureSolvedDays(Map<String, List<AnalysisIssue>> beforeAddReopenIssueMap, List<AnalysisIssue> solvedIssues,
                                         List<Integer> solvedDays, Set<String> solvedOthers, String developer) {
        Set<String> solvedIssueSet = new HashSet<>();
        solvedIssues.forEach(issue -> {
            if (!solvedIssueSet.contains(issue.getIssueUuid())) {
                solvedIssueSet.add(issue.getIssueUuid());
                int days = -1;
                AnalysisIssue lastAddOrReopenIssue = lastAddOrReopenIssue(issue, beforeAddReopenIssueMap.get(issue.getIssueUuid()));
                if (lastAddOrReopenIssue == null || developer != null) {
                    AnalysisIssue firstAddIssue = firstAddIssue(issue, beforeAddReopenIssueMap.get(issue.getIssueUuid()));
                    if (firstAddIssue == null || !firstAddIssue.getDeveloper().equals(developer)) {
                        solvedOthers.add(issue.getIssueUuid());
                    } else {
                        days = DateTimeUtil.dateDiff(lastAddOrReopenIssue == null ?
                                firstAddIssue.getCommitTime() : lastAddOrReopenIssue.getCommitTime(), issue.getCommitTime());
                    }
                } else {
                    days = DateTimeUtil.dateDiff(lastAddOrReopenIssue.getCommitTime(), issue.getCommitTime());
                }
                // cherry-pick
                if (days >= 0) {
                    solvedDays.add(days);
                }
            }
        });
    }

    /**
     * Calculate the live day of the live issues
     *
     * @param beforeAddReopenIssueMap
     * @param solvedIssues
     * @param solvedDays
     * @param liveTime
     */
    public static void measureLiveDays(Map<String, List<AnalysisIssue>> beforeAddReopenIssueMap, List<AnalysisIssue> solvedIssues,
                                       List<Integer> solvedDays, String liveTime) {
        Set<String> liveIssueSet = new HashSet<>();
        solvedIssues.forEach(issue -> {
            if (!liveIssueSet.contains(issue.getIssueUuid())) {
                liveIssueSet.add(issue.getIssueUuid());
                AnalysisIssue lastAddOrReopenIssue = lastAddOrReopenIssue(issue, beforeAddReopenIssueMap.get(issue.getIssueUuid()));
                if (lastAddOrReopenIssue != null) {
                    int days = DateTimeUtil.dateDiff(lastAddOrReopenIssue.getCommitTime(), liveTime);
                    // 排除异常值，例如cherry-pick导致的当前 commit 时间早于引入时间
                    if (days >= 0) {
                        solvedDays.add(days);
                    }
                }
            }
        });
    }

    /**
     * @param days
     * @return
     */
    public static double[] measureStatisticsDay(List<Integer> days) {
        if (days.isEmpty()) return new double[]{0, 0, 0, 0, 0, 0};
        double[] daysArr = new double[days.size()];
        for (int i = 0; i < days.size(); i++) {
            daysArr[i] = days.get(i);
        }
        Map<String, BigDecimal> fourDivisions = FourDivisionUtil.fourDivision(daysArr);
        DoubleSummaryStatistics statistics = days.stream().mapToDouble(Number::doubleValue).summaryStatistics();
        List<Integer> sortedDays = days.stream().sorted().collect(Collectors.toList());
        int mid = sortedDays.get(sortedDays.size() / 2);
        if (fourDivisions != null) {
            return new double[]{statistics.getMin(), fourDivisions.get("q1").doubleValue(), mid, fourDivisions.get("q3").doubleValue(), statistics.getMax(), statistics.getAverage()};
        } else {
            return new double[]{statistics.getMin(), -1, mid, -1, statistics.getMax(), statistics.getAverage()};
        }
    }

    /**
     * contain the issue
     *
     * @param issueList
     * @param issueUuid
     * @return
     */
    public static boolean existIssue(List<AnalysisIssue> issueList, String issueUuid) {
        return issueList.stream().anyMatch(issue -> issue.getIssueUuid().equals(issueUuid));
    }

    /**
     * The file has been modified, but the location related to the issue has not changed
     *
     * @param issue
     * @return
     */
    public static boolean isDefault(AnalysisIssue issue) {
        return issue.getStatus().equals(DEFAULT.getType());
    }

    /**
     * Issue still exists
     *
     * @param issue
     * @return
     */
    public static boolean isLive(AnalysisIssue issue) {
        return !issue.getStatus().contains("solve");
    }

    /**
     * Issue reopens
     *
     * @param issue
     * @return
     */
    public static boolean isNew(AnalysisIssue issue) {
        return issue.getStatus().contains(REOPEN.getType()) ||
                issue.getStatus().equals(ADD.getType()) ||
                issue.getStatus().contains("new");
    }

    /**
     *
     * @param issue
     * @param issueList
     * @return
     */
    public static AnalysisIssue lastAddOrReopenIssue(AnalysisIssue issue, List<AnalysisIssue> issueList) {
        if (issueList == null || issueList.isEmpty()) return null;
        AnalysisIssue lastIssue = null;
        for (AnalysisIssue analysisIssue : issueList) {
            if (isNew(analysisIssue) && analysisIssue.getCommitTime().compareTo(issue.getCommitTime()) < 0 &&
                    (lastIssue == null || analysisIssue.getCommitTime().compareTo(lastIssue.getCommitTime()) >= 0)) {
                lastIssue = analysisIssue;
            }
        }
        if (lastIssue == null) {
            return issueList.get(0);
        }
        return lastIssue;
    }

    /**
     *
     * @param issue
     * @param issueList
     * @return
     */
    public static AnalysisIssue firstAddIssue(AnalysisIssue issue, List<AnalysisIssue> issueList) {
        if (issueList == null || issueList.isEmpty()) return null;
        AnalysisIssue firstIssue = null;
        for (AnalysisIssue analysisIssue : issueList) {
            if (isNew(analysisIssue) && analysisIssue.getCommitTime().compareTo(issue.getCommitTime()) < 0 &&
                    (firstIssue == null || analysisIssue.getCommitTime().compareTo(firstIssue.getCommitTime()) <= 0)) {
                firstIssue = analysisIssue;
            }
        }
        if (firstIssue == null) {
            return issueList.get(0);
        }
        return firstIssue;
    }


    /**
     * normal solved
     *
     * @param solveWay
     * @return
     */
    public static boolean isNormalSolved(String solveWay) {
        return !org.springframework.util.StringUtils.isEmpty(solveWay) && (solveWay.equals(SolveWayEnum.CODE_CHANGE.lowercase) ||
                solveWay.equals(SolveWayEnum.CODE_RELATED_CHANGE.lowercase) ||
                solveWay.equals(SolveWayEnum.CODE_UNRELATED_CHANGE.lowercase));
    }

    /**
     * code deletion
     *
     * @param solveWay
     * @return
     */
    public static boolean isCodeDeleteSolved(String solveWay) {
        return !org.springframework.util.StringUtils.isEmpty(solveWay) && solveWay.equals(SolveWayEnum.CODE_DELETE.lowercase);
    }

    /**
     * delete
     *
     * @param solveWay
     * @return
     */
    public static boolean isDeleteSolved(String solveWay) {
        return !org.springframework.util.StringUtils.isEmpty(solveWay) && (solveWay.equals(SolveWayEnum.FILE_DELETE.lowercase) ||
                solveWay.equals(SolveWayEnum.ANCHOR_DELETE.lowercase));
    }
}
