package cn.edu.fudan.service.impl;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.dao.*;
import cn.edu.fudan.domain.dbo.Commit;
import cn.edu.fudan.domain.dbo.RawIssue;
import cn.edu.fudan.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.domain.vo.IssueTrackerMapVO;
import cn.edu.fudan.service.IssueMeasureInfoService;
import cn.edu.fudan.util.DateTimeUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;


/**
 * description:
 *
 * @author fancying
 * create: 2019-04-02 15:27
 **/
@Slf4j
@Service
@SuppressWarnings("unchecked")
public class IssueMeasureInfoServiceImpl implements IssueMeasureInfoService {
    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private IssueDao issueDao;
    private IssueRepoDao issueRepoDao;

    private RawIssueDao rawIssueDao;
    private IssueScanDao issueScanDao;
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;

    @Override
    public Object getLivingIssueTendency(String beginDate, String endDate, String projectIds, String interval, String showDetail) {
        List<Map<String, Object>> result = new ArrayList<>();
        String time1 = " 00:00:00";
        String time2 = " 24:00:00";

        // since may be null
        if (!StringUtils.isEmpty(beginDate)) {
            beginDate = beginDate + time1;
        }

        endDate = endDate + time2;

        if (StringUtils.isEmpty(projectIds)) {
            projectIds = issueRepoDao.getAllRepos().stream().map(RepoScan::getRepoUuid).collect(Collectors.joining(","));
        }
        for (String projectId : projectIds.split(",")) {
            if (projectId.length() != 0) {
                String tempDateBegin;
                String tempDateEnd;
                if (StringUtils.isEmpty(beginDate)) {
                    // if start time is null
                    result.add(issueDao.getLivingIssueTendency(endDate, projectId, showDetail));
                } else {
                    tempDateBegin = beginDate.split(" ")[0] + time1;
                    switch (interval) {
                        case "day":
                            tempDateEnd = beginDate.split(" ")[0] + time2;
                            while (tempDateBegin.compareTo(endDate) < 1) {
                                result.add(issueDao.getLivingIssueTendency(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateBegin.split(" ")[0]) + time1;
                                tempDateEnd = tempDateBegin.split(" ")[0] + time2;
                            }
                            break;
                        case "month":
                            while (tempDateBegin.compareTo(endDate) < 1) {
                                tempDateEnd = tempDateBegin;
                                int year = Integer.parseInt(tempDateEnd.split(" ")[0].split("-")[0]);
                                int month = Integer.parseInt(tempDateEnd.split(" ")[0].split("-")[1]);
                                tempDateEnd = DateTimeUtil.lastDayOfMonth(year, month) + time2;
                                result.add(issueDao.getLivingIssueTendency(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateEnd).split(" ")[0] + time1;
                            }
                            break;
                        case "year":
                            while (tempDateBegin.compareTo(endDate) < 1) {
                                tempDateEnd = tempDateBegin;
                                int year = Integer.parseInt(tempDateEnd.split(" ")[0].split("-")[0]);
                                tempDateEnd = DateTimeUtil.lastDayOfMonth(year, 12) + time2;
                                result.add(issueDao.getLivingIssueTendency(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateEnd).split(" ")[0] + time1;
                            }
                            break;
                        default:
                            // if the start time is not null
                            while (tempDateBegin.compareTo(endDate) < 1) {
                                tempDateEnd = tempDateBegin;
                                try {
                                    SimpleDateFormat sdf = new SimpleDateFormat(DATE_FORMAT);
                                    Calendar cal = Calendar.getInstance();
                                    Date time = sdf.parse(tempDateEnd.split(" ")[0]);
                                    cal.setTime(time);
                                    int dayWeek = cal.get(Calendar.DAY_OF_WEEK);
                                    if (1 == dayWeek) {
                                        cal.add(Calendar.DAY_OF_MONTH, -1);
                                    }
                                    cal.setFirstDayOfWeek(Calendar.MONDAY);
                                    int day = cal.get(Calendar.DAY_OF_WEEK);
                                    cal.add(Calendar.DATE, cal.getFirstDayOfWeek() - day);
                                    cal.add(Calendar.DATE, 6);
                                    tempDateEnd = sdf.format(cal.getTime()) + time2;
                                } catch (ParseException e) {
                                    e.printStackTrace();
                                }
                                result.add(issueDao.getLivingIssueTendency(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateEnd).split(" ")[0] + time1;
                            }
                            break;
                    }
                }
            }
        }
        return result;
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
    public void setIssueDao(IssueDao issueDao) {
        this.issueDao = issueDao;
    }

    @Autowired
    public void setIssueRepoDao(IssueRepoDao issueRepoDao) {
        this.issueRepoDao = issueRepoDao;
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
