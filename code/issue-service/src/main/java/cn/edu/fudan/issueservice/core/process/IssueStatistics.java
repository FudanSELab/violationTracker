package cn.edu.fudan.issueservice.core.process;

import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.issueservice.dao.RawIssueCacheDao;
import cn.edu.fudan.issueservice.dao.IssueDao;
import cn.edu.fudan.issueservice.dao.RawIssueDao;
import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dbo.ScanResult;
import cn.edu.fudan.issueservice.domain.enums.IgnoreTypeEnum;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Only counts the number of issues added, eliminated, and remaining after matching
 * <p>
 * Added: None of the matching pairs contained curRawIssue
 * Eliminated: None of the matching pairs contained preRawIssue(Quantities that have already been resolved need to be deducted)
 * Remaining: The number of rawIssues currently available through sonar
 * <p>
 * todo After summarization, it is counted again based on ignore and false positive information
 *
 * @author fancying
 */
@Slf4j
@Component
@Getter
@Setter
@NoArgsConstructor
@Scope("prototype")
public class IssueStatistics {

    private static IssueDao issueDao;
    private static RawIssueDao rawIssueDao;
    private static RawIssueCacheDao rawIssueCacheDao;

    private JGitHelper jGitHelper;
    private String commitId;
    private IssueMatcher issueMatcher;
    private List<ScanResult> scanResults;
    private Date currentCommitDate;
    private String developer;

    /**
     * None of the matching pairs contained curRawIssue
     */
    private int newIssueCount = 0;

    private List<Issue> newIssues;

    /**
     * None of the matching pairs contained preRawIssue(Quantities that have already been resolved need to be deducted)
     */
    private int eliminate = 0;

    /**
     * Number of reopen issues, which are a subset of mappedIssues
     */
    private int reopenIssuesCount = 0;

    private List<Issue> reopenIssues;

    private List<Issue> solvedIssues;

    /**
     * remain
     */
    private int remaining = 0;

    private List<Issue> mappedIssues;

    /**
     *  ignore and false positive information
     **/
    private int ignore = 0;

    private List<String> usedIgnoreRecordsUuid = new ArrayList<>();

    private List<String> ignoreFiles = new ArrayList<>();

    private List<String> parentCommits = new ArrayList<>();

    private Map<String, String> rawIssueUuid2DataBaseUuid = new HashMap<>();

    @Autowired
    public IssueStatistics(IssueDao issueDao, RawIssueCacheDao rawIssueCacheDao, RawIssueDao rawIssueDao) {
        IssueStatistics.issueDao = issueDao;
        IssueStatistics.rawIssueCacheDao = rawIssueCacheDao;
        IssueStatistics.rawIssueDao = rawIssueDao;
    }

    /**
     * Make statistics based on the information in issueMatch
     **/
    public boolean doingStatisticalAnalysis(IssueMatcher issueMatcher, String repoUuid, String tool) {
        log.info("start statistical analysis process");
        long startProcess = System.currentTimeMillis();
        try {
            log.info("analysis process[{}], step 1: count the number of issues", repoUuid);
            //0.get all data
            Map<String, Issue> newIssue = issueMatcher.getNewIssues();
            Map<String, Issue> solvedIssue = issueMatcher.getSolvedIssue();
            Map<String, Issue> mappedIssue = issueMatcher.getMappedIssues();
            Map<String, Issue> reopenIssue = issueMatcher.getReopenIssues();

            developer = jGitHelper.getAuthorName(commitId);

            //3.get new issues,solved issues and mapped issues
            newIssues = new ArrayList<>(newIssue.values());
            for (Issue issue : newIssues) {
                issue.setStartCommitDate(currentCommitDate);
                issue.setEndCommitDate(currentCommitDate);
                issue.setProducer(developer);
            }

            newIssueCount = (int) newIssues.stream()
                    .filter(issue -> !issue.getManualStatus().equals(IgnoreTypeEnum.IGNORE.getName()))
                    .count();

            solvedIssues = new ArrayList<>(solvedIssue.values());
            for (Issue issue : solvedIssues) {
                issue.setSolveCommit(commitId);
                issue.setSolveCommitDate(currentCommitDate);
                issue.setSolver(developer);
            }

            eliminate = (int) Stream.concat(solvedIssue.values().stream(),
                            mappedIssue.values().stream().filter(issue -> IgnoreTypeEnum.IGNORE.getName().equals(issue.getManualStatus())))
                    .count();

            mappedIssues = new ArrayList<>(mappedIssue.values());
            for (Issue issue : mappedIssues) {
                issue.setSolver(null);
                issue.setSolveCommit(null);
                issue.setSolveCommitDate(null);
                issue.setEndCommitDate(currentCommitDate);
            }

            reopenIssues = new ArrayList<>(reopenIssue.values());

            reopenIssuesCount = (int) reopenIssues.stream()
                    .filter(issue -> !IgnoreTypeEnum.IGNORE.getName().equals(issue.getManualStatus()))
                    .count();

            remaining = issueDao.getRemainingIssueCount(repoUuid) + newIssueCount - eliminate;

            parentCommits = issueMatcher.getPreScanSuccessfullyCommit(repoUuid, commitId, jGitHelper, tool);

            scanResults = new ArrayList<>();

            scanResults.add(new ScanResult(tool, repoUuid, new Date(), commitId, currentCommitDate, jGitHelper.getAuthorName(commitId), newIssueCount, eliminate, reopenIssuesCount, remaining, 0, "empty"));

            //5.set issue matcher for next step persist data
            this.issueMatcher = issueMatcher;
            log.info("analysis process[{}], step 2: mapping issue uuid, step 1 uses {} s", repoUuid, (System.currentTimeMillis() - startProcess) / 1000);
            startProcess = System.currentTimeMillis();
            // When scanning incrementally, the same file before and after commits is compared,
            // but the uuid of the preRawIssue generated at this time is not necessarily recorded in the database，
            // Therefore, queries and mappings are required to ensure that the UUID of preRawIssue is the UUID recorded in the database
            Map<String, List<RawIssue>> parentRawIssuesResult = issueMatcher.getParentRawIssuesResult();
            long matchProcess = System.currentTimeMillis();
            for (Map.Entry<String, List<RawIssue>> stringListEntry : parentRawIssuesResult.entrySet()) {
                String parentCommit = stringListEntry.getKey();
                List<RawIssue> preRawIssues = stringListEntry.getValue();
                log.info("statistics parentCommit:{}  jgitRepoPath:{}", parentCommit, jGitHelper.getRepoPath());
                log.info("analysis process[{}], step 2-1: get parent commits", repoUuid);
                List<String> allParentCommits = jGitHelper.getAllCommitParents(parentCommit);
                log.info("analysis process[{}], step 2-2: match rawIssue in database, step 2-1 uses {} s", repoUuid, (System.currentTimeMillis() - matchProcess) / 1000);
                matchProcess = System.currentTimeMillis();
                Map<String, String> uuid2Hash = preRawIssues.stream().collect(Collectors.toMap(RawIssue::getUuid, RawIssue::getRawIssueHash, (oldValue, newValue) -> newValue));
                Map<String, String> hash2RecordedUuid = new HashMap<>();
                List<String> hashes = new ArrayList<>(uuid2Hash.values());
                List<RawIssue> rawIssueList = rawIssueDao.getRawIssueUuidsByRawIssueHashAndParentCommits(repoUuid, hashes, allParentCommits);
                Map<String, List<RawIssue>> hash2RawIssues = rawIssueList.stream().collect(Collectors.groupingBy(RawIssue::getRawIssueHash));
                for (Map.Entry<String, List<RawIssue>> hash2RawIssue : hash2RawIssues.entrySet()) {
                    RawIssue rawIssue = hash2RawIssue.getValue().stream()
                            .sorted(Comparator.comparing(RawIssue::getId).reversed()).collect(Collectors.toList()).get(0);
                    hash2RecordedUuid.put(hash2RawIssue.getKey(), rawIssue.getUuid());
                }
                for (Map.Entry<String, String> temp : uuid2Hash.entrySet()) {
                    rawIssueUuid2DataBaseUuid.put(temp.getKey(), hash2RecordedUuid.get(temp.getValue()));
                }
                log.info("analysis process[{}], step 2-3: match success, step 2-2 uses {} s", repoUuid, (System.currentTimeMillis() - matchProcess) / 1000);
                matchProcess = System.currentTimeMillis();
            }
            log.info("analysis process[{}] success!, step 2 uses {} s", repoUuid, (System.currentTimeMillis() - startProcess) / 1000);

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }


    public void cleanRawIssueUuid2DataBaseUuid() {
        rawIssueUuid2DataBaseUuid.clear();
    }

}
