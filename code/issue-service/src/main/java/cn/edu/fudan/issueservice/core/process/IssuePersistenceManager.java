package cn.edu.fudan.issueservice.core.process;

import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * <p>
 * Persist data
 *
 * @author fancying
 */
@Slf4j
@Component
@Scope("prototype")
public class IssuePersistenceManager {

    private RawIssueDao rawIssueDao;
    private LocationDao locationDao;
    private IssueDao issueDao;
    private ScanResultDao scanResultDao;
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;

    @Transactional(rollbackFor = Exception.class)
    public void persistScanData(IssueStatistics issueStatistics, String repoUuid) throws Exception {

        //0.get the issues infos
        IssueMatcher issueMatcher = issueStatistics.getIssueMatcher();
        List<Issue> newIssues = issueStatistics.getNewIssues();
        List<Issue> mappedIssues = issueStatistics.getMappedIssues();
        List<Issue> solvedIssues = issueStatistics.getSolvedIssues();
        Map<String,String> rawIssueUuid2DataBaseUuid = issueStatistics.getRawIssueUuid2DataBaseUuid();

        //1.handle issues and persist
        log.info("1. insert into issues: {}", repoUuid);
        solvedIssues.forEach(issue -> issue.setResolution(String.valueOf(Integer.parseInt(issue.getResolution()) + 1)));
        issueDao.batchUpdateIssue(Stream.concat(solvedIssues.stream(), mappedIssues.stream().filter(issue -> !issue.getStatus().equals("Merged"))).collect(Collectors.toList()));
//        issueDao.insertIssueList(newIssues.stream().filter(issue -> !issue.getStatus().equals("Merged")).collect(Collectors.toList()));
        issueDao.insertIssueList(newIssues);

        //2.rawIssue persist
        log.info("2. insert into raw_issues: {}", repoUuid);
        List<RawIssue> curAllRawIssues = issueMatcher.getCurAllRawIssues();
        //2.1 get the new rawIssues' stream list for step2 and step3
        List<RawIssue> newRawIssuesStreamList = curAllRawIssues.stream()
                .filter(rawIssue -> newIssues.stream()
                        .map(Issue::getUuid)
                        .collect(Collectors.toList())
                        .contains(rawIssue.getIssueId()))
                .collect(Collectors.toList());
        //2.2 get the mapped rawIssues' stream list for step2 and step3
        List<RawIssue> mappedRawIssuesStreamList = curAllRawIssues.stream()
                .filter(rawIssue -> mappedIssues.stream()
                        .map(Issue::getUuid)
                        .collect(Collectors.toList())
                        .contains(rawIssue.getIssueId()))
                .collect(Collectors.toList());
        //2.3 concat two streams
        List<RawIssue> insertRawIssueList = Stream.concat(newRawIssuesStreamList.stream(),mappedRawIssuesStreamList.stream()).collect(Collectors.toList());
        insertRawIssueList.forEach(r -> r.setRepoUuid(repoUuid));
        rawIssueDao.insertRawIssueList(insertRawIssueList);

//        String str = null;
//        if(str == null) {
//            throw new ParseFileException("insert exception");
//        }

        //3.rawIssueMatchInfo persist
        log.info("3. insert into raw_issue_match_infos: {}", repoUuid);
        List<RawIssueMatchInfo> rawIssueMatchInfos = new ArrayList<>();
        //3.1 get new issues' rawIssueMatchInfo
        newRawIssuesStreamList.forEach(rawIssue -> rawIssueMatchInfos.addAll(rawIssue.getMatchInfos()));
        //3.2 get mappedIssues' rawIssueMatchInfo
        mappedRawIssuesStreamList.forEach(rawIssue -> rawIssueMatchInfos.addAll(rawIssue.getMatchInfos()));
        //3.3 get reopenIssues' rawIssueMatchInfo
//        reopenRawIssuesStreamList.forEach(rawIssue -> rawIssueMatchInfos.addAll(rawIssue.getMatchInfos()));
        //3.4 new solvedIssues' rawIssueMatchInfo
        Map<String, List<RawIssue>> parentRawIssuesResult = issueMatcher.getParentRawIssuesResult();
        for (List<RawIssue> rawIssues : parentRawIssuesResult.values()) {
            List<RawIssue> rawIssueList = rawIssues.stream().filter(rawIssue -> !rawIssue.isMapped()).collect(Collectors.toList());
            rawIssueList.forEach(rawIssue -> rawIssueMatchInfos.addAll(rawIssue.getMatchInfos()));
        }
        rawIssueMatchInfos.forEach(rawIssueMatchInfo -> {
            String preRawIssueUuid = rawIssueMatchInfo.getPreRawIssueUuid();
            if(preRawIssueUuid != null && !preRawIssueUuid.equals("empty")){
                String preRawIssueUuidRecorded = rawIssueUuid2DataBaseUuid.get(preRawIssueUuid);
                if(preRawIssueUuidRecorded != null){
                    rawIssueMatchInfo.setPreRawIssueUuid(preRawIssueUuidRecorded);
                }
            }
        });
        rawIssueMatchInfoDao.insertRawIssueMatchInfoList(rawIssueMatchInfos);

        //4.update issue ignore records
        log.info("4. update issue ignore records: {}", repoUuid);
//        issueIgnoreDao.updateIssueIgnoreRecords(issueStatistics.getUsedIgnoreRecordsUuid());
//        List<String> paths = issueIgnoreDao.getIgnorePathsByRepoId(repoUuid);
//        paths.forEach(path -> issueIgnoreDao.setIgnorePath(path, repoUuid));

        //5.location persist
        log.info("5. insert into locations: {}", repoUuid);
        List<Location> locations = new ArrayList<>();
//        insertRawIssueList.forEach(rawIssue -> locations.addAll(rawIssue.getLocations()));
        curAllRawIssues.forEach(rawIssue -> locations.addAll(rawIssue.getLocations()));
        locations.forEach(l -> l.setRepoUuid(repoUuid));
        locationDao.insertLocationList(locations);

        //6.handle eslint ignore file
        issueDao.updateIssuesForIgnore(issueStatistics.getIgnoreFiles(), repoUuid);

        //7.scanResult persist
        log.info("6. insert into scan_result: {}", repoUuid);
        List<ScanResult> scanResult = issueStatistics.getScanResults();
        scanResultDao.addScanResults(scanResult);

    }

    @Autowired
    public void setRawIssueDao(RawIssueDao rawIssueDao) {
        this.rawIssueDao = rawIssueDao;
    }

    @Autowired
    public void setLocationDao(LocationDao locationDao) {
        this.locationDao = locationDao;
    }

    @Autowired
    public void setScanResultDao(ScanResultDao scanResultDao) {
        this.scanResultDao = scanResultDao;
    }

    @Autowired
    public void setIssueDao(IssueDao issueDao) {
        this.issueDao = issueDao;
    }

    @Autowired
    public void setRawIssueMatchInfoDao(RawIssueMatchInfoDao rawIssueMatchInfoDao) {
        this.rawIssueMatchInfoDao = rawIssueMatchInfoDao;
    }

}
