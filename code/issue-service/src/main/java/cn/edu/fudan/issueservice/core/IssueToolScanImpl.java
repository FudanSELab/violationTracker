package cn.edu.fudan.issueservice.core;

import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.common.scan.AbstractToolScan;
import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.issueservice.component.SonarRest;
import cn.edu.fudan.issueservice.core.analyzer.AnalyzerFactory;
import cn.edu.fudan.issueservice.core.analyzer.BaseAnalyzer;
import cn.edu.fudan.issueservice.core.process.IssueMatcher;
import cn.edu.fudan.issueservice.core.process.IssuePersistenceManager;
import cn.edu.fudan.issueservice.core.process.IssueStatistics;
import cn.edu.fudan.issueservice.core.solved.IssueSolved;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.IssueScan;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueCache;
import cn.edu.fudan.issueservice.domain.enums.ScanStatusEnum;
import cn.edu.fudan.issueservice.domain.enums.ToolEnum;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import cn.edu.fudan.issueservice.util.RawIssueParseUtil;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Scope;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * @author beethoven
 * @author fancying
 * @date 2021-04-25 16:56:35
 */
@Component
@Scope("prototype")
@Slf4j
public class IssueToolScanImpl extends AbstractToolScan {

    /**
     * key for commitId
     * value for status
     */
    private final Map<String, ScanStatusEnum> resourcesStatus = new ConcurrentHashMap<>(16);
    private final Lock lock = new ReentrantLock();
    private final Lock lock1 = new ReentrantLock();
    private final Condition hasResource = lock.newCondition();
    private final Condition resourceReady = lock.newCondition();

    private IssueScanDao issueScanDao;
    private RawIssueCacheDao rawIssueCacheDao;

    private IssueSolved issueSolved;
    private AnalyzerFactory analyzerFactory;
    private IssueMatcher issueMatcher;
    private IssueStatistics issueStatistics;
    private IssuePersistenceManager issuePersistenceManager;

    @Value("${scanThreadNum:3}")
    private int initValue;
    private SonarRest rest;

    @Value("${enable.target.repo.path:true}")
    private boolean enableTargetRepoPath;

    @Async("prepare-resource")
    @Override
    public void prepareForScan() throws IOException {

        String repoUuid = scanData.getRepoUuid();
        BaseAnalyzer analyzer = analyzerFactory.createAnalyzer(scanData.getRepoScan().getTool());

        // Start preparing resources before the scanning
        if (analyzer.closeResourceLoader()) {
            return;
        }

        Thread.currentThread().setName("pr-" + (repoUuid.length() > 7 ? repoUuid.substring(0, 6) : repoUuid));
        log.info("prepare-resource {}", repoUuid);

        AtomicInteger remainingNum = new AtomicInteger(initValue);

        // key repoPath  value valid
        Map<JGitHelper, Boolean> repoResource = new ConcurrentHashMap<>(initValue << 1);

        for (int i = 0; i < initValue; i++) {
            String repoPath;
            if (enableTargetRepoPath) {
                String originalRepoPath = rest.getCodeServiceRepo(repoUuid);
                repoPath = originalRepoPath + "-" + i;
                File destDir = new File(repoPath);
                if (!destDir.exists()) {
                    destDir.mkdirs();
                }
                FileUtils.copyDirectory(new File(originalRepoPath), destDir);
            } else {
                repoPath = rest.getCodeServiceRepo(repoUuid);
            }
            // todo repoPath is null
            JGitHelper jGitHelper = JGitHelper.getInstance(repoPath);
            repoResource.put(jGitHelper, true);
        }

        List<String> commitList = scanData.getToScanCommitList();
        String toolName = analyzer.getToolName();
        CountDownLatch completeFlag = new CountDownLatch(commitList.size());

        lock.lock(); //NOSONAR
        try {
            for (String commit : commitList) {
                // First check whether the database contains a cache
                if (rawIssueCacheDao.cached(repoUuid, commit, toolName)) {
                    log.info("cached {}", commit);
                    completeFlag.countDown();
                    resourcesStatus.put(commit, rawIssueCacheDao.getInvokeResult(repoUuid, commit, toolName) == 1 ? ScanStatusEnum.DONE : ScanStatusEnum.CACHE_FAILED);
                    continue;
                }

                //todo pr waiting
                while (remainingNum.get() == 0) {
                    hasResource.await();
                }
                remainingNum.decrementAndGet();
                resourcesStatus.put(commit, ScanStatusEnum.DOING);
                // Different threads get different instances of ToolAnalyzer, and the results are stored in the resultRawIssues
                WeakReference<BaseAnalyzer> weakSpecificAnalyzer = new WeakReference<>(analyzerFactory.createAnalyzer(scanData.getRepoScan().getTool()));

                Objects.requireNonNull(weakSpecificAnalyzer.get()).
                        produceResource(repoUuid, repoResource, commit, resourcesStatus, remainingNum, completeFlag,
                                lock, hasResource, resourceReady, rawIssueCacheDao, commitList, lock1);
            }
            log.info("begin wait all resource done repoUuid:{}", repoUuid);

            // When the resource is ready, notify other waiting threads
            lock.unlock();

            completeFlag.await();

            lock.lock();
            try {
                hasResource.signalAll();
                resourceReady.signalAll();
            } finally {
                lock.unlock();
            }
        } catch (InterruptedException e) {
            log.error(e.getMessage());
            Thread.currentThread().interrupt();
        } finally {
            if (Thread.holdsLock(lock)) {
                lock.unlock();
            }
            for (JGitHelper jgit : repoResource.keySet()) {
                // fixme icse free nothing
            }
        }
    }

    @Override
    public void prepareForOneScan(String commit) {
        BaseAnalyzer analyzer = analyzerFactory.createAnalyzer(scanData.getRepoScan().getTool());
        // Start preparing resources before the scanning
        if (analyzer.closeResourceLoader()) {
            return;
        }
        log.info("begin prepare {}", commit);
        lock.lock();
        try {
            // Wait for the resources to be prepared
            while (!resourcesStatus.containsKey(commit) ||
                    resourcesStatus.get(commit).equals(ScanStatusEnum.DOING)) {
                log.info("begin wait resource commit:{}", commit);

                resourceReady.await();

                log.info("end wait resource commit:{}", commit);
            }
        } catch (InterruptedException e) {
            log.error(e.getMessage());
            Thread.currentThread().interrupt();
        } finally {
            lock.unlock();
        }
    }

    @Override
    public boolean scanOneCommit(String commit) {

        log.info("start scan  commit id --> {}", commit);

        try {
            JGitHelper jGitHelper = JGitHelper.getInstance(scanData.getRepoPath());
            BaseAnalyzer analyzer = analyzerFactory.createAnalyzer(scanData.getRepoScan().getTool());

            //1 init IssueScan
            Date commitTime = jGitHelper.getCommitDateTime(commit);
            Date authorTime = jGitHelper.getAuthorDate(commit);
            List<String> parentCommits = new ArrayList<>(Arrays.asList(jGitHelper.getCommitParents(commit)));
            log.info("current commit: {}, parent commits: {}", commit, parentCommits);
            String developer = jGitHelper.getAuthorName(commit);
            IssueScan issueScan = IssueScan.initIssueScan(scanData.getRepoUuid(), commit, scanData.getRepoScan().getTool(),
                    commitTime, authorTime, Arrays.toString(parentCommits.toArray()), developer);
            RawIssueCache rawIssueCache = RawIssueCache.init(scanData.getRepoUuid(), commit, scanData.getRepoScan().getTool());

            //2 checkout
            if (!jGitHelper.checkout(commit)){
                log.error("checkout failed! skip the commit [{}]", commit);
                return false;
            }

            //3 execute scan
            scan(rawIssueCache, issueScan, scanData.getRepoPath(), analyzer);

            //4 update issue scan end time and persistence
            issueScan.setEndTime(new Date());
            boolean scanPersistenceResult = afterOneCommitScanPersist(issueScan, rawIssueCache);

            String scanPersistenceStatus = "success";
            if (!scanPersistenceResult) {
                scanPersistenceStatus = "failed";
            }
            log.info("issue scan result  persist {}! commit id --> {}", scanPersistenceStatus, commit);
            // todo If persistence fails due to the unavailability of the mongod service, the scan is aborted

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }

        return true;
    }

    private boolean afterOneCommitScanPersist(IssueScan issueScan, RawIssueCache rawIssueCache) {
        try {
            issueScanDao.insertOneIssueScan(issueScan);
            rawIssueCacheDao.insertIssueAnalyzer(rawIssueCache);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
        return true;
    }

    public void scan(RawIssueCache rawIssueCache, IssueScan issueScan, String repoPath, BaseAnalyzer analyzer) throws InterruptedException {
        JGitHelper jGitHelper = JGitHelper.getInstance(repoPath);
        String repoUuid = issueScan.getRepoUuid();
        String commit = issueScan.getCommitId();

        JSONObject analyzeCache = rawIssueCacheDao.getAnalyzeResultByRepoUuidCommitIdTool(repoUuid, commit, analyzer.getToolName());
        boolean cached = rawIssueCacheDao.cached(repoUuid, commit, analyzer.getToolName());

        List<RawIssue> rawIssues;

        //0 analyze before

        // 4 cases

        if (!cached) {
            if (!resourceLoadStatus(repoUuid, repoPath, commit, issueScan, analyzer, rawIssueCache)) {
                // a. There is no caching and preparing the resource (tool call) fails
                return;
            }
            // b. There is no cache, but the resource is successfully prepared
            rawIssues = rawIssueCache.getRawIssueList();
        } else if (analyzeCache != null) {
            // c. There is a cache and the resource was previously prepared successfully
            log.info("analyze raw issues in this commit:{} before, go ahead to mapping issue!", commit);
            rawIssues = RawIssueParseUtil.json2RawIssues(analyzeCache);
            rawIssueCache.updateIssueAnalyzeStatus(rawIssues);
        } else {
            // d. There is a cache, but previously preparing resources failed
            return;
        }
        log.info("analyze raw issues success!");

        rawIssueCache.updateIssueAnalyzeStatus(rawIssues);

        analyzer.getIsTotalScanMap().remove(analyzer.generateUniqueProjectKey(repoUuid, commit));

        //4 issue match
        long matchStartTime = System.currentTimeMillis();
        issueMatcher.setAnalyzer(analyzer);
        boolean matchResult = issueMatcher.matchProcess(repoUuid, commit, jGitHelper, analyzer.getToolName(), rawIssues);
        if (!matchResult) {
            log.error("issue match failed!repo path is {}, commit is {}", repoPath, commit);
            issueScan.setStatus(ScanStatusEnum.MATCH_FAILED.getType());
            return;
        }
        long matchTime = System.currentTimeMillis();
        log.info("issue match use {} s,match success!", (matchTime - matchStartTime) / 1000);

        //5 issue statistics
        initIssueStatistics(commit, analyzer, jGitHelper);
        boolean statisticalResult = issueStatistics.doingStatisticalAnalysis(issueMatcher, repoUuid, analyzer.getToolName());
        if (!statisticalResult) {
            log.error("statistical failed!repo path is {}, commit is {}", repoPath, commit);
            issueScan.setStatus(ScanStatusEnum.STATISTICAL_FAILED.getType());
            return;
        }
        long issueStatisticsTime = System.currentTimeMillis();
        log.info("issue statistics use {} s,issue statistics success!", (issueStatisticsTime - matchTime) / 1000);

        //6 issue merge
//        long issueMergeTime = System.currentTimeMillis();
//        if(rawIssueCacheDao.getIsTotalScan(repoUuid, commit, analyzer.getToolName()) == 1){
//            boolean mergeResult = issueMergeManager.issueMerge(issueStatistics, repoUuid);
//            if (!mergeResult) {
//                log.error("merge failed!repo path is {}, commit is {}", repoPath, commit);
//                return;
//            }
//        }
//        log.info("issue merge use {} s,issue merged!", (System.currentTimeMillis() - issueMergeTime) / 1000);

        //7 issue persistence
        try {
            issuePersistenceManager.persistScanData(issueStatistics, repoUuid);
        } catch (Exception e) {
            e.printStackTrace();
            log.error("persist failed!repo path is {}, commit is {}", repoPath, commit);
            issueScan.setStatus(ScanStatusEnum.STATISTICAL_FAILED.getType());
            return;
        }
        log.info("issue persistence use {} s,issue persistence!", (System.currentTimeMillis() - issueStatisticsTime) / 1000);

        issueScan.setStatus(ScanStatusEnum.DONE.getType());
    }


    /**
     * load resources
     */
    private boolean resourceLoadStatus(String repoUuid, String repoPath, String commit,
                                       IssueScan issueScan, BaseAnalyzer toolAnalyzer, RawIssueCache rawIssueCache) {

        JGitHelper jGitHelper = JGitHelper.getInstance(repoPath);
        if (!resourcesStatus.containsKey(commit)) {
            ScanStatusEnum scanStatusEnum = ScanStatusEnum.CHECKOUT_FAILED;
            if (jGitHelper.checkout(commit)) {
                // Determine whether it is a total scan or an incremental scan based on whether its parent has been scanned
                String scanRepoPath = repoPath;
                try {
                    scanRepoPath = toolAnalyzer.getScanRepoPath(repoUuid, commit, jGitHelper, rawIssueCacheDao, scanData.getToScanCommitList());
                    log.info("scan repo path: {}", scanRepoPath);
                } catch (IOException e) {
                    log.error("getScanRepoPath error {}", e.getMessage());
                }
                TwoValue<ScanStatusEnum, List<RawIssue>> scanResult = toolAnalyzer.invokeAndAnalyze(scanRepoPath, repoUuid, commit, repoPath);
                scanStatusEnum = scanResult.getFirst();
                List<RawIssue> rawIssues = scanResult.getSecond();
                boolean isTotalScan = toolAnalyzer.isTotalScan(toolAnalyzer.generateUniqueProjectKey(repoUuid, commit));


                issueScan.setStatus(scanStatusEnum.getType());
                if (scanStatusEnum.equals(ScanStatusEnum.DONE)) {
                    rawIssueCache.updateIssueAnalyzeStatus(rawIssues);
                    rawIssueCache.setIsTotalScan(isTotalScan ? 1 : 0);
                    rawIssueCacheDao.insertIssueAnalyzer(rawIssueCache);
                } else {
                    rawIssueCache.setInvokeResult(RawIssueCache.InvokeResult.FAILED.getStatus());
                    return false;
                }
            }
            rawIssueCache.setInvokeResult(RawIssueCache.InvokeResult.FAILED.getStatus());
            issueScan.setStatus(scanStatusEnum.getType());
            log.error("checkout failed repo Path is {}", jGitHelper.getRepoPath());
            return false;
        } else {
            ScanStatusEnum scanStatusEnum = resourcesStatus.get(commit);
            issueScan.setStatus(scanStatusEnum.getType());
            resourcesStatus.remove(commit);
            return scanStatusEnum.equals(ScanStatusEnum.DONE);
        }
    }

    private void initIssueStatistics(String commit, BaseAnalyzer analyzer, JGitHelper jGitHelper) {
        issueStatistics.setCommitId(commit);
        issueStatistics.setCurrentCommitDate(DateTimeUtil.localToUtc(jGitHelper.getCommitTime(commit)));
        issueStatistics.setJGitHelper(jGitHelper);
    }

    @Override
    public void cleanUpForOneScan(String commit) {
        log.info("start to clean up buffer after one commit: {}", commit);
        issueMatcher.cleanParentRawIssueResult();
        issueStatistics.cleanRawIssueUuid2DataBaseUuid();
        // release JGit resources
//        JGitHelper.release(scanData.getRepoPath());
    }

    @Override
    public void cleanUpForScan() {

        if (!ToolEnum.SONAR.getType().equals(scanData.getRepoScan().getTool())) {
            return;
        }

        String repoUuid = scanData.getRepoUuid();
        String repoPath = scanData.getRepoPath();
        boolean needNotNullSolveWay = scanData.isInitialScan();
        issueSolved.updateSolvedWay(repoUuid, repoPath, needNotNullSolveWay);

        log.info("judgeSolvedType repo {} done", repoUuid);
    }

    @Autowired
    public void setIssueSolved(IssueSolved issueSolved) {
        this.issueSolved = issueSolved;
    }

    @Autowired
    public void setAnalyzerFactory(AnalyzerFactory analyzerFactory) {
        this.analyzerFactory = analyzerFactory;
    }

    @Autowired
    public void setIssueScanDao(IssueScanDao issueScanDao) {
        this.issueScanDao = issueScanDao;
    }


    @Autowired
    public void setIssueMatcher(IssueMatcher issueMatcher) {
        this.issueMatcher = issueMatcher;
    }

    @Autowired
    public void setIssueStatistics(IssueStatistics issueStatistics) {
        this.issueStatistics = issueStatistics;
    }

    @Autowired
    public void setIssuePersistenceManager(IssuePersistenceManager issuePersistenceManager) {
        this.issuePersistenceManager = issuePersistenceManager;
    }

    @Autowired
    public void setIssueAnalyzerDao(RawIssueCacheDao rawIssueCacheDao) {
        this.rawIssueCacheDao = rawIssueCacheDao;
    }

    @Autowired
    public void setRest(SonarRest rest) {
        this.rest = rest;
    }



}
