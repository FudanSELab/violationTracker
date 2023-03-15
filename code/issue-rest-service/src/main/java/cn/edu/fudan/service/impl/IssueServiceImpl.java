package cn.edu.fudan.service.impl;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.dao.*;
import cn.edu.fudan.domain.dbo.IssueNum;
import cn.edu.fudan.domain.dbo.IssueWithLocationItem;
import cn.edu.fudan.domain.dbo.Location;
import cn.edu.fudan.domain.enums.IssuePriorityEnums;
import cn.edu.fudan.domain.enums.IssueStatusEnum;
import cn.edu.fudan.domain.enums.IssuePriorityEnums.JavaIssuePriorityEnum;
import cn.edu.fudan.domain.enums.IssuePriorityEnums.JavaScriptIssuePriorityEnum;
import cn.edu.fudan.domain.enums.IssuePriorityEnums.CppIssuePriorityEnum;
import cn.edu.fudan.domain.enums.IssueTypeEnum;
import cn.edu.fudan.domain.vo.*;
import cn.edu.fudan.domain.vo.IssueFilterSidebarVO.IssueFilterSidebar;
import cn.edu.fudan.domain.vo.IssueFilterSidebarVO.IssueSideBarInfo;
import cn.edu.fudan.exception.UrlException;
import cn.edu.fudan.service.IssueService;
import cn.edu.fudan.util.DateTimeUtil;
import cn.edu.fudan.util.StringsUtil;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author WZY
 * @version 1.0
 **/
@Slf4j
@Service
@Transactional
public class IssueServiceImpl implements IssueService {
    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private static final String SOLVE_TIME = "solveTime";
    private static final String SOLVED_STR = "Solved";
    private static final String STATUS = "status";
    private static final String SOLVER = "solver";
    private static final String PRODUCER = "producer";
    private static final String REMAINING_ISSUE_COUNT = "remainingIssueCount";
    private static final String ELIMINATED_ISSUE_COUNT = "eliminatedIssueCount";
    private static final String NEW_ISSUE_COUNT = "newIssueCount";
    private static final String DEVELOPER = "developer";
    private static final String START_COMMIT_DATE = "startCommitDate";
    private static final String SOLVE_COMMIT = "solveCommit";
    private static final String PRIORITY = "priority";
    private static final String SOLVE_TYPE = "solveType";
    private static final String TOTAL = "total";
    private static final String REPO_UUID = "repoUuid";
    private static final String REPO_UUID2 = "repo_uuid";
    private static final String ISSUE_NUM = "issueNum";
    private final Logger logger = LoggerFactory.getLogger(IssueServiceImpl.class);
    private IssueDao issueDao;
    private ScanResultDao scanResultDao;
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;
    private RawIssueDao rawIssueDao;
    private LocationDao locationDao;
    private IssueRepoDao issueRepoDao;
    private IssueScanDao issueScanDao;

    @Value("${repoPrefix:/}")
    private String repoPrefix;

    @Override
    @Transactional(rollbackFor = Exception.class)
    @Async("delete-issue")
    public void deleteIssueByRepoIdAndTool(String repoUuid, String tool) {
        logger.info("start to delete issue -> repoUuid={} , tool={}", repoUuid, tool);
        //根据rawIssue来删库(便于控制每次删除的数量,防止超时锁表)
        List<String> rawIssueUuidList = rawIssueDao.getRawIssueUuidsByRepoIdAndTool(repoUuid, tool);
        //每次删除5000条rawIssue,防止超时锁表
        int deleteRawIssueCount = 0;
        while (deleteRawIssueCount < rawIssueUuidList.size()) {
            int firstIndex = deleteRawIssueCount;
            deleteRawIssueCount += 5000;
            List<String> partOfRawIssueIds = new ArrayList<>(rawIssueUuidList.subList(firstIndex, Math.min(deleteRawIssueCount, rawIssueUuidList.size())));
            rawIssueMatchInfoDao.deleteRawIssueMatchInfo(partOfRawIssueIds);
            rawIssueDao.deleteRawIssueByIds(partOfRawIssueIds);
        }
        //删除issue,issue_repo,issue_scan,scan_result表记录
        // 一个库只用了一个工具扫描  location删除只考虑了 repoUuid
        locationDao.deleteLocationsByRepoUuid(repoUuid);
        issueDao.deleteIssueByRepoIdAndTool(repoUuid, tool);
        issueRepoDao.delIssueRepo(repoUuid, tool, null);
        issueScanDao.deleteIssueScanByRepoIdAndTool(repoUuid, tool);
        scanResultDao.deleteScanResultsByRepoIdAndCategory(repoUuid, tool);

        //check delete success
        if (checkDeleteSuccess(repoUuid, tool)) {
            //完成删库
            logger.info("finish deleting issues -> repoUuid={} , tool={}", repoUuid, tool);
        }
    }

    public boolean checkDeleteSuccess(String repoUuid, String tool) {
        int issueCount = issueDao.getIssueCount(repoUuid, tool);
        int rawIssueCount = rawIssueDao.getRawIssueCount(repoUuid, tool);
        int locationCount = locationDao.getLocationCount(repoUuid);
        int matchInfoCount = rawIssueMatchInfoDao.getMatchInfoCount(repoUuid);
        return issueCount == 0 && rawIssueCount == 0 && locationCount == 0 && matchInfoCount == 0;
    }

    @Override
    public List<String> getExistIssueTypes(String tool) {
        List<String> types = issueDao.getExistIssueTypes(tool);
        String clone = "clone";
        if (clone.equals(tool)) {
            types.sort(Comparator.comparingInt(Integer::valueOf));
        }
        return types;
    }

    @Override
    public void updatePriority(String issueId, String severity, String token) throws Exception {
        JavaIssuePriorityEnum javaIssuePriorityEnum = JavaIssuePriorityEnum.getPriorityEnum(severity);
        if (javaIssuePriorityEnum == null) {
            throw new UrlException("priority is not illegal");
        }
        int priorityInt = javaIssuePriorityEnum.getRank();
        issueDao.updateOneIssuePriority(issueId, priorityInt);
    }

    @Override
    public void updateStatus(String issueId, String status, String manualStatus) {
        issueDao.updateOneIssueStatus(issueId, status, manualStatus);
    }

    @Override
    public List<Map<String, Object>> getRepoIssueCounts(List<String> repoUuids, String since, String until, String tool) {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate indexDay = LocalDate.parse(since, DateTimeUtil.Y_M_D_formatter);
        LocalDate untilDay = LocalDate.parse(until, DateTimeUtil.Y_M_D_formatter);

        String firstDateByRepo = scanResultDao.findFirstDateByRepo(repoUuids);
        if (firstDateByRepo == null) {
            while (indexDay.isBefore(untilDay) || indexDay.isEqual(untilDay)) {
                indexDay = getInitInfoInLocalDate(result, indexDay);
            }
            return result;
        }
        LocalDate firstDate = LocalDate.parse(firstDateByRepo.substring(0, 10), DateTimeUtil.Y_M_D_formatter);

        while (indexDay.isBefore(firstDate)) {
            indexDay = getInitInfoInLocalDate(result, indexDay);
        }

        LocalDate indexDay2 = LocalDate.parse(indexDay.toString(), DateTimeUtil.Y_M_D_formatter);
        Map<String, Object> firstDateScanResult = findFirstDateScanResult(repoUuids, indexDay2, firstDate, tool);
        firstDateScanResult.put(REMAINING_ISSUE_COUNT, Integer.valueOf(firstDateScanResult.get(REMAINING_ISSUE_COUNT).toString()));
        result.add(firstDateScanResult);
        indexDay = indexDay.plusDays(1);

        while (untilDay.isAfter(indexDay) || untilDay.isEqual(indexDay)) {
            Map<String, Object> map = new HashMap<>(16);
            List<Map<String, Object>> repoIssueCounts2 = scanResultDao.getRepoIssueCounts(repoUuids, indexDay.toString(), indexDay.toString(), tool, null);
            if (repoIssueCounts2.isEmpty()) {
                map.put(NEW_ISSUE_COUNT, 0);
                map.put(ELIMINATED_ISSUE_COUNT, 0);
                map.put(REMAINING_ISSUE_COUNT, Integer.valueOf(result.get(result.size() - 1).get(REMAINING_ISSUE_COUNT).toString()));
            } else {
                BigDecimal now = new BigDecimal((String) repoIssueCounts2.get(repoIssueCounts2.size() - 1).get(REMAINING_ISSUE_COUNT));
                BigDecimal last = new BigDecimal((int) result.get(result.size() - 1).get(REMAINING_ISSUE_COUNT));
                long temp = now.longValue() - last.longValue();
                map.put(NEW_ISSUE_COUNT, Math.max(temp, 0));
                map.put(ELIMINATED_ISSUE_COUNT, temp < 0 ? -temp : 0);
                map.put(REMAINING_ISSUE_COUNT, Integer.valueOf(repoIssueCounts2.get(repoIssueCounts2.size() - 1).get(REMAINING_ISSUE_COUNT).toString()));
            }
            map.put("date", indexDay.toString());
            result.add(map);
            indexDay = indexDay.plusDays(1);
        }

        return result;
    }

    private LocalDate getInitInfoInLocalDate(List<Map<String, Object>> result, LocalDate indexDay) {
        Map<String, Object> map = new HashMap<>(8);
        map.put("date", indexDay.toString());
        map.put(NEW_ISSUE_COUNT, 0);
        map.put(ELIMINATED_ISSUE_COUNT, 0);
        map.put(REMAINING_ISSUE_COUNT, 0);
        result.add(map);
        indexDay = indexDay.plusDays(1);
        return indexDay;
    }

    private Map<String, Object> findFirstDateScanResult(List<String> repoUuids, LocalDate indexDay, LocalDate firstDate, String tool) {
        Map<String, Object> map = new HashMap<>(8);
        map.put("date", indexDay.toString());
        while (indexDay.isAfter(firstDate) || indexDay.isEqual(firstDate)) {
            List<Map<String, Object>> repoIssueCounts = scanResultDao.getRepoIssueCounts(repoUuids, indexDay.toString(), indexDay.toString(), tool, null);
            if (!repoIssueCounts.isEmpty()) {
                map.put(NEW_ISSUE_COUNT, repoIssueCounts.get(repoIssueCounts.size() - 1).get(NEW_ISSUE_COUNT));
                map.put(ELIMINATED_ISSUE_COUNT, repoIssueCounts.get(repoIssueCounts.size() - 1).get(ELIMINATED_ISSUE_COUNT));
                map.put(REMAINING_ISSUE_COUNT, repoIssueCounts.get(repoIssueCounts.size() - 1).get(REMAINING_ISSUE_COUNT));
                break;
            }
            indexDay = indexDay.minusDays(1);
        }
        return map;
    }

    @Override
    public List<String> getIssueSeverities() {

        List<String> issueSeverities = new ArrayList<>();

        List<JavaIssuePriorityEnum> javaIssuePriorityEnums = new ArrayList<>(Arrays.asList(JavaIssuePriorityEnum.values()));

        javaIssuePriorityEnums = javaIssuePriorityEnums.stream().sorted(Comparator.comparing(JavaIssuePriorityEnum::getRank)).collect(Collectors.toList());

        for (JavaIssuePriorityEnum javaIssuePriorityEnum : javaIssuePriorityEnums) {
            issueSeverities.add(javaIssuePriorityEnum.getName());
        }

        return issueSeverities;
    }

    @Override
    public List<String> getIssueStatus() {

        List<String> issueStatus = new ArrayList<>();

        for (IssueStatusEnum issueStatusEnum : IssueStatusEnum.values()) {
            issueStatus.add(issueStatusEnum.getName());
        }

        return issueStatus;
    }

    @Override
    public List<String> getIssueIntroducers(List<String> repoUuids) {
        return issueDao.getIssueIntroducers(repoUuids);
    }

    @Override
    public List<IssueFilterSidebarVO> getIssuesFilterSidebar(Map<String, Object> query) {

        query = aggregationGitName(query);
        //get issue count info list
        List<Map<String, Object>> issueCountInfoList = issueDao.getIssueCountByCategoryAndType(query);

        List<List<IssueSideBarInfo>> sideBarInfos = new ArrayList<>();
        long codeSmellTotal = 0, bugTotal = 0, vulnerabilityTotal = 0, securityHotspotTotal = 0, warnTotal = 0, errorTotal = 0,
                informationTotal = 0, warningTotal = 0, seriousTotal = 0, criticalTotal = 0;

        for (int i = 0; i < 10; i++) {
            sideBarInfos.add(new ArrayList<>());
        }

        for (Map<String, Object> issueCountInfo : issueCountInfoList) {
            long count = (long) issueCountInfo.get("count");
            String type = (String) issueCountInfo.get("type");
            String category = (String) issueCountInfo.get("category");
            if (category == null) {
                log.warn("type:{} not exists in issue type", type);
                continue;
            }
            //java
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(IssueTypeEnum.CODE_SMELL.name(), category))) {
                codeSmellTotal += count;
                sideBarInfos.get(0).add(IssueFilterSidebarVO.IssueSideBarInfo.getSidebarInfo(count, type));
            }
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(IssueTypeEnum.BUG.name(), category))) {
                bugTotal += count;
                sideBarInfos.get(1).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(IssueTypeEnum.VULNERABILITY.name(), category))) {
                vulnerabilityTotal += count;
                sideBarInfos.get(2).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(IssueTypeEnum.SECURITY_HOTSPOT.name(), category))) {
                securityHotspotTotal += count;
                sideBarInfos.get(3).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            //js
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(JavaScriptIssuePriorityEnum.WARN.getName(), category))) {
                warnTotal += count;
                sideBarInfos.get(4).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(JavaScriptIssuePriorityEnum.ERROR.getName(), category))) {
                errorTotal += count;
                sideBarInfos.get(5).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            //c++
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(CppIssuePriorityEnum.INFORMATION.getName(), category))) {
                informationTotal += count;
                sideBarInfos.get(6).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(CppIssuePriorityEnum.WARNING.getName(), category))) {
                warningTotal += count;
                sideBarInfos.get(7).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(CppIssuePriorityEnum.SERIOUS.getName(), category))) {
                seriousTotal += count;
                sideBarInfos.get(8).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
            if (Boolean.TRUE.equals(StringsUtil.equalsWithoutSign(CppIssuePriorityEnum.CRITICAL.getName(), category))) {
                criticalTotal += count;
                sideBarInfos.get(9).add(IssueSideBarInfo.getSidebarInfo(count, type));
            }
        }

        long[] nums = {codeSmellTotal, bugTotal, vulnerabilityTotal, securityHotspotTotal, warnTotal, errorTotal, informationTotal, warningTotal, seriousTotal, criticalTotal};
        return buildIssueSideBar(nums, sideBarInfos);
    }

    private List<IssueFilterSidebarVO> buildIssueSideBar(long[] nums, List<List<IssueSideBarInfo>> sideBarInfos) {
        List<IssueFilterSidebarVO> result = new ArrayList<>();
        IssueFilterSidebar codeSmellSidebar = IssueFilterSidebar.builder()
                .total(nums[0])
                .name("Code smell")
                .types(sideBarInfos.get(0))
                .build();
        IssueFilterSidebar bugSidebar = IssueFilterSidebar.builder()
                .total(nums[1])
                .name("Bug")
                .types(sideBarInfos.get(1))
                .build();
        IssueFilterSidebar vulnerabilitySidebar = IssueFilterSidebar.builder()
                .total(nums[2])
                .name("Vulnerability")
                .types(sideBarInfos.get(2))
                .build();
        IssueFilterSidebar securityHotspotSidebar = IssueFilterSidebar.builder()
                .total(nums[3])
                .name("Security hotspot")
                .types(sideBarInfos.get(3))
                .build();

        IssueFilterSidebar warnSidebar = IssueFilterSidebar.builder()
                .total(nums[4])
                .name("Warn")
                .types(sideBarInfos.get(4))
                .build();
        IssueFilterSidebar errorSidebar = IssueFilterSidebar.builder()
                .total(nums[5])
                .name("Error")
                .types(sideBarInfos.get(5))
                .build();

        IssueFilterSidebar informationSidebar = IssueFilterSidebar.builder()
                .total(nums[6])
                .name("Information")
                .types(sideBarInfos.get(6))
                .build();
        IssueFilterSidebar warningSidebar = IssueFilterSidebar.builder()
                .total(nums[7])
                .name("Warning")
                .types(sideBarInfos.get(7))
                .build();
        IssueFilterSidebar seriousSidebar = IssueFilterSidebar.builder()
                .total(nums[8])
                .name("Serious")
                .types(sideBarInfos.get(8))
                .build();
        IssueFilterSidebar criticalSidebar = IssueFilterSidebar.builder()
                .total(nums[9])
                .name("Critical")
                .types(sideBarInfos.get(9))
                .build();

        List<IssueFilterSidebar> javaCategories = new ArrayList<>();
        javaCategories.add(codeSmellSidebar);
        javaCategories.add(bugSidebar);
        javaCategories.add(vulnerabilitySidebar);
        javaCategories.add(securityHotspotSidebar);
        IssueFilterSidebarVO javaSideBarVO = IssueFilterSidebarVO.builder()
                .language("java")
                .categories(javaCategories)
                .build();
        List<IssueFilterSidebar> jsCategories = new ArrayList<>();
        jsCategories.add(warnSidebar);
        jsCategories.add(errorSidebar);
        IssueFilterSidebarVO jsSideBarVO = IssueFilterSidebarVO.builder()
                .language("js")
                .categories(jsCategories)
                .build();
        List<IssueFilterSidebar> cppCategories = new ArrayList<>();
        cppCategories.add(informationSidebar);
        cppCategories.add(warningSidebar);
        cppCategories.add(seriousSidebar);
        cppCategories.add(criticalSidebar);
        IssueFilterSidebarVO cppSideBarVO = IssueFilterSidebarVO.builder()
                .language("c++")
                .categories(cppCategories)
                .build();

        result.add(javaSideBarVO);
        result.add(jsSideBarVO);
        result.add(cppSideBarVO);

        return result;
    }

    @Override
    public Map<String, Object> getIssueFilterListCount(Map<String, Object> query) {
        logger.info("filter issue count");
        Map<String, Object> issueFilterList = new HashMap<>(16);

        int totalNum;

        query = aggregationGitName(query);

        if (query.get(DEVELOPER) != null) {
            totalNum = issueDao.getIssueFilterListCount(query);
        } else if (query.get(SOLVER) != null) {
            totalNum = issueDao.getSolvedIssueFilterListCount(query);
        } else {
            totalNum = issueDao.getIssueFilterListCount(query);
        }
        logger.info("total num: {}", totalNum);
        issueFilterList.put(TOTAL, totalNum);
        return issueFilterList;
    }

    @Override
    public Map<String, Object> getIssueFilterList(Map<String, Object> query, Map<String, Object> issueFilterList) {
        logger.info("start filter: {}", query);
        List<Map<String, Object>> issues = query.get(DEVELOPER) != null ? issueDao.getIssueFilterList(query) :
                query.get(SOLVER) != null ? issueDao.getSolvedIssueFilterList(query) : issueDao.getIssueFilterList(query);
        Map<String, String> repoPathMap = new HashMap<>(32);
        for (Map<String, Object> issue : issues) {
            issue.put(START_COMMIT_DATE, DateTimeUtil.format((Date) issue.get(START_COMMIT_DATE)));
            issue.put("endCommitDate", DateTimeUtil.format((Date) issue.get("endCommitDate")));
            issue.put("createTime", DateTimeUtil.format((Date) issue.get("createTime")));
            issue.put(SOLVE_TIME, DateTimeUtil.format((Date) issue.get(SOLVE_TIME)));
            if (!repoPathMap.containsKey((String) issue.get(REPO_UUID))) {
                try {
                    // fixme
                    repoPathMap.put((String) issue.get(REPO_UUID), repoPrefix + (repoPrefix.endsWith("/") ? "" : "/"));
                } catch (Exception e) {
                    repoPathMap.put((String) issue.get(REPO_UUID), "");
                }
            }
            issue.put("repoPath", repoPathMap.get((String) issue.get(REPO_UUID)));
            issue.replace("targetFiles", repoPathMap.get((String) issue.get(REPO_UUID)) + issue.get("targetFiles"));
            if (SOLVED_STR.equals(issue.get(STATUS).toString())) {
                issue.put(SOLVE_TYPE, issue.get(SOLVE_TYPE));
                issue.put(SOLVER, issue.get(SOLVER));
                issue.put(SOLVE_TIME, issue.get("commit_time"));
                issue.put(SOLVE_COMMIT, issue.get("commit_id"));
            } else {
                issue.put(SOLVER, null);
                issue.put(SOLVE_TIME, null);
                issue.put(SOLVE_COMMIT, null);
            }
            Integer priority = (Integer) issue.get(PRIORITY);
            String tool = (String) issue.get("tool");
            issue.put(PRIORITY, IssuePriorityEnums.getPriorityByToolAndRank(tool, priority));
        }

        if (query.get("ps") != null) {
            int size = (int) query.get("ps");
            int total = (int) issueFilterList.get(TOTAL);

            issueFilterList.put("totalPage", total % size == 0 ? total / size : total / size + 1);
        }
        issueFilterList.put("issueList", issues);
        logger.info("issue numbers: {}", issues);
        return issueFilterList;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> getIssueFilterListWithDetail(Map<String, Object> query, Map<String, Object> issueFilterList) {
        //location: startLine endLine code issueType className methodName
        logger.info("filter detail: {}", query);
        if (query.get("detail").equals(false)) {
            return issueFilterList;
        }

        List<Map<String, Object>> issuesDetail = (List<Map<String, Object>>) issueFilterList.get("issueList");

        for (Map<String, Object> issue : issuesDetail) {
            String uuid = (String) issue.get("uuid");
            List<String> firstVersionRawIssueUuids = rawIssueDao.getFirstVersionRawIssueUuids(List.of(uuid));
            List<Location> locations = locationDao.getLocations(firstVersionRawIssueUuids.get(0));
            locations.forEach(location -> location.setFilePath(issue.get("repoPath") + location.getFilePath()));
            issue.put("detail", locations);
        }

        return issueFilterList;
    }

    @Override
    public Map<String, Object> getIssueRiskByDeveloper(List<String> repoList, String developer, Boolean asc, int page, int ps, int level) {
        Map<String, Object> map = new HashMap<>();
        if (developer != null) {
            map.put("page", page);
            map.put("records", 1);
            map.put(TOTAL, 1);
            map.put("rows", getIssueRiskByOneDeveloper(repoList, developer));
            return map;
        }
        List<DeveloperIssueRiskVO> list = new ArrayList<>();
        List<String> developers = issueScanDao.getAllDeveloper(repoList)
                .stream().sorted().collect(Collectors.toList());
        log.info("issue risk:get developers from repoUuids success");
        if (Boolean.FALSE.equals(asc)) Collections.reverse(developers);
        int total = developers.size();
        int totalPage = total % ps == 0 ? total / ps : total / ps + 1;
        List<String> finalDevelopers = new ArrayList<>();
        for (int i = 0; i < ps; i++) {
            if (developers.size() > ((page - 1) * ps + i)) {
                finalDevelopers.add(developers.get((page - 1) * ps + i));
            } else {
                break;
            }
        }
        finalDevelopers.forEach(d -> list.addAll(getIssueRiskByOneDeveloper(repoList, d)));
        log.info("issue risk:DeveloperIssueRiskVO add success");
        List<DeveloperIssueRiskVO> sortedList;
        if (level == 0) {
            sortedList = list.stream().sorted(Comparator.comparing(DeveloperIssueRiskVO::getRiskLevel)).collect(Collectors.toList());

        } else {
            sortedList = list.stream().sorted(Comparator.comparing(DeveloperIssueRiskVO::getRiskLevel).reversed()).collect(Collectors.toList());
        }
        map.put("page", page);
        map.put("records", total);
        map.put(TOTAL, totalPage);
        map.put("rows", sortedList);
        log.info("issue risk:return value success");
        return map;
    }

    private List<DeveloperIssueRiskVO> getIssueRiskByOneDeveloper(List<String> repoList, String developer) {
        List<DeveloperIssueRiskVO> list = new ArrayList<>();

        List<String> developers = new ArrayList<>();
        List<String> status = new ArrayList<>();
        developers.add(developer);
        status.add("Open");

        Map<String, Object> query = new HashMap<>();
        query.put(PRODUCER, developers);
        query.put("repoList", repoList);
        query.put(DEVELOPER, developers);

        List<Integer> selfIntroduceSelfSolvedIssueInfo = issueDao.getSelfIntroduceSelfSolvedIssueInfo(query);
        int selfIntroduceSelfSolvedNum = 0, middleNum = 0;
        int introduceNum = issueDao.getIssueFilterListCount(query);
        if (selfIntroduceSelfSolvedIssueInfo != null && !selfIntroduceSelfSolvedIssueInfo.isEmpty()) {
            selfIntroduceSelfSolvedNum = selfIntroduceSelfSolvedIssueInfo.size();
            middleNum = selfIntroduceSelfSolvedIssueInfo.get(selfIntroduceSelfSolvedIssueInfo.size() / 2);
        }

        query.put(STATUS, status);
        Date date = issueDao.getLatestIntroduceTime(developer);
        int selfIntroduceOpenNum = issueDao.getIssueFilterListCount(query);

        DeveloperIssueRiskVO developerIssueRiskVO = DeveloperIssueRiskVO.builder()
                .developer(developer)
                .introduceNum(introduceNum)
                .selfIntroduceOpenNum(selfIntroduceOpenNum)
                .selfIntroduceOthersSolveNum(issueDao.getSelfIntroduceOtherSolvedIssueInfo(query).size())
                .selfIntroduceSelfSolvedNum(selfIntroduceSelfSolvedNum)
                .selfIntroduceSelfSolvedMiddleNum(middleNum)
                .lastIntroduceTime(DateTimeUtil.format(date))
                .riskLevel(selfIntroduceOpenNum * 1.0 / DateTimeUtil.dateDiff(date, new Date()))
                .build();

        list.add(developerIssueRiskVO);

        return list;
    }

    @Override
    public List<Map<String, String>> getOpenIssues(List<String> repoUuidList) {
        List<Map<String, String>> list = new ArrayList<>();
        for (String repoUuid : repoUuidList) {
            Map<String, String> map = new HashMap<>(2);
            map.put(REPO_UUID, repoUuid);
            map.put("num", String.valueOf(issueDao.getRemainingIssueCount(repoUuid)));
            list.add(map);
        }
        return list;
    }

    public Map<String, Object> aggregationGitName(Map<String, Object> query) {
        //fixme  get developer name from git
        return query;
    }

    @Override
    public List<String> getRepoListByUrlProjectNamesRepoUuids(String url, String projectNames, String repoUuids, String userToken) {

        List<String> repoList = new ArrayList<>();
        if (ObjectUtils.isEmpty(userToken)) {
            List<RepoScan> repoScans = issueRepoDao.getAllRepos();
            log.info("issue risk: get repo list from issue_repo");
            return repoScans.isEmpty() ? new ArrayList<>() : repoScans.stream().map(RepoScan::getRepoUuid).collect(Collectors.toList());
        }

        if (!StringUtils.isEmpty(repoUuids)) {
            repoList = Arrays.asList(repoUuids.split(","));
            log.info("issue risk:get repo list from repoUuids");
            return repoList;
        }
        return repoList;
    }

    @Override
    public PagedGridResult<DeveloperIssueVO> getDeveloperImportIssue(String repoUuids, String developers, String facets, String since, String until, String tool, int page, int ps, String identity) {
        List<String> repoUuidList = StringsUtil.splitStringList(repoUuids);
        List<String> developerList;
        if (developers == null || developers.length() == 0) {
            developerList = issueScanDao.getAllDeveloper(repoUuidList);
        } else {
            developerList = StringsUtil.splitStringList(developers);
        }
        Map<String, Object> query = initQuery(repoUuidList, facets, since, until, tool, developerList);
        List<Map<String, Object>> results;
        Map<String, DeveloperIssueVO> developerMap = new HashMap<>();
        List<Map.Entry<String, DeveloperIssueVO>> entryList = new ArrayList<>();
        if (PRODUCER.equals(identity)) {
            results = issueDao.getDeveloperImportIssue(query);
            for (Map<String, Object> map : results) {
                String facet = map.get(facets).toString();
                IssueNum issueNum = new IssueNum();
                HashMap<String, IssueNum> issueNumHashMap = new HashMap<>();
                issueNumHashMap.put(facet, issueNum);
                issueNum.setImportNum(Integer.parseInt(map.get("importNum").toString()));
                if (!developerMap.containsKey(map.get(PRODUCER).toString())) {
                    developerMap.put(map.get(PRODUCER).toString(), DeveloperIssueVO.builder().repoUuid(map.get(REPO_UUID2).toString())
                            .importDeveloper(map.get(PRODUCER).toString())
                            .importSum(Integer.parseInt(map.get("importNum").toString()))
                            .issueNumHashMap(issueNumHashMap).build());
                } else {
                    developerMap.get(map.get(PRODUCER).toString()).addImportNum(issueNum, map.get(facets).toString());
                }

                List<Map.Entry<String, DeveloperIssueVO>> entryList2 = new ArrayList<>(developerMap.entrySet());
                entryList2.sort((me1, me2) -> {
                    return me2.getValue().getImportSum().compareTo(me1.getValue().getImportSum());
                    //return me2.getValue().compareTo(me1.getValue()); // 降序排序
                });
                entryList = entryList2;

            }
        } else {
            results = issueDao.getDeveloperSolvedIssue(query);
            for (Map<String, Object> map : results) {
                String facet = map.get(facets).toString();
                if (map.get(SOLVER) == null) {
                    continue;
                }
                if (!developerMap.containsKey(map.get(SOLVER).toString())) {
                    HashMap<String, IssueNum> issueNumHashMap = new HashMap<>();
                    developerMap.put(map.get(SOLVER).toString(), DeveloperIssueVO.builder().repoUuid(map.get(REPO_UUID2).toString())
                            .solvedDeveloper(map.get(SOLVER).toString())
                            .solveSum(0)
                            .issueNumHashMap(issueNumHashMap)
                            .build());
                }
                developerMap.get(map.get(SOLVER).toString()).addSolvedNum(Integer.parseInt(map.get("solvedNum").toString()), facet, map.get("solve_way").toString());
            }
            List<Map.Entry<String, DeveloperIssueVO>> entryList2 = new ArrayList<Map.Entry<String, DeveloperIssueVO>>(developerMap.entrySet());
            entryList2.sort((me1, me2) -> {
                return me2.getValue().getSolveSum().compareTo(me1.getValue().getSolveSum());
                //return me2.getValue().compareTo(me1.getValue()); // 降序排序
            });
            entryList = entryList2;

        }

        List<DeveloperIssueVO> developerIssueVOList = new ArrayList<>();
        for (Map.Entry<String, DeveloperIssueVO> entry : entryList) {
            developerIssueVOList.add(entry.getValue());
        }


        return PagedGridResult.restPage(developerIssueVOList, page, ps);
    }

    public Map<String, Object> initQuery(List<String> repoUuidList, String facets, String since, String until, String tool, List<String> developers) {
        Map<String, Object> query = new HashMap<>();
        query.put("repoUuidList", repoUuidList);
        query.put("facets", facets);
        query.put("since", since);
        query.put("until", until);
        query.put("tool", tool);
        query.put("developers", developers);
        return query;
    }

    @Override
    public PagedGridResult<DeveloperIssueVO> getRelationToOthers(String repoUuids, String developers, String facets, String identity, boolean isSelf, String since, String until, String tool, int page, int ps) {
        List<String> repoUuidList = StringsUtil.splitStringList(repoUuids);
        List<String> developerList;
        if (developers == null || developers.length() == 0) {
            developerList = issueScanDao.getAllDeveloper(repoUuidList);
        } else {
            developerList = StringsUtil.splitStringList(developers);
        }
        Map<String, Object> query = initQuery(repoUuidList, facets, since, until, tool, developerList);

        List<Map<String, Object>> results;
        Map<String, DeveloperIssueVO> developerMap = new HashMap<>();
        List<Map.Entry<String, DeveloperIssueVO>> entryList = new ArrayList<>();
        if (isSelf) {
            results = issueDao.getSelfSolve(query);
            for (Map<String, Object> map : results) {
                String facet = map.get(facets).toString();
                if (!developerMap.containsKey(map.get(PRODUCER).toString())) {
                    HashMap<String, IssueNum> issueNumHashMap = new HashMap<>();
                    developerMap.put(map.get(PRODUCER).toString(), DeveloperIssueVO.builder().repoUuid(map.get(REPO_UUID2).toString())
                            .solvedDeveloper(map.get(SOLVER).toString())
                            .importDeveloper(map.get(PRODUCER).toString())
                            .solveSum(0)
                            .issueNumHashMap(issueNumHashMap).build());
                }
                developerMap.get(map.get(SOLVER).toString()).addSolvedNum(Integer.parseInt(map.get("solvedNum").toString()), facet, map.get("solve_way").toString());
            }
            List<Map.Entry<String, DeveloperIssueVO>> entryList2 = new ArrayList<>(developerMap.entrySet());
            entryList2.sort((me1, me2) -> me2.getValue().getSolveSum().compareTo(me1.getValue().getSolveSum()));
            entryList = entryList2;
        }

        List<DeveloperIssueVO> developerIssueVOList = new ArrayList<>();
        for (Map.Entry<String, DeveloperIssueVO> entry : entryList) {
            developerIssueVOList.add(entry.getValue());
        }
        return PagedGridResult.restPage(developerIssueVOList, page, ps);

    }

    @Override
    public PagedGridResult<DeveloperMapVO> getMapOthers(String repoUuids, String developers, String facets, String identity, boolean isSelf, String since, String until, String tool, int page, int ps) {
        List<String> repoUuidList = StringsUtil.splitStringList(repoUuids);
        List<String> developerList;
        if (developers == null || developers.length() == 0) {
            developerList = issueScanDao.getAllDeveloper(repoUuidList);
        } else {
            developerList = StringsUtil.splitStringList(developers);
        }
        Map<String, Object> query = initQuery(repoUuidList, facets, since, until, tool, developerList);
        query.put("identity", identity);

        List<Map<String, Object>> results;
        HashMap<String, DeveloperMapVO> proMapSol = new HashMap<>();
        List<Map.Entry<String, DeveloperMapVO>> entryList;
        if (PRODUCER.equals(identity)) {
            results = issueDao.getOtherSolveSelfIntroduce(query);

            for (Map<String, Object> map : results) {
                String facet = map.get(facets).toString();
                if (map.get(PRODUCER) == null) {
                    continue;
                }
                HashMap<String, DeveloperIssueVO> developerIssueVOHashMap = new HashMap<>();
                HashMap<String, IssueNum> issueNumHashMap = new HashMap<>();
                if (!proMapSol.containsKey(map.get(PRODUCER).toString())) {
                    proMapSol.put(map.get(PRODUCER).toString(), DeveloperMapVO.builder().issueSum(0).developerIssueHashMap(developerIssueVOHashMap).build());
                }
                if (!proMapSol.get(map.get(PRODUCER).toString()).getDeveloperIssueHashMap().containsKey(map.get(SOLVER).toString())) {
                    proMapSol.get(map.get(PRODUCER).toString()).getDeveloperIssueHashMap().put(map.get(SOLVER).toString(),
                            DeveloperIssueVO.builder().repoUuid(map.get(REPO_UUID2).toString())
                                    .solvedDeveloper(map.get(SOLVER).toString())
                                    .importDeveloper(map.get(PRODUCER).toString())
                                    .solveSum(0)
                                    .issueNumHashMap(issueNumHashMap)
                                    .build());
                }
                proMapSol.get(map.get(PRODUCER).toString()).add(Integer.parseInt(map.get("solvedNum").toString()));
                proMapSol.get(map.get(PRODUCER).toString()).getDeveloperIssueHashMap().get(map.get(SOLVER).toString()).addSolvedNum(Integer.parseInt(map.get("solvedNum").toString()), facet, map.get("solve_way").toString());
            }
            List<Map.Entry<String, DeveloperMapVO>> entryList2 = new ArrayList<>(proMapSol.entrySet());
            entryList2.sort((me1, me2) -> {
                return me2.getValue().getIssueSum().compareTo(me1.getValue().getIssueSum());
                //return me2.getValue().compareTo(me1.getValue()); // 降序排序
            });
            entryList = entryList2;

        } else {
            results = issueDao.getOtherSolveSelfIntroduce(query);

            for (Map<String, Object> map : results) {
                String facet = map.get(facets).toString();
                if (map.get(PRODUCER) == null) {
                    continue;
                }
                HashMap<String, DeveloperIssueVO> developerIssueVOHashMap = new HashMap<>();
                HashMap<String, IssueNum> issueNumHashMap = new HashMap<>();

                if (!proMapSol.containsKey(map.get(SOLVER).toString())) {
                    proMapSol.put(map.get(SOLVER).toString(), DeveloperMapVO.builder().issueSum(0).developerIssueHashMap(developerIssueVOHashMap).build());
                }
                if (!proMapSol.get(map.get(SOLVER).toString()).getDeveloperIssueHashMap().containsKey(map.get(PRODUCER).toString())) {
                    proMapSol.get(map.get(SOLVER).toString()).getDeveloperIssueHashMap().put(map.get(PRODUCER).toString(),
                            DeveloperIssueVO.builder().repoUuid(map.get(REPO_UUID2).toString())
                                    .solvedDeveloper(map.get(SOLVER).toString())
                                    .importDeveloper(map.get(PRODUCER).toString())
                                    .solveSum(0)
                                    .issueNumHashMap(issueNumHashMap)
                                    .build());
                }
                proMapSol.get(map.get(SOLVER).toString()).add(Integer.parseInt(map.get("solvedNum").toString()));
                proMapSol.get(map.get(SOLVER).toString()).getDeveloperIssueHashMap().get(map.get(PRODUCER).toString()).addSolvedNum(Integer.parseInt(map.get("solvedNum").toString()), facet, map.get("solve_way").toString());
            }
            List<Map.Entry<String, DeveloperMapVO>> entryList2 = new ArrayList<>(proMapSol.entrySet());
            entryList2.sort((me1, me2) -> {
                return me2.getValue().getIssueSum().compareTo(me1.getValue().getIssueSum());
                //return me2.getValue().compareTo(me1.getValue()); // 降序排序
            });
            entryList = entryList2;

        }
        List<DeveloperMapVO> developerIssueVOList = new ArrayList<>();
        for (Map.Entry<String, DeveloperMapVO> entry : entryList) {
            developerIssueVOList.add(entry.getValue());
        }
        return PagedGridResult.restPage(developerIssueVOList, page, ps);
    }

    @Override
    public PagedGridResult<DeveloperIssueVO> getDeveloperIssueByCommit(String repoUuids, String developers, String facets, String identity, String since, String until, String tool, int page, int ps) {
        List<String> repoUuidList = StringsUtil.splitStringList(repoUuids);
        List<String> developerList;
        if (developers == null || developers.length() == 0) {
            developerList = issueScanDao.getAllDeveloper(repoUuidList);
        } else {
            developerList = StringsUtil.splitStringList(developers);
        }
        Map<String, Object> query = initQuery(repoUuidList, facets, since, until, tool, developerList);
        query.put("identity", identity);

        Map<String, DeveloperIssueVO> developerMap = new HashMap<>();
        List<Map.Entry<String, DeveloperIssueVO>> entryList;
        List<Map<String, Object>> results;
        String commit;
        String commitTime;
        if (PRODUCER.equals(identity)) {
            results = issueDao.getDeveloperImportIssueByCommit(query);
            commit = "start_commit";
            commitTime = "start_commit_date";
        } else {
            results = issueDao.getDeveloperSolveIssueByCommit(query);
            commit = "solve_commit";
            commitTime = "solve_commit_date";
        }

        //results = issueDao.getDeveloperImportIssueByCommit(query);
        for (Map<String, Object> map : results) {
            if (map.get(commitTime) == null) {
                continue;
            }
            String facet = map.get(facets).toString();
            IssueNum issueNum = new IssueNum();
            DeveloperCommitIssueVO developerCommitIssueVO = DeveloperCommitIssueVO.builder()
                    .commitId(map.get(commit).toString())
                    .commitTime(map.get(commitTime).toString())
                    .issueSum(0)
                    .issueNumHashMap(new HashMap<>())
                    .build();
            if (!developerMap.containsKey(map.get(identity).toString())) {
                HashMap<String, DeveloperCommitIssueVO> developerCommitIssueVOHashMap = new HashMap<>();
                HashMap<String, IssueNum> issueNumHashMap = new HashMap<>();
                developerMap.put(map.get(identity).toString(), DeveloperIssueVO.builder().repoUuid(map.get(REPO_UUID2).toString())
                        .developer(map.get(identity).toString())
                        .importSum(0)
                        .solveSum(0)
                        .issueNumHashMap(issueNumHashMap)
                        .developerCommitIssueVOHashMap(developerCommitIssueVOHashMap).build());
            }
            DeveloperIssueVO developerIssueVO = developerMap.get(map.get(identity).toString());
            if (!developerIssueVO.getDeveloperCommitIssueVOHashMap().containsKey(map.get(commit).toString())) {
                developerIssueVO.getDeveloperCommitIssueVOHashMap().put(map.get(commit).toString(), developerCommitIssueVO);
            }
            if (PRODUCER.equals(identity)) {
                issueNum.setImportNum(Integer.parseInt(map.get(ISSUE_NUM).toString()));
                developerIssueVO.adImportNum(issueNum);
                developerIssueVO.getDeveloperCommitIssueVOHashMap().get(map.get(commit).toString()).addImportNum(issueNum, facet);
            } else {
                developerIssueVO.addSolvedNum(Integer.parseInt(map.get(ISSUE_NUM).toString()));
                developerIssueVO.getDeveloperCommitIssueVOHashMap().get(map.get(commit).toString()).addSolvedNum(Integer.parseInt(map.get(ISSUE_NUM).toString()), facet, map.get("solve_way").toString());
            }
        }
        List<Map.Entry<String, DeveloperIssueVO>> entryList2 = new ArrayList<>(developerMap.entrySet());
        entryList2.sort((me1, me2) -> {
            if (PRODUCER.equals(identity)) {
                return me2.getValue().getImportSum().compareTo(me1.getValue().getImportSum());
            } else {
                return me2.getValue().getSolveSum().compareTo(me1.getValue().getSolveSum());
            }
        });
        entryList = entryList2;

        List<DeveloperIssueVO> developerIssueVOList = new ArrayList<>();
        for (Map.Entry<String, DeveloperIssueVO> entry : entryList) {
            developerIssueVOList.add(entry.getValue());
        }

        return PagedGridResult.restPage(developerIssueVOList, page, ps);
    }


    @Override
    public Object getLivingIssueTendency(String beginDate, String endDate, String tools, String interval, String showDetail) {
        List<Map<String, Object>> result = new ArrayList<>();
        String time1 = " 00:00:00";
        String time2 = " 24:00:00";

        // since 可能为空 所以需要判断一下
        if (!StringUtils.isEmpty(beginDate)) {
            beginDate = beginDate + time1;
        }

        // until 约定了必须要传
        endDate = endDate + time2;
        Set<String> toolSet;
        if (StringUtils.isEmpty(tools)) {
            toolSet = issueRepoDao.getAllRepos().stream().map(RepoScan::getTool).collect(Collectors.toSet());
        } else {
            toolSet = Arrays.stream(tools.split(",")).collect(Collectors.toSet());
        }
        String finalBeginDate = beginDate;
        String finalEndDate = endDate;
        toolSet.forEach(projectId -> {
            if (projectId.length() != 0) {
                String tempDateBegin;
                String tempDateEnd;
                if (StringUtils.isEmpty(finalBeginDate)) {
                    // 不传since的情况
                    result.add(issueDao.getLivingIssueTendencyInIssueService(finalEndDate, projectId, showDetail));
                } else {
                    tempDateBegin = finalBeginDate.split(" ")[0] + time1;
                    switch (interval) {
                        case "day":
                            tempDateEnd = finalBeginDate.split(" ")[0] + time2;
                            while (tempDateBegin.compareTo(finalEndDate) < 1) {
                                result.add(issueDao.getLivingIssueTendencyInIssueService(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateBegin.split(" ")[0]) + time1;
                                tempDateEnd = tempDateBegin.split(" ")[0] + time2;
                            }
                            break;
                        case "month":
                            while (tempDateBegin.compareTo(finalEndDate) < 1) {
                                tempDateEnd = tempDateBegin;
                                int year = Integer.parseInt(tempDateEnd.split(" ")[0].split("-")[0]);
                                int month = Integer.parseInt(tempDateEnd.split(" ")[0].split("-")[1]);
                                tempDateEnd = DateTimeUtil.lastDayOfMonth(year, month) + time2;
                                result.add(issueDao.getLivingIssueTendencyInIssueService(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateEnd).split(" ")[0] + time1;
                            }
                            break;
                        case "year":
                            while (tempDateBegin.compareTo(finalEndDate) < 1) {
                                tempDateEnd = tempDateBegin;
                                int year = Integer.parseInt(tempDateEnd.split(" ")[0].split("-")[0]);
                                tempDateEnd = DateTimeUtil.lastDayOfMonth(year, 12) + time2;
                                result.add(issueDao.getLivingIssueTendencyInIssueService(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateEnd).split(" ")[0] + time1;
                            }
                            break;
                        default:
                            // 传since的情况
                            while (tempDateBegin.compareTo(finalEndDate) < 1) {
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
                                result.add(issueDao.getLivingIssueTendencyInIssueService(tempDateEnd, projectId, showDetail));
                                tempDateBegin = DateTimeUtil.datePlus(tempDateEnd).split(" ")[0] + time1;
                            }
                            break;
                    }
                }
            }
        });
        return result;
    }

    @Override
    public PagedGridResult<IssueWithLocationItem> getFileIssues(String repoUuid, String commitId, String filePath) {
        List<IssueWithLocationItem> issueList = issueDao.getIssuesByConditions(repoUuid, commitId, filePath);
        return PagedGridResult.restPage(issueList, 1, issueList.size());
    }


    @Autowired
    public void setIssueDao(IssueDao issueDao) {
        this.issueDao = issueDao;
    }

    @Autowired
    public void setScanResultDao(ScanResultDao scanResultDao) {
        this.scanResultDao = scanResultDao;
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
    public void setIssueRepoDao(IssueRepoDao issueRepoDao) {
        this.issueRepoDao = issueRepoDao;
    }

    @Autowired
    public void setIssueScanDao(IssueScanDao issueScanDao) {
        this.issueScanDao = issueScanDao;
    }

    @Autowired
    public void setRawIssueMatchInfoDao(RawIssueMatchInfoDao rawIssueMatchInfoDao) {
        this.rawIssueMatchInfoDao = rawIssueMatchInfoDao;
    }

}
