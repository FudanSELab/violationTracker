package cn.edu.fudan.issueservice.service.impl;

import cn.edu.fudan.issueservice.component.SonarRest;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.*;
import cn.edu.fudan.issueservice.domain.vo.IssueTrackerMapVO;
import cn.edu.fudan.issueservice.service.RawIssueService;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author WZY
 * @version 1.0
 **/
@Slf4j
@Service
public class RawIssueServiceImpl implements RawIssueService {

    private static final String CUR_RAW_ISSUE_UUID = "curRawIssueUuid";
    private static final String STATUS = "status";
    private static final String RESULT = "result";

    private static final String CUR_COMMIT = "curCommitId";
    private RawIssueDao rawIssueDao;
    private IssueScanDao issueScanDao;
    private RawIssueCacheDao rawIssueCacheDao;
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;
    private SonarRest sonarRest;


    @Override
    public List<RawIssue> getRawIssueByIssueUuid(String issueUuid) {
        return getRawIssueByIssueUuids(List.of(issueUuid));
    }

    @Override
    public List<RawIssue> getRawIssueByIssueUuids(List<String> issueUuids) {

        try {
            List<Map<String, String>> rawIssueMatchInfos = rawIssueMatchInfoDao.listMatchInfoByIssueUuids(issueUuids);

            log.debug("rawIssueMatchInfos size: {}", rawIssueMatchInfos.size());

            Map<String, String> rawIssueStatus = new HashMap<>(32);
            List<String> rawIssuesUuid = new ArrayList<>();

            // change or add
            rawIssueMatchInfos.stream()
                    .filter(rawIssueMatchInfo -> !RawIssueMatchInfo.EMPTY.equals(rawIssueMatchInfo.get(CUR_RAW_ISSUE_UUID)))
                    .forEach(rawIssueMatchInfo -> {
                        rawIssuesUuid.add(rawIssueMatchInfo.get(CUR_RAW_ISSUE_UUID));
                        rawIssueStatus.put(rawIssueMatchInfo.get(CUR_RAW_ISSUE_UUID), rawIssueMatchInfo.get(STATUS));
                    });

            log.debug("rawIssuesUuid size: {}", rawIssuesUuid.size());
            for (String s : rawIssuesUuid) {
                log.debug("rawIssuesUuid : {}", s);
            }
            //get change or add rawIssues' detail
            List<RawIssue> rawIssueList = rawIssueDao.getRawIssueWithLocationByUuids(rawIssuesUuid);

            log.debug("rawIssueList size: {}", rawIssueList.size());

            //get repo uuid
            String repoUuid = rawIssueList.isEmpty() ? null : rawIssueList.get(0).getRepoUuid();
            //get locations
            Map<String, Commit> commitMap = new HashMap<>(32);
            issueScanDao.getAllCommitsBetween(repoUuid, null, null).forEach(commit -> commitMap.put(commit.getCommitId(), commit));
            //add status
            rawIssueList.forEach(rawIssue -> {
                rawIssue.setMessage(commitMap.get(rawIssue.getCommitId()).getMessage());
                rawIssue.setCommitTime(DateTimeUtil.stringToDate(commitMap.get(rawIssue.getCommitId()).getCommitTime()));
                rawIssue.setStatus(rawIssueStatus.get(rawIssue.getUuid()));
            });
            //add rawIssues to result
            List<RawIssue> result = new ArrayList<>(rawIssueList);

            log.debug("result size: {}", result.size());


            log.debug("result add status size: {}", result.size());

            result.sort(Comparator.comparingInt(RawIssue::getVersion));
            //solved or merge solved
            for (Map<String, String> rawIssueMatchInfo : rawIssueMatchInfos) {
                if (RawIssueMatchInfo.EMPTY.equals(rawIssueMatchInfo.get(CUR_RAW_ISSUE_UUID))) {
                    RawIssue info = new RawIssue();
                    info.setRepoUuid(repoUuid);
                    info.setCommitId(rawIssueMatchInfo.get(CUR_COMMIT));
                    info.setStatus(rawIssueMatchInfo.get(STATUS));
                    info.setLocations(new ArrayList<>());
                    if (commitMap.containsKey(rawIssueMatchInfo.get(CUR_COMMIT))) {
                        info.setCommitTime(DateTimeUtil.stringToDate(commitMap.get(rawIssueMatchInfo.get(CUR_COMMIT)).getCommitTime()));
                        info.setMessage(commitMap.get(rawIssueMatchInfo.get(CUR_COMMIT)).getMessage());
                    } else {
                        info.setCommitTime(null);
                        log.info("commit {} missed", rawIssueMatchInfo.get(CUR_COMMIT));
                    }
                    result.add(info);
                }
            }
            log.debug("result size solved or merge solved: {}", result.size());
            result.sort(Comparator.comparing(RawIssue::getCommitTime));
            log.debug("result size sorted: {}", result.size());
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @Override
    public String getRawIssueDetailByIssueUuid(String issueUuid) {
        return rawIssueDao.getRawIssueDetailByIssueUuid(issueUuid);
    }


    @Override
    public List<RawIssue> getRawIssuesInCommit(String repoUuid, String commit, String tool) {
        JSONObject curResult = rawIssueCacheDao.getAnalyzeResultByRepoUuidCommitIdTool(repoUuid, commit, tool);
        List<RawIssue> rawIssues = JSONArray.parseArray(curResult.getJSONArray(RESULT).toJSONString(), RawIssue.class);
        for (RawIssue rawIssue : rawIssues) {
            String rawIssueHash = RawIssue.generateRawIssueHash(rawIssue);
            String issueUuid = rawIssueDao.getIssueUuidsByRawIssueHash(rawIssueHash, repoUuid);
            rawIssue.setIssueId(issueUuid);
        }
        return rawIssues;
    }

    @Override
    public IssueTrackerMapVO getTrackerMap(String repoUuid, String issueUuid, Integer page, Integer ps, Boolean showAll) {
        IssueTrackerMapVO result = new IssueTrackerMapVO();
        // 1. All traceability data is obtained according to the raw_issue_match_info table
        List<RawIssueMatchInfo> rawIssueMatchInfoList = rawIssueMatchInfoDao
                .listRawIssueMatchInfoByRepoAndTime(repoUuid, null, issueUuid);
        // 2. Get raw issue data for add and mapped (changed, default, etc.) status
        List<String> rawIssuesUuids = rawIssueMatchInfoList.stream().map(RawIssueMatchInfo::getCurRawIssueUuid).collect(Collectors.toList());
        List<RawIssue> rawIssueList = rawIssueDao.getRawIssueWithLocationByUuids(rawIssuesUuids);
        // 3. Get raw issue data before solved
        List<String> preIssuesUuids = rawIssueMatchInfoList.stream().filter(rawIssueMatchInfo -> rawIssueMatchInfo.getStatus().contains("solve"))
                .map(RawIssueMatchInfo::getPreRawIssueUuid).collect(Collectors.toList());
        List<RawIssue> solvedPreRawIssueList = rawIssueDao.getRawIssueWithLocationByUuids(preIssuesUuids);
        // 4. All commits
        List<Commit> commitList = issueScanDao.getAllCommitsBetween(repoUuid, null, null);
        // 5. The commits that have scanned failed
        Set<String> failedCommitList = getFailedCommit(repoUuid);
        result.initTrackerMap(commitList, rawIssueMatchInfoList, rawIssueList, solvedPreRawIssueList, failedCommitList, showAll, page, ps);
        return result;
    }


    private Set<String> getFailedCommit(String repoUuid) {
        Set<String> result = new HashSet<>();
        Map<String, String> failedMap = issueScanDao.getScanFailedCommitList(repoUuid);
        if (failedMap == null || failedMap.isEmpty()) return result;
        failedMap.forEach((key, value) -> result.add(key));
        return result;
    }


    @Autowired
    public void setRawIssueDao(RawIssueDao rawIssueDao) {
        this.rawIssueDao = rawIssueDao;
    }

    @Autowired
    public void setRawIssueMatchInfoDao(RawIssueMatchInfoDao rawIssueMatchInfoDao) {
        this.rawIssueMatchInfoDao = rawIssueMatchInfoDao;
    }


    @Autowired
    public void setIssueAnalyzerDao(RawIssueCacheDao rawIssueCacheDao) {
        this.rawIssueCacheDao = rawIssueCacheDao;
    }

    @Autowired
    public void setIssueScanDao(IssueScanDao issueScanDao) {
        this.issueScanDao = issueScanDao;
    }

    @Autowired
    public void setRestInterfaceManager(SonarRest sonarRest) {
        this.sonarRest = sonarRest;
    }
}
