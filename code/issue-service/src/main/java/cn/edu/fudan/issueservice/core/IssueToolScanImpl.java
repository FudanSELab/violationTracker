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

        // 初次扫描才启用并行资源准备 扫描之前就开始准备资源
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
                // 先检擦数据库中是否含有缓存
                if (rawIssueCacheDao.cached(repoUuid, commit, toolName)) {
                    log.info("cached {}", commit);
                    completeFlag.countDown();
                    resourcesStatus.put(commit, rawIssueCacheDao.getInvokeResult(repoUuid, commit, toolName) == 1 ? ScanStatusEnum.DONE : ScanStatusEnum.CACHE_FAILED);
                    continue;
                }

                //todo pr 等待
                while (remainingNum.get() == 0) {
                    hasResource.await();
                }
                remainingNum.decrementAndGet();
                resourcesStatus.put(commit, ScanStatusEnum.DOING);
                // 不同的线程拿到不同的 ToolAnalyzer 实例 结果存储在实例的 resultRawIssues 中
                WeakReference<BaseAnalyzer> weakSpecificAnalyzer = new WeakReference<>(analyzerFactory.createAnalyzer(scanData.getRepoScan().getTool()));

                Objects.requireNonNull(weakSpecificAnalyzer.get()).
                        produceResource(repoUuid, repoResource, commit, resourcesStatus, remainingNum, completeFlag,
                                lock, hasResource, resourceReady, rawIssueCacheDao, commitList, lock1);
            }
            log.info("begin wait all resource done repoUuid:{}", repoUuid);

            // 所有做完通知 资源准备完成 通知其他等待线程
            lock.unlock();

            // 等待 produce 线程执行完毕
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
        // 初次扫描才启用并行资源准备 扫描之前就开始准备资源
        if (analyzer.closeResourceLoader()) {
            return;
        }
        log.info("begin prepare {}", commit);
        lock.lock();
        try {
            // 等待 prepare 线程产生资源
            while (!resourcesStatus.containsKey(commit) ||
                    resourcesStatus.get(commit).equals(ScanStatusEnum.DOING)) {
                log.info("begin wait resource commit:{}", commit);

                //todo tscancode waiting 发了请求但一直在等待
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
            List<String> parentCommits = new ArrayList<>();
            for (String commitParent : jGitHelper.getCommitParents(commit)) {
                if (scanData.getToScanCommitList().contains(commitParent)) {
                    parentCommits.add(commitParent);
                }
            }
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
            // todo 由于 mongod 服务不可用导致持久化失败，则中止扫描

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
//        boolean prepareSuccess = resourceLoadStatus(repoUuid, repoPath, commit, issueScan, analyzer, rawIssueCache);

        List<RawIssue> rawIssues;

        //0 analyze before

        // 总共四种情况

        if (!cached) {
            if (!resourceLoadStatus(repoUuid, repoPath, commit, issueScan, analyzer, rawIssueCache)) {
                // 跳过的情况 a 没有缓存并且现在资源准备(工具调用)失败
                return;
            }
            // b 没有缓存，资源准备成功
            rawIssues = rawIssueCache.getRawIssueList();
        } else if (analyzeCache != null) {
            // c 有缓存且以前资源准备成功
            log.info("analyze raw issues in this commit:{} before, go ahead to mapping issue!", commit);
            rawIssues = RawIssueParseUtil.json2RawIssues(analyzeCache);
            rawIssueCache.updateIssueAnalyzeStatus(rawIssues);
        } else {
            // 跳过的情况 d 有缓存但是以前资源准备失败
            return;
        }
        log.info("analyze raw issues success!");

        // d 有缓存且现在资源准备成功
        rawIssueCache.updateIssueAnalyzeStatus(rawIssues);

        // 这之后没有再判断isTotalScan，可以释放内存
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
//        // 全部扫描的commit才可能出现issue合并的情况
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
     * 加载资源 准备 rawIssue
     */
    private boolean resourceLoadStatus(String repoUuid, String repoPath, String commit,
                                       IssueScan issueScan, BaseAnalyzer toolAnalyzer, RawIssueCache rawIssueCache) {

        JGitHelper jGitHelper = JGitHelper.getInstance(repoPath);
        if (!resourcesStatus.containsKey(commit)) {
            ScanStatusEnum scanStatusEnum = ScanStatusEnum.CHECKOUT_FAILED;
            if (jGitHelper.checkout(commit)) {
                // 根据其parent是否被扫描过确定是全量扫描还是增量扫描
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
        // 释放 JGit 资源
//        JGitHelper.release(scanData.getRepoPath());
    }

    @Override
    public void cleanUpForScan() {

        if (!ToolEnum.SONAR.getType().equals(scanData.getRepoScan().getTool())) {
            return;
        }

        // 处理 solved 情况
        String repoUuid = scanData.getRepoUuid();
        String repoPath = scanData.getRepoPath();
        boolean needNotNullSolveWay = scanData.isInitialScan();
        // 第一次扫描全部分析 solve way
        // 第二次扫描 只检查solved way 为 null 的情况
        issueSolved.updateSolvedWay(repoUuid, repoPath, true);

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
