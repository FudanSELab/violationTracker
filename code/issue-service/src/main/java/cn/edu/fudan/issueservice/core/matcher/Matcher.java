package cn.edu.fudan.issueservice.core.matcher;

import cn.edu.fudan.issueservice.core.analyzer.BaseAnalyzer;
import cn.edu.fudan.issueservice.core.process.RawIssueMatcher;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.IssueType;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dto.MatcherResult;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * @author beethoven
 * @date 2021-09-22 14:18:44
 */
public interface Matcher {

    /**
     * Matches two raw issue lists
     *
     * @param preRawIssues preRawIssues
     * @param curRawIssues curRawIssues
     * @param analyzer     analyzer
     * @param repoPath     repoPath
     */
    default void mapRawIssues(List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, BaseAnalyzer analyzer,
                              String repoPath, Map<String, IssueType> issueTypeMap) {
        Map<String, List<RawIssue>> preRawIssueMap = preRawIssues.stream().collect(Collectors.groupingBy(RawIssue::getFileName));
        Map<String, List<RawIssue>> curRawIssueMap = curRawIssues.stream().collect(Collectors.groupingBy(RawIssue::getFileName));

        preRawIssueMap.entrySet().stream()
                .filter(e -> curRawIssueMap.containsKey(e.getKey()))
                .forEach(
                        pre -> {
                            Set<String> methodsAndFields = Collections.emptySet();
                            try {
                                methodsAndFields =
                                        analyzer.getMethodsAndFieldsInFile(repoPath + File.separator + pre.getKey());
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                            RawIssueMatcher.match(
                                    pre.getValue(), curRawIssueMap.get(pre.getKey()), methodsAndFields, issueTypeMap);
                        });
    }

    /**
     * Preprocessing for the renaming of matching files
     *
     * @param preRawIssues preRawIssues
     * @param map          map
     */
    default void renameHandle(List<RawIssue> preRawIssues, Map<String, String> map) {
        preRawIssues.stream()
                .filter(r -> map.containsKey(r.getFileName()))
                .forEach(rawIssue -> {
                    rawIssue.getLocations().forEach(location -> location.setFilePath(map.get(rawIssue.getFileName())));
                    rawIssue.setFileName(map.get(rawIssue.getFileName()));
                });
    }

    /**
     * Match current commit raw issues and parent commit raw issues
     *
     * @return matcher result
     */
    MatcherResult matchRawIssues();

    /**
     * Count matches data for raw issues
     *
     * @param parentCommit parentCommit
     * @param preRawIssues preRawIssues
     * @param curRawIssues curRawIssues
     * @param oldIssuesMap oldIssuesMap
     */
    void sumUpRawIssues(String parentCommit, List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, Map<String, Issue> oldIssuesMap);

    /**
     * Initialize the DAO
     *
     * @param logHome              logHome
     * @param issueDao             issueDao
     * @param issueTypeDao         issueTypeDao
     * @param rawIssueMatchInfoDao rawIssueMatchInfoDao
     * @Param rawIssueDao          rawIssueDao
     */
    void init(String logHome, IssueDao issueDao, IssueTypeDao issueTypeDao, RawIssueDao rawIssueDao, RawIssueMatchInfoDao rawIssueMatchInfoDao,
              Map<String, IssueType> issueTypeMap, IssueScanDao issueScanDao);
}