package cn.edu.fudan.service.impl;

import cn.edu.fudan.dao.IssueScanDao;
import cn.edu.fudan.dao.RawIssueDao;
import cn.edu.fudan.dao.RawIssueMatchInfoDao;
import cn.edu.fudan.domain.dbo.Commit;
import cn.edu.fudan.domain.dbo.RawIssue;
import cn.edu.fudan.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.domain.vo.IssueTrackerMapVO;
import cn.edu.fudan.service.RawIssueService;
import cn.edu.fudan.util.DateTimeUtil;
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
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;

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


    @Autowired
    public void setRawIssueDao(RawIssueDao rawIssueDao) {
        this.rawIssueDao = rawIssueDao;
    }

    @Autowired
    public void setRawIssueMatchInfoDao(RawIssueMatchInfoDao rawIssueMatchInfoDao) {
        this.rawIssueMatchInfoDao = rawIssueMatchInfoDao;
    }
    @Autowired
    public void setIssueScanDao(IssueScanDao issueScanDao) {
        this.issueScanDao = issueScanDao;
    }
}
