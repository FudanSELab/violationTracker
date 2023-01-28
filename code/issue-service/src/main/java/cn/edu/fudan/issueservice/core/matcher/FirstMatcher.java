package cn.edu.fudan.issueservice.core.matcher;

import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dto.MatcherData;
import cn.edu.fudan.issueservice.domain.dto.MatcherResult;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @author beethoven
 * @date 2021-09-23 09:39:23
 */
@Slf4j
public class FirstMatcher extends BaseMatcher{

    public FirstMatcher(MatcherData data) {
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
    public MatcherResult matchRawIssues() {
        log.info("commit {} start first matching", currentCommit);
        sumUpRawIssues(null, null, currentRawIssues, null);
        return matcherResult;
    }

    @Override
    public void sumUpRawIssues(String parentCommit, List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, Map<String, Issue> oldIssuesMap) {
        curRawIssues.forEach(currentAllRawIssue -> currentAllRawIssue.setStatus(RawIssueStatus.ADD.getType()));
        matcherResult.setNewIssues(curRawIssues.stream().map(this::generateOneIssue).collect(Collectors.toMap(Issue::getUuid, Function.identity(), (oldValue,newValue) -> newValue)));
        matcherResult.setCurAllRawIssues(curRawIssues);
        matcherResult.setParentRawIssuesResult(new HashMap<>(2));
    }
}
