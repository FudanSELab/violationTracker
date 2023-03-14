package cn.edu.fudan.issueservice.core.matcher;

import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.issueservice.core.analyzer.BaseAnalyzer;
import cn.edu.fudan.issueservice.core.process.RawIssueMatcher;
import cn.edu.fudan.issueservice.dao.IssueDao;
import cn.edu.fudan.issueservice.dao.IssueTypeDao;
import cn.edu.fudan.issueservice.dao.RawIssueDao;
import cn.edu.fudan.issueservice.dao.RawIssueMatchInfoDao;
import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.IssueType;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dto.MatcherResult;
import cn.edu.fudan.issueservice.domain.enums.IssuePriorityEnums;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @author beethoven
 * @date 2021-09-22 17:16:26
 */
@Slf4j
public abstract class BaseMatcher implements Matcher {

    protected static final String SEPARATOR = System.getProperty("os.name").toLowerCase().contains("win") ? "\\" : "/";
    protected String logHome;
    protected String tool;
    protected String repoUuid;
    protected String currentCommit;
    protected BaseAnalyzer analyzer;
    protected JGitHelper jGitHelper;
    protected List<RawIssue> currentRawIssues;
    protected Map<String, List<String>> commitFileMap;
    protected Map<String, List<RawIssue>> parentRawIssuesMap;
    protected Map<String, Map<String, String>> preFile2CurFileMap;
    protected Map<String, Map<String, String>> curFile2PreFileMap;

    protected Map<String, IssueType> issueTypeMap;

    protected IssueDao issueDao;
    protected IssueTypeDao issueTypeDao;
    protected RawIssueDao rawIssueDao;
    protected RawIssueMatchInfoDao rawIssueMatchInfoDao;
    protected ApplicationContext applicationContext;
    protected MatcherResult matcherResult;

    @Override
    public void init(String logHome, IssueDao issueDao, IssueTypeDao issueTypeDao, RawIssueDao rawIssueDao, RawIssueMatchInfoDao rawIssueMatchInfoDao) {
        this.logHome = logHome;
        this.issueDao = issueDao;
        this.issueTypeDao = issueTypeDao;
        this.rawIssueDao = rawIssueDao;
        this.rawIssueMatchInfoDao = rawIssueMatchInfoDao;
        this.issueTypeMap = new HashMap<>(32);
        this.issueTypeDao.getIssueTypes(null).forEach(issueType -> issueTypeMap.putIfAbsent(issueType.getType(), issueType));
    }

    @Override
    public MatcherResult matchRawIssues() {
        if (parentRawIssuesMap.size() == 1) {
            log.info("commit {} start normal match, parent commit is {}", currentCommit, parentRawIssuesMap.keySet());
        } else {
            log.info("commit {} start merge match, parent commit is {}", currentCommit, parentRawIssuesMap.keySet());
        }

        boolean isFirst = true;
        for (Map.Entry<String, List<RawIssue>> entry : parentRawIssuesMap.entrySet()) {
            String parentCommit = entry.getKey();

            // Get the data we need for the matching process
            List<String> files = commitFileMap.get(parentCommit);
            Map<String, String> preFile2CurFile = preFile2CurFileMap.get(parentCommit);
            Map<String, String> curFile2PreFile = curFile2PreFileMap.get(parentCommit);

            // Get the raw issues that need to be matched and mark the other raw issues as not change
            List<RawIssue> curRawIssues = currentRawIssues.stream().filter(r -> files.contains(r.getFileName())).collect(Collectors.toList());

            // Match raw issues
            List<RawIssue> preRawIssues = parentRawIssuesMap.get(parentCommit).stream().
                    filter(rawIssue -> {
                        String issueId = rawIssue.getIssueId();
                        if (issueId == null) {
                            return false;
                        }
                        return issueDao.getIssuesByUuid(List.of(issueId)) != null;
                    }).collect(Collectors.toList());

            renameHandle(preRawIssues, preFile2CurFile);

            long startMatchTime = System.currentTimeMillis();
            mapRawIssues(preRawIssues, curRawIssues, analyzer, jGitHelper.getRepoPath(), issueTypeMap);
            long endMatchTime = System.currentTimeMillis();
            log.info("commit: {} and pre commit:{} cost {} ms", currentCommit, parentCommit, endMatchTime - startMatchTime);

            renameHandle(preRawIssues, curFile2PreFile);

            // Generate a raw issue match info for current raw issues, and the default status setting for raw issues is ADD
            curRawIssues.stream().filter(rawIssue -> !rawIssue.isMapped())
                    .forEach(curRawIssue -> curRawIssue.getMatchInfos().add(curRawIssue.generateRawIssueMatchInfo(parentCommit)));

            // Gets the issues associated with pre raw issues
            List<String> oldIssuesUuid = preRawIssues.stream().map(RawIssue::getIssueId).collect(Collectors.toList());
            Map<String, Issue> oldIssuesMap = oldIssuesUuid.isEmpty() ? new HashMap<>(16) :
                    issueDao.getIssuesByUuidAndRepoUuid(oldIssuesUuid, repoUuid).stream().collect(Collectors.toMap(Issue::getUuid, Function.identity(), (oldValue, newValue) -> newValue));

            // Aggregate the result set, update the end commit and status of the issues
            sumUpRawIssues(parentCommit, preRawIssues, curRawIssues, oldIssuesMap);

            // Clear the matching status of current raw issues for the merge case so that the next parent commit matches correctly
            cleanUpRawIssueMatchInfo(curRawIssues, preRawIssues, parentCommit, isFirst);
        }
        sumUpAll();

        return matcherResult;
    }

    protected void cleanUpRawIssueMatchInfo(List<RawIssue> curRawIssues, List<RawIssue> preRawIssues, String preCommit, boolean isFirst) {

    }

    protected void sumUpAll() {
        log.info("commit {} sum up finish", currentCommit);
    }

    protected Issue generateOneIssue(RawIssue rawIssue) {
        Issue issue = Issue.valueOf(rawIssue);
        IssueType issueType = issueTypeMap.get(rawIssue.getType());
        issue.setIssueCategory(issueType == null ? IssuePriorityEnums.getIssueCategory(rawIssue.getTool(), rawIssue.getPriority()) : issueType.getCategory());
        rawIssue.setIssueId(issue.getUuid());
        rawIssue.getMatchInfos().clear();
        rawIssue.getMatchInfos().add(rawIssue.generateRawIssueMatchInfo(null));
        return issue;
    }


    public List<RawIssue> matchNewIssuesWithParentIssues(List<RawIssue> curRawIssues, Map<String, String> curFile2PreFiles, List<String> parentCommits,
                                                         String repoUuid, BaseAnalyzer baseAnalyzer, String repoPath) {
        Map<String, List<RawIssue>> fileName2RawIssues = curRawIssues.stream().collect(Collectors.groupingBy(RawIssue::getFileName));
        List<RawIssue> preRawIssuesNeedToStore = new ArrayList<>();
        for (Map.Entry<String, List<RawIssue>> stringListEntry : fileName2RawIssues.entrySet()) {
            String fileName = stringListEntry.getKey();
            List<RawIssue> rawIssues = stringListEntry.getValue();
            Set<String> methodsAndFieldsInFile = Collections.emptySet();
            try {
                methodsAndFieldsInFile = baseAnalyzer.getMethodsAndFieldsInFile(repoPath + File.separator + fileName);
            } catch (IOException e) {
                log.error(e.getMessage());
            }

            List<String> issueTypes = rawIssues.stream().map(RawIssue::getType).distinct().collect(Collectors.toList());
            List<String> solvedIssues = issueDao.getSolvedIssuesByTypesAndFile(repoUuid, issueTypes, curFile2PreFiles.get(fileName));
            List<RawIssue> preRawIssues = rawIssueDao.getLastVersionRawIssuesWithLocation(parentCommits, solvedIssues);

            RawIssueMatcher.match(preRawIssues, rawIssues, methodsAndFieldsInFile, issueTypeMap);
            preRawIssuesNeedToStore.addAll(preRawIssues.stream().filter(RawIssue::isMapped).collect(Collectors.toList()));
        }
        return preRawIssuesNeedToStore;
    }


}
