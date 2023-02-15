package cn.edu.fudan.issueservice.core.matcher;

import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.issueservice.domain.dto.MatcherData;
import cn.edu.fudan.issueservice.domain.dto.MatcherResult;
import cn.edu.fudan.issueservice.domain.enums.IssueStatusEnum;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @author beethoven
 * @date 2021-09-22 14:11:18
 */
@Slf4j
public class NormalMatcher extends BaseMatcher {

    public NormalMatcher(MatcherData data) {
        this.tool = data.getTool();
        this.repoUuid = data.getRepoUuid();
        this.currentCommit = data.getCurrentCommit();
        this.analyzer = data.getAnalyzer();
        this.jGitHelper = data.getJGitHelper();
        this.currentRawIssues = data.getCurrentRawIssues();
        this.commitFileMap = data.getCommitFileMap();
        this.parentRawIssuesMap = data.getParentRawIssuesMap();
        this.preFile2CurFileMap = data.getPreFile2CurFileMap();
        this.curFile2PreFileMap = data.getCurFile2PreFileMap();
        this.matcherResult = new MatcherResult(data.getCurrentCommit());
    }

    @Override
    public void sumUpRawIssues(String parentCommit, List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, Map<String, Issue> oldIssuesMap) {
        Map<String, Issue> newIssues = matcherResult.getNewIssues();
        Map<String, Issue> mappedIssues = matcherResult.getMappedIssues();
        Map<String, Issue> solvedIssue = matcherResult.getSolvedIssue();
        Map<String, Issue> reopenIssues = matcherResult.getReopenIssues();
        List<String> reopenCurIssues = new ArrayList<>();
        Date curCommitDate = DateTimeUtil.localToUtc(jGitHelper.getCommitTime(currentCommit));

        List<String> preCommitsForParent = jGitHelper.getAllCommitParents(parentCommit);
        preCommitsForParent.remove(parentCommit);
        List<RawIssue> newCurRawIssues = new ArrayList<>();

        //匹配上了是changed 没有匹配上是new 或者 reopen
        for (RawIssue curRawIssue : curRawIssues) {
            if(curRawIssue.isMapped()){
                curRawIssue.getMatchInfos().forEach(rawIssueMatchInfo -> rawIssueMatchInfo.setStatus(RawIssueStatus.CHANGED.getType()));
            }else{
                newCurRawIssues.add(curRawIssue);
            }
        }

        newCurRawIssues.forEach(rawIssue -> rawIssue.getMatchInfos().clear());
        List<RawIssue> preRawIssueList = matchNewIssuesWithParentIssues(newCurRawIssues, curFile2PreFileMap.get(parentCommit), preCommitsForParent, repoUuid, analyzer, jGitHelper.getRepoPath());
        preRawIssues.addAll(preRawIssueList);
        // 为 current raw issues 生成 raw issue match info,没有匹配上的默认状态设置为ADD
        curRawIssues.stream().filter(rawIssue -> !rawIssue.isMapped())
                .forEach(curRawIssue -> curRawIssue.getMatchInfos().add(curRawIssue.generateRawIssueMatchInfo(parentCommit)));

        for (RawIssue newCurRawIssue : newCurRawIssues) {
            if(!newCurRawIssue.isMapped()){
                Issue issue = generateOneIssue(newCurRawIssue);
                newIssues.put(issue.getUuid(), issue);
            } else {
                reopenCurIssues.add(newCurRawIssue.getMappedRawIssue().getIssueId());
                newCurRawIssue.getMatchInfos().forEach(matchInfo -> matchInfo.setStatus(RawIssueStatus.REOPEN.getType()));
            }
        }

        Map<String,Issue> reopenUuid2Issue = reopenCurIssues.isEmpty()?new HashMap<>(16):
                issueDao.getIssuesByUuid(reopenCurIssues).stream().collect(Collectors.toMap(Issue::getUuid, Function.identity(),(oldValue,newValue) -> newValue));

        reopenIssues.putAll(reopenUuid2Issue);
        oldIssuesMap.putAll(reopenUuid2Issue);

        // 更新 mapped issues 和 solved issues
        for (RawIssue preRawIssue : preRawIssues) {
            Issue issue = oldIssuesMap.get(preRawIssue.getIssueId());
            if (preRawIssue.isMapped()) {
                issue.setStatus(IssueStatusEnum.OPEN.getName());
                issue.setEndCommit(currentCommit);
                issue.setEndCommitDate(curCommitDate);
                mappedIssues.put(issue.getUuid(), issue);
                issue.setTargetFiles(preRawIssue.getMappedRawIssue().getFileName());
            } else {
                RawIssueMatchInfo rawIssueMatchInfo = RawIssueMatchInfo.builder()
                        .curRawIssueUuid(RawIssueMatchInfo.EMPTY)
                        .curCommitId(currentCommit)
                        .preRawIssueUuid(preRawIssue.getUuid())
                        .preCommitId(parentCommit)
                        .issueUuid(preRawIssue.getIssueId())
                        .status(RawIssueStatus.SOLVED.getType())
                        .repoUuid(repoUuid)
                        //.solveWay(solveWayEnum.toString().toLowerCase())
                        .build();
                preRawIssue.getMatchInfos().add(rawIssueMatchInfo);
                issue.setStatus(IssueStatusEnum.SOLVED.getName());
                solvedIssue.put(issue.getUuid(), issue);
            }
        }

        updateDefaultRawIssues(preRawIssues, curRawIssues);

        // 存入匹配后 parent rawIssues
        matcherResult.getParentRawIssuesResult().put(parentCommit, preRawIssues);
    }

    private void updateDefaultRawIssues(List<RawIssue> preRawIssues, List<RawIssue> curRawIssues) {
        Map<String, RawIssue> preRawIssueMap = new HashMap<>();
        for (RawIssue preRawIssue : preRawIssues) {
            preRawIssueMap.put(preRawIssue.getUuid(), preRawIssue);
        }
        for (RawIssue currentRawIssue : curRawIssues) {
            List<RawIssueMatchInfo> matchInfos = currentRawIssue.getMatchInfos();
            for (RawIssueMatchInfo matchInfo : matchInfos) {
                RawIssue preRawIssue = preRawIssueMap.get(matchInfo.getPreRawIssueUuid());
                if (preRawIssue != null && RawIssue.isSameLocation(currentRawIssue, preRawIssue)) {
                    matchInfo.setStatus(RawIssueStatus.DEFAULT.getType());
                }
            }
        }
    }

}
