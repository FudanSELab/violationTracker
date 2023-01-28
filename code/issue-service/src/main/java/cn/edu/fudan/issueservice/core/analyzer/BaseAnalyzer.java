package cn.edu.fudan.issueservice.core.analyzer;

import cn.edu.fudan.common.jgit.DiffFile;
import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.issueservice.dao.RawIssueCacheDao;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueCache;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.enums.ScanStatusEnum;
import cn.edu.fudan.issueservice.util.DeveloperUniqueNameUtil;
import cn.edu.fudan.issueservice.util.FileUtil;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.stream.Collectors;

/**
 * description: 工具具体的执行流程
 *
 * @author fancying
 * create: 2020-05-20 15:53
 **/
@Getter
@Setter
@NoArgsConstructor
@Slf4j
public abstract class BaseAnalyzer {


    protected static final String FILE_SEPARATOR = "/";
    /**
     * Address prefix length
     * the length of {commit}/
     */
    protected static final int PREFIX_LENGTH = 41;
    protected static final int COMMIT_LENGTH = 40;

    /**
     * the absolute path directory of script, ending with File.separator, such as /home/bin/
     */
    @Value("${binHome}")
    protected String binHome;

    @Value("${copyTempRepoPath}")
    protected String copyTempRepoPath;

    @Value("${pidFile}")
    protected String pidFile;

    // protected boolean isTotalScan = false;

    /**
     * key repoUuid + commitId
     */
    static final Map<String, Boolean> IS_TOTAL_SCAN_MAP = new ConcurrentHashMap<>(1000);

    public boolean isTotalScan(String key) {
        return IS_TOTAL_SCAN_MAP.getOrDefault(key, false);
    }

    public Map<String, Boolean> getIsTotalScanMap() {
        return IS_TOTAL_SCAN_MAP;
    }

    public String generateUniqueProjectKey(String repoUuid, String commit) {
        return repoUuid + "_" + commit;
    }

    @Value("${debugMode}")
    protected boolean debugMode;
    @Value("${wholeProcessTest:false}")
    protected boolean wholeProcessTest;

    /**
     * Call ASAT scan
     *
     * @param repoUuid     the unique identification of repository
     * @param scanRepoPath Incremental analysis: The directory does not include the .git and is used to store changing
     *                     files; * Full analysis: The directory containing the .git file
     * @param commit       The version needed to be analyze
     * @return Whether the ASAT is called successfully
     */
    protected abstract boolean invoke(String repoUuid, String scanRepoPath, String commit);

    /**
     * Analyze rawIssues after the tool scan is successful
     *
     * @param scanRepoPath Returns the directory of the file to be analyzed by ASAT *
     *                     Incremental analysis: The directory does not include the .git and is used to store changing
     *                     files; * Full analysis: The directory containing the .git file
     * @param repoUuid     repoUuid
     * @param commit       commitId
     * @return null Represents parsing failure
     */
    protected abstract List<RawIssue> analyze(String scanRepoPath, String repoUuid, String commit);

    /**
     * 返回工具名
     *
     * @return 工具名
     */
    public abstract String getToolName();

    /**
     * 返回该缺陷的优先级
     *
     * @param rawIssue rawIssue
     * @return 缺陷优先级
     */
    public abstract Integer getPriorityByRawIssue(RawIssue rawIssue);

    /**
     * 根据文件名获取文件中的方法 变量 以及 类名
     *
     * @param absoluteFilePath 绝对文件路径
     * @return methods and fields
     */
    public abstract Set<String> getMethodsAndFieldsInFile(String absoluteFilePath) throws IOException;

    /**
     * @param repoUuid        repoUuid
     * @param repoResource    key for JGitHelper value for resource
     * @param commit          commit
     * @param resourcesStatus
     * @param remainingNum
     * @param completeFlag
     * @param lock
     * @param hasResource
     * @param resourceReady
     */
    @Async("produce-resource")
    public void produceResource(String repoUuid, Map<JGitHelper, Boolean> repoResource, String commit, Map<String, ScanStatusEnum> resourcesStatus,
                                AtomicInteger remainingNum, CountDownLatch completeFlag, Lock lock, Condition hasResource, Condition resourceReady,
                                RawIssueCacheDao rawIssueCacheDao, List<String> commitList, Lock lock1) {
        Thread.currentThread().setName("prc-" + commit.substring(0, 6));
        log.info("1: begin prepare resource repoUuid:{} commit:{}", repoUuid, commit);
        JGitHelper jGitHelper = null;

        lock1.lock();
        try {
            for (Map.Entry<JGitHelper, Boolean> jgitEntry : repoResource.entrySet()) {
                if (Boolean.TRUE.equals(jgitEntry.getValue())) {
                    jGitHelper = jgitEntry.getKey();
                    repoResource.put(jgitEntry.getKey(), false);
                    break;
                }
            }
        } finally {
            lock1.unlock();
        }


        // checkout and invoke
        assert jGitHelper != null;

        ScanStatusEnum scanStatusEnum = ScanStatusEnum.CHECKOUT_FAILED;
        List<RawIssue> rawIssues = Collections.emptyList();
        //todo 并发情况下此处可能报NLP ?
        if (jGitHelper.checkout(commit)) {
            String scanRepoPath = jGitHelper.getRepoPath();

            // 根据其parent是否被扫描过确定是全量扫描还是增量扫描
            try {
                scanRepoPath = getScanRepoPath(repoUuid, commit, jGitHelper, rawIssueCacheDao, commitList);
                log.info("scan repo path: {}", scanRepoPath);
            } catch (IOException e) {
                e.printStackTrace();
            }
            TwoValue<ScanStatusEnum, List<RawIssue>> scanResult = invokeAndAnalyze(scanRepoPath, repoUuid, commit, jGitHelper.getRepoPath());
            scanStatusEnum = scanResult.getFirst();
            rawIssues = scanResult.getSecond();
        }
        // todo invoke tool failed 后是否继续扫描
        completeFlag.countDown();
        log.info("2: prepare resource result: {}! repoUuid:{} commit:{}", scanStatusEnum.getType(), repoUuid, commit);

        // 存储资源在数据库中 缓解内存压力 但是会增加查询开销
        RawIssueCache rawIssueCache = RawIssueCache.init(repoUuid, commit, getToolName());

        log.info("init issueAnalyzer success, begin set status");

        //编译失败的commit，用sonar仍旧可能会有数据得出，所以当编译失败的时候需要传入空数组
        if (!ScanStatusEnum.DONE.equals(scanStatusEnum)) {
            rawIssueCache.updateIssueAnalyzeStatus(new ArrayList<>());
            rawIssueCache.setInvokeResult(RawIssueCache.InvokeResult.FAILED.getStatus());
        } else {
            rawIssueCache.updateIssueAnalyzeStatus(rawIssues);
            rawIssueCache.setInvokeResult(RawIssueCache.InvokeResult.SUCCESS.getStatus());
            rawIssueCache.setIsTotalScan(isTotalScan(generateUniqueProjectKey(repoUuid, commit)) ? 1 : 0);
        }

        log.info("set status success, begin insert issueAnalyzer");

        rawIssueCacheDao.insertIssueAnalyzer(rawIssueCache);
        log.info("3: insert done ! repoUuid:{} commit:{}", repoUuid, commit);

        // 资源准备完成 改变状态
        resourcesStatus.put(commit, scanStatusEnum);
        repoResource.put(jGitHelper, true);
        remainingNum.addAndGet(1);
        log.info("4: resource change Done! repoUuid:{} commit:{}", repoUuid, commit);

        // 资源准备完成一个 通知其他等待线程
        lock.lock();
        try {
            hasResource.signal();
            resourceReady.signalAll();
        } finally {
            lock.unlock();
        }
        log.info("5: signal Done! repoUuid:{} commit:{}", repoUuid, commit);
    }

    /**
     * @param scanRepoPath the directory of the file to be analyzed by ASAT
     * @param repoUuid
     * @param commit
     * @param repoPath
     * @return First is ScanStatusEnum; Second is rawIssues (Incremental scans contain curCommit and preCommit violations)
     */
    public TwoValue<ScanStatusEnum, List<RawIssue>> invokeAndAnalyze(String scanRepoPath, String repoUuid, String commit, String repoPath) {
        //1 invoke tool
        long invokeToolStartTime = System.currentTimeMillis();
        boolean invokeToolResult = invoke(repoUuid, scanRepoPath, commit);
        if (!invokeToolResult) {
            log.info("invoke tool failed!repo path is {}, commit is {}", scanRepoPath, commit);
            return new TwoValue<>(ScanStatusEnum.INVOKE_TOOL_FAILED, Collections.emptyList());
        }

        long invokeToolTime = System.currentTimeMillis();
        log.info("invoke tool use {} s,invoke tool success!", (invokeToolTime - invokeToolStartTime) / 1000);

        //2 analyze raw issues
        List<RawIssue> rawIssues = analyze(scanRepoPath, repoUuid, commit);
        if (rawIssues == null) {
            log.error("analyze raw issues failed!repo path is {}, commit is {}", scanRepoPath, commit);
            return new TwoValue<>(ScanStatusEnum.ANALYZE_FAILED, Collections.emptyList());
        }

        long analyzeToolTime = System.currentTimeMillis();
        log.info("analyze raw issues use {} s, analyze success!", (analyzeToolTime - invokeToolTime) / 1000);


        // todo 解析完成后设置对应聚合人员  暂时耦合在 工具调用和解析中  应该放到追溯之后做
        Map<String, List<RawIssue>> commit2Issues = rawIssues.parallelStream().collect(Collectors.groupingBy(RawIssue::getCommitId));
        for (Map.Entry<String, List<RawIssue>> entry : commit2Issues.entrySet()) {
            String developerUniqueName = DeveloperUniqueNameUtil.getDeveloperUniqueName(repoPath, entry.getKey(), repoUuid);
            entry.getValue().forEach(r -> r.setDeveloperName(developerUniqueName));
        }

        String key = generateUniqueProjectKey(repoUuid, commit);
        //增量扫描完成后删除复制的文件
        if (!isTotalScan(key) && !debugMode) {
            //todo
            deleteCopyFiles(scanRepoPath);
        }

        return new TwoValue<>(ScanStatusEnum.DONE, rawIssues);

    }

    /**
     * 开启资源提前准备
     *
     * @return 是否开启资源提前准备
     */
    public boolean closeResourceLoader() {
        return false;
    }

    /**
     * @return scanRepoPath  Returns the directory of the file to be analyzed by ASAT
     * Incremental analysis: The directory does not include the .git and  is used to store changing files;
     * Full analysis: The directory containing the .git file
     */
    public String getScanRepoPath(String repoUuid, String curCommit, JGitHelper jGitHelper, RawIssueCacheDao rawIssueCacheDao, List<String> commitList) throws IOException {
        String[] commitParents = jGitHelper.getCommitParents(curCommit);
        String toolName = getToolName();

        boolean isTotalScan = commitParents.length == 0;
        // 如果扫描列表并且cache中不存在parent 才是全量扫描
        for (String commitParent : commitParents) {
            if (!commitList.contains(commitParent) && !rawIssueCacheDao.cached(repoUuid, commitParent, toolName)) {
                isTotalScan = true;
                break;
            }
        }
        IS_TOTAL_SCAN_MAP.put(generateUniqueProjectKey(repoUuid, curCommit), isTotalScan);

        if (isTotalScan) {
            return jGitHelper.getRepoPath();
        }
        // copyTempRepoPath / repoUuid / curCommit
        String targetRepoDir = copyTempRepoPath + FILE_SEPARATOR + repoUuid + FILE_SEPARATOR + curCommit;

        Set<String> curFiles = new HashSet<>();
        // copyTempRepoPath / repoUuid / curCommit / commitParent /
        for (String commitParent : commitParents) {
            String parentBaseDir = targetRepoDir + FILE_SEPARATOR + commitParent + FILE_SEPARATOR;

            if (new File(parentBaseDir).exists()) {
                log.info("delete temp files");
                deleteCopyFiles(parentBaseDir);
            }
            // If the folder creation fails, the full scan is needed
            if (!new File(parentBaseDir).mkdirs()) {
                log.error("mkdirs failed {}", parentBaseDir);
                IS_TOTAL_SCAN_MAP.put(generateUniqueProjectKey(repoUuid, curCommit), true);
                return jGitHelper.getRepoPath();
            }

            DiffFile diffFilePair = jGitHelper.getDiffFilePair(commitParent, curCommit);

            List<String> addFiles = diffFilePair.getAddFiles();
            List<String> deleteFiles = diffFilePair.getDeleteFiles();
            Map<String, String> changeFiles = diffFilePair.getChangeFiles();
            List<String> parentFiles = new ArrayList<>();
            parentFiles.addAll(deleteFiles);
            parentFiles.addAll(changeFiles.keySet());
            jGitHelper.checkout(commitParent);
            for (String parentFile : parentFiles) {
                if (!filterFile(parentFile)) {
                    FileUtil.copyFile(jGitHelper.getRepoPath() + FILE_SEPARATOR + parentFile, parentBaseDir + parentFile);
                }
            }
            curFiles.addAll(addFiles);
            curFiles.addAll(changeFiles.values());
        }
        jGitHelper.checkout(curCommit);
        // copyTempRepoPath / repoUuid / curCommit / curCommit /
        String curBaseDir = targetRepoDir + FILE_SEPARATOR + curCommit + FILE_SEPARATOR;
        new File(curBaseDir).mkdirs();
        for (String curFile : curFiles) {
            if (!filterFile(curFile)) {
                FileUtil.copyFile(jGitHelper.getRepoPath() + FILE_SEPARATOR + curFile, curBaseDir + curFile);
            }
        }
        return targetRepoDir;
    }

    private void deleteCopyFiles(String copyTempRepoPath) {
        Runtime rt = Runtime.getRuntime();
        String command = binHome + "deleteCopyFile.sh " + copyTempRepoPath;
        log.info("command -> {}", command);
        try {
            Process process = rt.exec(command);
            boolean timeOut = process.waitFor(20L, TimeUnit.SECONDS);
            if (!timeOut) {
                process.destroy();
                log.error("delete file {} timeout ! (20s)", copyTempRepoPath);
                return;
            }
            log.info("delete file {} success !", copyTempRepoPath);
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }

    /**
     * 不同语言文件是否过滤
     *
     * @return false:不过滤 true:过滤
     */
    public abstract boolean filterFile(String fileName);


}
