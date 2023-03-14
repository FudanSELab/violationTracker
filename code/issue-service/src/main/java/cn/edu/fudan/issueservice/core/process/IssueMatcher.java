package cn.edu.fudan.issueservice.core.process;

import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.issueservice.core.analyzer.BaseAnalyzer;
import cn.edu.fudan.issueservice.core.matcher.Matcher;
import cn.edu.fudan.issueservice.core.matcher.MatcherFactory;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.*;
import cn.edu.fudan.issueservice.domain.dto.MatcherCommitInfo;
import cn.edu.fudan.issueservice.domain.dto.MatcherData;
import cn.edu.fudan.issueservice.domain.dto.MatcherResult;
import cn.edu.fudan.issueservice.domain.enums.CommitStatusEnum;
import cn.edu.fudan.issueservice.domain.enums.IgnoreTypeEnum;
import cn.edu.fudan.issueservice.domain.enums.IssuePriorityEnums;
import cn.edu.fudan.issueservice.domain.enums.ScanStatusEnum;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import cn.edu.fudan.issueservice.util.FileFilter;
import cn.edu.fudan.issueservice.util.SearchUtil;
import lombok.Data;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author fancying
 * create: 2020-05-20 16:56
 **/
@Slf4j
@Data
@Component
@Scope("prototype")
public class IssueMatcher {

    private static IssueScanDao issueScanDao;
    private static RawIssueDao rawIssueDao;
    private static IssueDao issueDao;
    private static IssueTypeDao issueTypeDao;
    private static LocationDao locationDao;
    private static RawIssueMatchInfoDao rawIssueMatchInfoDao;
    private JGitHelper jGitHelper;
    private String curCommit;
    private BaseAnalyzer analyzer;
    private MatcherFactory matcherFactory;
    private int ignoreMergeSolvedIssueNum;
    @Value("${baseLogHome}")
    private String logHome;
    @Value("${enableTotalScan:true}")
    private boolean enableTotalScan;
    private static Map<String, IssueType> issueTypeMap = new HashMap<>();

    /**
     * des: @key parentCommitId   @value mapped raw issues with current commit
     * Raw issues in the following three situations need to be stored, which
     * 1. rawIssueMatchInfos are not empty
     * 2. the statuses are solved
     * 3. are not empty in matchInfoResult (add, change and mergeSolved )
     **/
    @Getter
    private Map<String, List<RawIssue>> parentRawIssuesResult = new HashMap<>(4);

    @Getter
    private List<RawIssue> curAllRawIssues;

    /**
     * des: @key issue uuid   @value mapped issue
     * <p>
     * It is used to update a record of the issue table
     **/
    @Getter
    private Map<String, Issue> mappedIssues;

    /**
     * des: @key issue uuid   @value reopened issue
     * <p>
     * It is used to update a record of the issue table
     **/
    @Getter
    private Map<String, Issue> reopenIssues;


    /**
     * des: @key issue uuid   @value added issue
     * It is used to add a record of the issue table
     **/
    @Getter
    private Map<String, Issue> newIssues = new HashMap<>(0);

    /**
     * des: @key issue uuid   @value issue solved issue
     * It is used to update a record of the issue table
     **/
    @Getter
    private Map<String, Issue> solvedIssue;

    private Map<String, Map<String, String>> fileMap = new HashMap<>();

    private ApplicationContext applicationContext;

    public boolean matchProcess(String repoUuid, String curCommit, JGitHelper jGitHelper, String tool, List<RawIssue> parentAndCurRawIssues) {
        try {
            long startProcess = System.currentTimeMillis();
            // checkout current commit
            log.info("match process[{}], step 1: checkout commit {}", repoUuid, curCommit);
            this.jGitHelper = jGitHelper;
            jGitHelper.checkout(curCommit);
            log.info("match process[{}], step 2: get scanned parent commits, commit {}, step 1 uses {} s", repoUuid, curCommit, (System.currentTimeMillis() - startProcess) / 1000);
            startProcess = System.currentTimeMillis();
            // Get scanned parent commits, and initial matcher data
            List<String> parentCommits = enableTotalScan ? getPreScanSuccessfullyCommit(repoUuid, curCommit, jGitHelper, tool) : Arrays.asList(jGitHelper.getCommitParents(curCommit));
            log.info("match process[{}], step 3: init matcher data, commit {}, step 2 uses {} s", repoUuid, curCommit, (System.currentTimeMillis() - startProcess) / 1000);
            startProcess = System.currentTimeMillis();
            // Prepare the data needed to be matched
            MatcherData matcherData = initMatcherData(repoUuid, curCommit, jGitHelper, tool, parentAndCurRawIssues, parentCommits);

            // Current commit the first normal or merged one
            CommitStatusEnum commitStatusEnum = CommitStatusEnum.FIRST;
            if (!parentCommits.isEmpty()) {
                commitStatusEnum = parentCommits.size() > 1 ? CommitStatusEnum.MERGE : CommitStatusEnum.NORMAL;
            }
            log.info("match process[{}], step 4: match raw issues, commit {}, step 3 uses {} s", repoUuid, curCommit, (System.currentTimeMillis() - startProcess) / 1000);
            startProcess = System.currentTimeMillis();
            Matcher matcher = matcherFactory.createMatcher(commitStatusEnum, matcherData);
            matcher.init(logHome, issueDao, issueTypeDao, rawIssueDao, rawIssueMatchInfoDao);
            MatcherResult matcherResult = matcher.matchRawIssues();
            log.info("match process[{}], step 5: sum up matcher data, commit {}, step 4 uses {} s", repoUuid, curCommit, (System.currentTimeMillis() - startProcess) / 1000);
            startProcess = System.currentTimeMillis();
            sumUpMatcherData(matcherData, matcherResult);
            log.info("match process[{}] success, commit {}, step 5 uses {} s", repoUuid, curCommit, (System.currentTimeMillis() - startProcess) / 1000);
        } catch (Exception e) {
            log.error("match throw exception, check the code");
            e.printStackTrace();
            return false;
        }

        return true;
    }

    private MatcherData initMatcherData(String repoUuid, String curCommit, JGitHelper jGitHelper, String tool, List<RawIssue> parentAndCurRawIssues, List<String> parentCommits) {
        long startInit = System.currentTimeMillis();
        log.info("start init matcher data[{}] for current commit: {}", repoUuid, curCommit);
        Set<RawIssue> curRawIssueSet = new HashSet<>();
        Map<String, List<String>> commitFileMap = new HashMap<>(8);
        Map<String, List<RawIssue>> parentRawIssuesMap = new HashMap<>(8);
        Map<String, Map<String, String>> preFile2CurFileMap = new HashMap<>(8);
        Map<String, Map<String, String>> curFile2PreFileMap = new HashMap<>(8);

        Map<String, List<RawIssue>> commitToRawIssues = parentAndCurRawIssues.stream().collect(Collectors.groupingBy(RawIssue::getCommitId));

        List<RawIssue> curRawIssues = commitToRawIssues.getOrDefault(curCommit, new ArrayList<>());

        if (issueTypeMap.isEmpty()) {
            issueTypeDao.getIssueTypes(null).forEach(issueType -> issueTypeMap.putIfAbsent(issueType.getType(), issueType));
        }

//        curRawIssueSet.addAll(curRawIssues);
        if (parentCommits.isEmpty()) {
            curRawIssueSet.addAll(curRawIssues);
        }

        log.info("init matcher data[{}], step 1:init matcher data for current commit: {}", repoUuid, curCommit);
        long matchProcess = System.currentTimeMillis();
        for (String parentCommit : parentCommits) {
            Map<String, String> preFile2CurFile = new HashMap<>(16);
            Map<String, String> curFile2PreFile = new HashMap<>(16);

            log.info("init matcher data[{}], step 1-1:get diff files for current commit: {} parentCommit: {}", repoUuid, curCommit, parentCommit);
            // Get the files that have changed
            List<String> diffFiles = jGitHelper.getDiffFilePair(parentCommit, curCommit, preFile2CurFile, curFile2PreFile);
            log.info("init matcher data[{}], step 1-2:filter files and issues for current commit: {} parentCommit: {}, step 1-1 uses {} s", repoUuid, curCommit, parentCommit, (System.currentTimeMillis() - matchProcess) / 1000);
            matchProcess = System.currentTimeMillis();
            // Preprocess the files that have changed
            var delimiter = ",";
            List<String> preFiles = diffFiles.stream().filter(d -> !d.startsWith(delimiter)).map(f -> Arrays.asList(f.split(delimiter)).get(0)).collect(Collectors.toList());
            List<String> curFiles = diffFiles.stream().filter(d -> !d.endsWith(delimiter)).map(f -> Arrays.asList(f.split(delimiter)).get(1)).collect(Collectors.toList());

            // filter
            curFiles = curFiles.stream().filter(file -> !FileFilter.fileFilter(tool, file)).collect(Collectors.toList());

            preFiles = preFiles.stream().filter(file -> !FileFilter.fileFilter(tool, file)).collect(Collectors.toList());

            List<String> finalCurFiles = curFiles;
            curRawIssueSet.addAll(curRawIssues.stream().filter(rawIssue -> finalCurFiles.contains(rawIssue.getFileName())).collect(Collectors.toList()));

            List<RawIssue> preRawIssues = commitToRawIssues.getOrDefault(parentCommit, new ArrayList<>());

            List<String> finalPreFiles = preFiles;
            preRawIssues = preRawIssues.stream().filter(rawIssue -> finalPreFiles.contains(rawIssue.getFileName())).collect(Collectors.toList());

            log.info("init matcher data[{}], step 1-3:get parent commits for current commit: {} parentCommit: {}, step 1-2 uses {} s", repoUuid, curCommit, parentCommit, (System.currentTimeMillis() - matchProcess) / 1000);
            matchProcess = System.currentTimeMillis();
            List<Issue> newIssueList = new ArrayList<>();
            List<RawIssue> newRawIssueList = new ArrayList<>();
            List<String> allParentCommits = jGitHelper.getAllCommitParents(curCommit);
            log.info("init matcher data[{}], step 1-4:match rawIssue in database for current commit: {} parentCommit: {}, step 1-3 uses {} s", repoUuid, curCommit, parentCommit, (System.currentTimeMillis() - matchProcess) / 1000);
            matchProcess = System.currentTimeMillis();
            // According to rawIssueHash and parentCommit to get the issue uuid corresponding to the rawIssue
            Map<String, String> hash2IssueIdMap = rawIssueDao.getIssueUuidsByRawIssueHashsAndParentCommits(repoUuid,
                    preRawIssues.stream().map(RawIssue::getRawIssueHash).collect(Collectors.toList()), allParentCommits);
            preRawIssues.forEach(rawIssue -> {
                String issueId = hash2IssueIdMap.get(rawIssue.getRawIssueHash());
                if (issueId == null) {
                    log.warn("hash: " + rawIssue.getRawIssueHash() + " is null, commit id: {}, type: {}", rawIssue.getCommitId(), rawIssue.getType());
                    rawIssue.setCommitTime(DateTimeUtil.localToUtc(jGitHelper.getCommitTime(rawIssue.getCommitId())));
                    newIssueList.add(generateOneIssue(rawIssue));
                    newRawIssueList.add(rawIssue);
                } else {
                    rawIssue.setIssueId(issueId);
                }
            });
            log.info("init matcher data[{}], step 1-5:insert issues not found in database for current commit: {} parentCommit: {}, step 1-4 uses {} s", repoUuid, curCommit, parentCommit, (System.currentTimeMillis() - matchProcess) / 1000);
            matchProcess = System.currentTimeMillis();
            insertIssueNotFoundInDataBase(newIssueList, newRawIssueList);
            log.info("init matcher data[{}], step 1-6:current commit: {} parentCommit: {}, step 1-5 uses {} s", repoUuid, curCommit, parentCommit, (System.currentTimeMillis() - matchProcess) / 1000);
            matchProcess = System.currentTimeMillis();
            commitFileMap.put(parentCommit, curFiles);
            parentRawIssuesMap.put(parentCommit, preRawIssues);
            preFile2CurFileMap.put(parentCommit, preFile2CurFile);
            curFile2PreFileMap.put(parentCommit, curFile2PreFile);
        }
        this.fileMap = preFile2CurFileMap;
        log.info("init matcher data[{}] success, uses {} s", repoUuid, (System.currentTimeMillis() - startInit) / 1000);
        return MatcherData.builder()
                .tool(tool)
                .repoUuid(repoUuid)
                .currentCommit(curCommit)
                .analyzer(analyzer)
                .jGitHelper(jGitHelper)
                .commitFileMap(commitFileMap)
                .currentRawIssues(new ArrayList<>(curRawIssueSet))
                .parentRawIssuesMap(parentRawIssuesMap)
                .preFile2CurFileMap(preFile2CurFileMap)
                .curFile2PreFileMap(curFile2PreFileMap)
                .build();
    }

    private void sumUpMatcherData(MatcherData matcherData, MatcherResult matcherResult) {
        this.curAllRawIssues = matcherData.getCurrentRawIssues();
        this.newIssues = matcherResult.getNewIssues();
        this.mappedIssues = matcherResult.getMappedIssues();
        this.solvedIssue = matcherResult.getSolvedIssue();
        this.reopenIssues = matcherResult.getReopenIssues();
        this.parentRawIssuesResult = matcherResult.getParentRawIssuesResult();
        this.ignoreMergeSolvedIssueNum = matcherResult.getIgnoreSolvedMergeIssueNum();
    }

    public List<String> getPreScanSuccessfullyCommit(String repoId, String commitId, JGitHelper jGitHelper, String tool) throws IOException {

        List<IssueScan> scanList = issueScanDao.getIssueScanByRepoIdAndStatusAndTool(repoId, null, tool);
        if (scanList == null || scanList.isEmpty()) {
            return new ArrayList<>(0);
        }

        String[] scannedCommitIds = scanList.stream().map(IssueScan::getCommitId).toArray(String[]::new);

        List<MatcherCommitInfo> parentCommits = new ArrayList<>();
        parentCommits.add(new MatcherCommitInfo(repoId, commitId, jGitHelper.getCommitTime(commitId)));

        Set<String> scannedParents = new HashSet<>(8);
        while (!parentCommits.isEmpty()) {
            MatcherCommitInfo matcherCommitInfo = parentCommits.remove(0);
            String[] parents = jGitHelper.getCommitParents(matcherCommitInfo.getCommitId());

            for (String parent : parents) {
                int index = SearchUtil.dichotomy(scannedCommitIds, parent);
                if (index == -1) {
                    continue;
                }

                if (ScanStatusEnum.DONE.getType().equals(scanList.get(index).getStatus())) {
                    scannedParents.add(parent);
                    continue;
                }
                parentCommits.add(new MatcherCommitInfo(repoId, parent, jGitHelper.getCommitTime(commitId)));
                // Sorted by commit time
                parentCommits = parentCommits.stream().distinct()
                        .sorted(Comparator.comparing(MatcherCommitInfo::getCommitTime)).collect(Collectors.toList());
            }
        }

        List<String> trueParents = removeFakeParent(scannedParents);

        return new ArrayList<>(trueParents);
    }

    public List<String> removeFakeParent(Set<String> scannedParents) throws IOException {
        List<String> list = new ArrayList<>(scannedParents);
        boolean[] fakeParent = new boolean[scannedParents.size()];

        list.sort((o1, o2) -> jGitHelper.getLongCommitTime(o2).compareTo(jGitHelper.getLongCommitTime(o1)));
        for (int i = 0; i < list.size(); i++) {
            if (!fakeParent[i]) {
                for (int j = i + 1; j < list.size(); j++) {
                    if (jGitHelper.isParent(list.get(i), list.get(j))) {
                        fakeParent[j] = true;
                    }
                }
            }
        }

        List<String> trueParents = new ArrayList<>();
        for (int i = 0; i < fakeParent.length; i++) {
            if (!fakeParent[i]) {
                trueParents.add(list.get(i));
            }
        }

        return trueParents;
    }

    private Issue generateOneIssue(RawIssue rawIssue) {
        Issue issue = Issue.valueOf(rawIssue);
        // Ignore the issues that hashes are null
        issue.setManualStatus(IgnoreTypeEnum.IGNORE.getName());
        IssueType issueType = issueTypeMap.get(rawIssue.getType());
        issue.setIssueCategory(issueType == null ? IssuePriorityEnums.getIssueCategory(rawIssue.getTool(), rawIssue.getPriority()) : issueType.getCategory());
        rawIssue.setIssueId(issue.getUuid());
        rawIssue.getMatchInfos().forEach(rawIssueMatchInfo -> rawIssueMatchInfo.setIssueUuid(issue.getUuid()));
        return issue;
    }

    @Transactional(rollbackFor = Exception.class)
    public void insertIssueNotFoundInDataBase(List<Issue> newIssues, List<RawIssue> newRawIssues) {
        issueDao.insertIssueList(newIssues);
        rawIssueDao.insertRawIssueList(newRawIssues);
        List<RawIssueMatchInfo> rawIssueMatchInfos = new ArrayList<>();
        newRawIssues.forEach(rawIssue -> rawIssueMatchInfos.addAll(rawIssue.getMatchInfos()));
        rawIssueMatchInfoDao.insertRawIssueMatchInfoList(rawIssueMatchInfos);
        List<Location> locations = new ArrayList<>();
        newRawIssues.forEach(rawIssue -> locations.addAll(rawIssue.getLocations()));
        locationDao.insertLocationList(locations);
    }

    public void cleanParentRawIssueResult() {
        parentRawIssuesResult.clear();
    }

    @Autowired
    public void setMatcherFactory(MatcherFactory matcherFactory) {
        this.matcherFactory = matcherFactory;
    }

    @Autowired
    public void setIssueScanDao(IssueScanDao issueScanDao) {
        IssueMatcher.issueScanDao = issueScanDao;
    }

    @Autowired
    public void setRawIssueDao(RawIssueDao rawIssueDao) {
        IssueMatcher.rawIssueDao = rawIssueDao;
    }

    @Autowired
    public void setIssueDao(IssueDao issueDao) {
        IssueMatcher.issueDao = issueDao;
    }

    @Autowired
    public void setIssueTypeDao(IssueTypeDao issueTypeDao) {
        IssueMatcher.issueTypeDao = issueTypeDao;
    }

    @Autowired
    public void setRawIssueMatchInfoDao(RawIssueMatchInfoDao rawIssueMatchInfoDao) {
        IssueMatcher.rawIssueMatchInfoDao = rawIssueMatchInfoDao;
    }


    @Autowired
    public void setLocationDao(LocationDao locationDao) {
        IssueMatcher.locationDao = locationDao;
    }

    @Autowired
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }
}
