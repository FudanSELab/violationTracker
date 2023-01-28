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
 * 单一职责  该类只计算匹配上后的新增 消除 剩余  ignore等其他操作放在其他类中
 * <p>
 * 计算原则  在任一 匹配对中的 currentRawIssue中 只要有任一个匹配上了就算匹配上了
 * 新增： currentRawIssue中 在所有匹配对中的没有任何一个匹配上就算没有匹配上
 * 消除： 原有的oldIssue 中没有匹配上的 （需要扣除已经解决了的数量）
 * 剩余： 当前rawIssue的总数 （从 sonar 中拿到的数量）
 * <p>
 * todo 归总后基于ignore和误报的信息再次统计
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
     * 当前 raw issues 中没匹配上的
     */
    private int newIssueCount = 0;

    private List<Issue> newIssues;

    /**
     * pre issues 中没匹配上的 目前被解决的数量
     */
    private int eliminate = 0;

    /**
     * issues 中reopen的数量 reopen属于mappedIssues
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
     * ignore 以及 misinformation 等需要忽略的信息
     **/
    private int ignore = 0;

    /**
     * 用于更新使用过的ignore Record
     */
    private List<String> usedIgnoreRecordsUuid = new ArrayList<>();

    private List<String> ignoreFiles = new ArrayList<>();

    private List<String> parentCommits = new ArrayList<>();

    private Map<String,String> rawIssueUuid2DataBaseUuid = new HashMap<>();

    @Autowired
    public IssueStatistics(IssueDao issueDao, RawIssueCacheDao rawIssueCacheDao, RawIssueDao rawIssueDao) {
        IssueStatistics.issueDao = issueDao;
        IssueStatistics.rawIssueCacheDao = rawIssueCacheDao;
        IssueStatistics.rawIssueDao =  rawIssueDao;
    }

    /**
     * 根据issueMatch中的信息做数据统计
     **/
    public boolean doingStatisticalAnalysis(IssueMatcher issueMatcher, String repoUuid, String tool) {

        try{
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

            Map<String, List<RawIssue>> parentRawIssuesResult = issueMatcher.getParentRawIssuesResult();
            for (Map.Entry<String, List<RawIssue>> stringListEntry : parentRawIssuesResult.entrySet()) {
                String parentCommit = stringListEntry.getKey();
                List<RawIssue> preRawIssues = stringListEntry.getValue();
                log.info("statistics parentCommit:{}  jgitRepoPath:{}",parentCommit,jGitHelper.getRepoPath());
                List<String> allParentCommits = jGitHelper.getAllCommitParents(parentCommit);
                Map<String, String> uuid2Hash = preRawIssues.stream().collect(Collectors.toMap(RawIssue::getUuid,RawIssue::getRawIssueHash,(oldValue,newValue) -> newValue));
                Map<String, String> hash2RecordedUuid = new HashMap<>();
                List<String> hashes = new ArrayList<>(uuid2Hash.values());
//                List<Map<String,Object>> rawIssueAndHash =  rawIssueDao.getRawIssueUuidsByRawIssueHashAndParentCommits(repoUuid,hashes,allParentCommits);
//                rawIssueAndHash.forEach(temp -> hash2RecordedUuid.put((String) temp.get("rawIssueHash"),(String) temp.get("uuid")));
                List<RawIssue> rawIssueList = rawIssueDao.getRawIssueUuidsByRawIssueHashAndParentCommits(repoUuid, hashes, allParentCommits);
                Map<String, List<RawIssue>> hash2RawIssues = rawIssueList.stream().collect(Collectors.groupingBy(RawIssue::getRawIssueHash));
                //todo 待验证
                for (Map.Entry<String, List<RawIssue>> hash2RawIssue : hash2RawIssues.entrySet()) {
                    RawIssue rawIssue = hash2RawIssue.getValue().stream()
                            .sorted(Comparator.comparing(RawIssue::getId).reversed()).collect(Collectors.toList()).get(0);
                    hash2RecordedUuid.put(hash2RawIssue.getKey(),rawIssue.getUuid());
                }
                for (Map.Entry<String, String> temp : uuid2Hash.entrySet()) {
                    rawIssueUuid2DataBaseUuid.put(temp.getKey(),hash2RecordedUuid.get(temp.getValue()));
                }
            }
        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
        return true;
    }


    public void cleanRawIssueUuid2DataBaseUuid(){
        rawIssueUuid2DataBaseUuid.clear();
    }

}
