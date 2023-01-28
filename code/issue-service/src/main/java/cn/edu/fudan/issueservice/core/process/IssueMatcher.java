package cn.edu.fudan.issueservice.core.process;

import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.issueservice.core.analyzer.BaseAnalyzer;
import cn.edu.fudan.issueservice.core.matcher.Matcher;
import cn.edu.fudan.issueservice.core.matcher.MatcherFactory;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.IssueScan;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dto.MatcherCommitInfo;
import cn.edu.fudan.issueservice.domain.dto.MatcherData;
import cn.edu.fudan.issueservice.domain.dto.MatcherResult;
import cn.edu.fudan.issueservice.domain.enums.CommitStatusEnum;
import cn.edu.fudan.issueservice.domain.enums.ScanStatusEnum;
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

    /**
     * des: @key parentCommitId   @value 与curCommit 映射后
     * 有 RawIssueMatchInfo 的需要入库
     * 入库 solved情况
     * matchInfoResult RawIssue 中不空都需要入库
     **/
    @Getter
    private Map<String, List<RawIssue>> parentRawIssuesResult = new HashMap<>(4);

    /**
     * 需要在rawIssue location matchInfoResult
     * rawIssue中新增的是 1 所有matchInfo中status都为 change 的情况 2 rawIssue 有改变的情况 （ {@link RawIssue#isNotChange}  为 false）
     * 【todo 目前只要文件变了就算rawIssue变了】
     * matchInfoResult RawIssue 中不空都需要入库 【入库 add change mergeSolved 情况】
     **/
    @Getter
    private List<RawIssue> curAllRawIssues;

    /**
     * des: @key issue uuid   @value issue 存放 mapped issue
     * <p>
     * 用于更新issue表
     **/
    @Getter
    private Map<String, Issue> mappedIssues;

    /**
     * des: @key issue uuid   @value issue 存放 reopen issue
     * <p>
     * 用于更新issue表
     **/
    @Getter
    private Map<String, Issue> reopenIssues;


    /**
     * des: @key issue uuid   @value issue 存放新增的issue列表
     * 需要在issue 表新增记录
     **/
    @Getter
    private Map<String, Issue> newIssues = new HashMap<>(0);

    /**
     * des: @key issue uuid   @value issue 存放新增的issue列表
     * 需要在issue 表 更新记录
     **/
    @Getter
    private Map<String, Issue> solvedIssue;

    private Map<String, Map<String, String>> fileMap = new HashMap<>();

    private ApplicationContext applicationContext;

    public boolean matchProcess(String repoUuid, String curCommit, JGitHelper jGitHelper, String tool, List<RawIssue> parentAndCurRawIssues) {
        try {
            // checkout 当前 commit
            this.jGitHelper = jGitHelper;
            jGitHelper.checkout(curCommit);

            // 获取成功扫描的 parent commits 并初始化 matcher data
            List<String> parentCommits = getPreScanSuccessfullyCommit(repoUuid, curCommit, jGitHelper, tool);
            //准备匹配需要的各项数据
            MatcherData matcherData = initMatcherData(repoUuid, curCommit, jGitHelper, tool, parentAndCurRawIssues, parentCommits);

            // 当前 commit 是 first normal or merge
            CommitStatusEnum commitStatusEnum = CommitStatusEnum.FIRST;
            if (!parentCommits.isEmpty()) {
                commitStatusEnum = parentCommits.size() > 1 ? CommitStatusEnum.MERGE : CommitStatusEnum.NORMAL;
            }

            // 获取 Matcher 并匹配
            Matcher matcher = matcherFactory.createMatcher(commitStatusEnum, matcherData);
            matcher.init(logHome, issueDao, issueTypeDao, rawIssueDao, rawIssueMatchInfoDao);
            MatcherResult matcherResult = matcher.matchRawIssues();

            // 整理 matcher data
            sumUpMatcherData(matcherData, matcherResult);
        } catch (Exception e) {
            log.error("match throw exception, check the code");
            e.printStackTrace();
            return false;
        }

        return true;
    }

    private MatcherData initMatcherData(String repoUuid, String curCommit, JGitHelper jGitHelper, String tool, List<RawIssue> parentAndCurRawIssues, List<String> parentCommits) {
        log.info("start init matcher data for current commit: {}", curCommit);
        Set<RawIssue> curRawIssueSet = new HashSet<>();
        Map<String, List<String>> commitFileMap = new HashMap<>(8);
        Map<String, List<RawIssue>> parentRawIssuesMap = new HashMap<>(8);
        Map<String, Map<String, String>> preFile2CurFileMap = new HashMap<>(8);
        Map<String, Map<String, String>> curFile2PreFileMap = new HashMap<>(8);

        Map<String, List<RawIssue>> commitToRawIssues = parentAndCurRawIssues.stream().collect(Collectors.groupingBy(RawIssue::getCommitId));

        List<RawIssue> curRawIssues = commitToRawIssues.getOrDefault(curCommit, new ArrayList<>());

//        curRawIssueSet.addAll(curRawIssues);
        if (parentCommits.isEmpty()) {
            curRawIssueSet.addAll(curRawIssues);
        }

        for (String parentCommit : parentCommits) {
            Map<String, String> preFile2CurFile = new HashMap<>(16);
            Map<String, String> curFile2PreFile = new HashMap<>(16);

            // 获取有 diff 的文件
            List<String> diffFiles = jGitHelper.getDiffFilePair(parentCommit, curCommit, preFile2CurFile, curFile2PreFile);

            // 处理 diff 文件名
            var delimiter = ",";
            List<String> preFiles = diffFiles.stream().filter(d -> !d.startsWith(delimiter)).map(f -> Arrays.asList(f.split(delimiter)).get(0)).collect(Collectors.toList());
            List<String> curFiles = diffFiles.stream().filter(d -> !d.endsWith(delimiter)).map(f -> Arrays.asList(f.split(delimiter)).get(1)).collect(Collectors.toList());

            // 文件过滤
            curFiles = curFiles.stream().filter(file -> !FileFilter.fileFilter(tool, file)).collect(Collectors.toList());

            preFiles = preFiles.stream().filter(file -> !FileFilter.fileFilter(tool, file)).collect(Collectors.toList());
            List<String> finalCurFiles = curFiles;
            curRawIssueSet.addAll(curRawIssues.stream().filter(rawIssue -> finalCurFiles.contains(rawIssue.getFileName())).collect(Collectors.toList()));

            List<RawIssue> preRawIssues = commitToRawIssues.getOrDefault(parentCommit, new ArrayList<>());
            List<String> preCommitsForParent = jGitHelper.getAllCommitParents(parentCommit);

            List<String> finalPreFiles = preFiles;
            preRawIssues = preRawIssues.stream().filter(rawIssue -> finalPreFiles.contains(rawIssue.getFileName())).collect(Collectors.toList());
            //根据rawIssueHash及parentCommit去找该rawIssue对应的issue uuid
            preRawIssues.forEach(rawIssue -> {
                String issueId = rawIssueDao.getIssueUuidByRawIssueHashAndParentCommits(repoUuid, rawIssue.getRawIssueHash(), preCommitsForParent);
                if (issueId == null) {
                    log.warn("hash: " + rawIssue.getRawIssueHash() + " is null, commit id: {}, type: {}", rawIssue.getCommitId(), rawIssue.getType());
                }
                rawIssue.setIssueId(issueId);
            });

            commitFileMap.put(parentCommit, curFiles);
            parentRawIssuesMap.put(parentCommit, preRawIssues);
            preFile2CurFileMap.put(parentCommit, preFile2CurFile);
            curFile2PreFileMap.put(parentCommit, curFile2PreFile);
        }
        this.fileMap = preFile2CurFileMap;
        log.info("init matcher data success!");
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
                // parentCommits 根据时间由远及近排序 第一个是时间最小的
                parentCommits = parentCommits.stream().distinct()
                        .sorted(Comparator.comparing(MatcherCommitInfo::getCommitTime)).collect(Collectors.toList());
            }
        }

        // 移除含有父子关系的父parent
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

    public void cleanParentRawIssueResult() {
        parentRawIssuesResult.clear();
    }

    @Autowired
    public void setMatcherFactory(MatcherFactory matcherFactory) {
        this.matcherFactory = matcherFactory;
    }

    @Autowired
    public void setIssueScanDao(IssueScanDao issueScanDao) {
        this.issueScanDao = issueScanDao;
    }

    @Autowired
    public void setRawIssueDao(RawIssueDao rawIssueDao) {
        this.rawIssueDao = rawIssueDao;
    }

    @Autowired
    public void setIssueDao(IssueDao issueDao) {
        this.issueDao = issueDao;
    }

    @Autowired
    public void setIssueTypeDao(IssueTypeDao issueTypeDao) {
        this.issueTypeDao = issueTypeDao;
    }

    @Autowired
    public void setRawIssueMatchInfoDao(RawIssueMatchInfoDao rawIssueMatchInfoDao) {
        this.rawIssueMatchInfoDao = rawIssueMatchInfoDao;
    }



    @Autowired
    public void setLocationDao(LocationDao locationDao) {
        this.locationDao = locationDao;
    }

    @Autowired
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }
}
