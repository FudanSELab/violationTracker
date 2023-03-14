package cn.edu.fudan.issueservice.core.process;


import cn.edu.fudan.issueservice.dao.RawIssueDao;
import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author Joshua
 * @description
 * @date 2022-02-22 19:12
 **/
@Slf4j
@Component
@Scope("prototype")
public class IssueMergeManager {

    private RawIssueDao rawIssueDao;

    @Transactional(rollbackFor = Exception.class)
    public boolean issueMerge(IssueStatistics issueStatistics, String repoUuid) {

        try {

            List<Issue> newIssues = issueStatistics.getNewIssues();
            IssueMatcher issueMatcher = issueStatistics.getIssueMatcher();
            List<RawIssue> curAllRawIssues = issueMatcher.getCurAllRawIssues();

            Map<String,String> issueUuid2DataBaseUuid = new HashMap<>();
            Map<String, String> hash2IssueUuid = curAllRawIssues.stream().collect(Collectors.toMap(RawIssue::getRawIssueHash, RawIssue::getIssueId, (oldValue,newValue) -> newValue));
            Map<String, String> hash2RecordedIssueUuid = new HashMap<>();
            List<String> hashes = new ArrayList<>(hash2IssueUuid.keySet());
            List<RawIssue> rawIssueList = rawIssueDao.getRawIssuesByRawIssueHashes(repoUuid, hashes);
            Map<String, List<RawIssue>> hash2RawIssues = rawIssueList.stream().collect(Collectors.groupingBy(RawIssue::getRawIssueHash));
            for (Map.Entry<String, List<RawIssue>> hash2RawIssue : hash2RawIssues.entrySet()) {
                // The same hash may correspond to multiple rawIssues
                RawIssue rawIssue = hash2RawIssue.getValue().stream()
                        .sorted(Comparator.comparing(RawIssue::getVersion).reversed()).collect(Collectors.toList()).get(0);
                hash2RecordedIssueUuid.put(hash2RawIssue.getKey(),rawIssue.getIssueId());
            }
            for (Map.Entry<String, String> temp : hash2RecordedIssueUuid.entrySet()) {
                issueUuid2DataBaseUuid.put(hash2IssueUuid.get(temp.getKey()), temp.getValue());
            }

            // New issues corresponding to the same hash in the database are no longer stored
            newIssues.forEach(issue -> {
                if(issueUuid2DataBaseUuid.containsKey(issue.getUuid())){
                    issue.setUuid(issueUuid2DataBaseUuid.get(issue.getUuid()));
                }
            });

            // Update the issue uuid of rawIssue and matchInfo to the issue uuid recorded in the database
            curAllRawIssues.forEach(rawIssue -> {
                if(issueUuid2DataBaseUuid.containsKey(rawIssue.getIssueId())){
                    String issueUuid = issueUuid2DataBaseUuid.get(rawIssue.getIssueId());
                    rawIssue.setIssueId(issueUuid);
                    rawIssue.getMatchInfos().forEach(rawIssueMatchInfo -> rawIssueMatchInfo.setIssueUuid(issueUuid));
                }
            });

        }catch (Exception e){
            log.error(e.getMessage());
            return false;
        }
        return true;

    }

    @Autowired
    public void setRawIssueDao(RawIssueDao rawIssueDao) {
        this.rawIssueDao = rawIssueDao;
    }

}
