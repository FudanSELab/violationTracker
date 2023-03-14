package cn.edu.fudan.issueservice.core.analyzer;

import cn.edu.fudan.common.jgit.DiffFile;
import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.issueservice.dao.RawIssueCacheDao;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueCache;
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
 * description: The specific execution process of static scanning tools
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
     * key repoUuid + commitId
     */
    static final Map<String, Boolean> IS_TOTAL_SCAN_MAP = new ConcurrentHashMap<>(1000);
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
    @Value("${enableTotalScan:true}")
    protected boolean enableTotalScan;
    @Value("${debugMode}")
    protected boolean debugMode;
    @Value("${wholeProcessTest:false}")
    protected boolean wholeProcessTest;

    public boolean isTotalScan(String key) {
        return IS_TOTAL_SCAN_MAP.getOrDefault(key, false);
    }

    public void removeTotalScan(String key) {
        IS_TOTAL_SCAN_MAP.remove(key);
    }

    public Map<String, Boolean> getIsTotalScanMap() {
        return IS_TOTAL_SCAN_MAP;
    }

    public String generateUniqueProjectKey(String repoUuid, String commit) {
        return repoUuid + "_" + commit;
    }

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
     * Tool Name
     *
     * @return Tool Name
     */
    public abstract String getToolName();

    /**
     * Returns the priority of the violation
     *
     * @param rawIssue rawIssue
     * @return The priority
     */
    public abstract Integer getPriorityByRawIssue(RawIssue rawIssue);

    /**
     * Gets the method, fields, and class names in the file based on the file name
     *
     * @param absoluteFilePath The absolute file path
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
        if (jGitHelper.checkout(commit)) {
            String scanRepoPath = jGitHelper.getRepoPath();

            // Determine whether it is a total scan or an incremental scan based on whether its parent has been scanned
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
        completeFlag.countDown();
        log.info("2: prepare resource result: {}! repoUuid:{} commit:{}", scanStatusEnum.getType(), repoUuid, commit);

        // Storing resources in the database relieves memory pressure, but increases query overhead
        RawIssueCache rawIssueCache = RawIssueCache.init(repoUuid, commit, getToolName());

        log.info("init issueAnalyzer success, begin set status");

        // If the compilation fails to compile the commit, there may still be data obtained with sonar
        // So when the compilation fails, you need to pass in an empty array
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

        // Modify the status after the resource is prepared
        resourcesStatus.put(commit, scanStatusEnum);
        repoResource.put(jGitHelper, true);
        remainingNum.addAndGet(1);
        log.info("4: resource change Done! repoUuid:{} commit:{}", repoUuid, commit);

        // Notify other waiting threads when resource preparation is complete
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


        // todo After the resolution is completed, set the corresponding aggregator , temporarily coupled in the tool call and resolution, and then put it after the traceability
        Map<String, List<RawIssue>> commit2Issues = rawIssues.parallelStream().collect(Collectors.groupingBy(RawIssue::getCommitId));
        for (Map.Entry<String, List<RawIssue>> entry : commit2Issues.entrySet()) {
            String developerUniqueName = DeveloperUniqueNameUtil.getDeveloperUniqueName(repoPath, entry.getKey(), repoUuid);
            entry.getValue().forEach(r -> r.setDeveloperName(developerUniqueName));
        }

        String key = generateUniqueProjectKey(repoUuid, commit);
        // Delete the copied files after the incremental scan is complete
        if (!isTotalScan(key) && !debugMode) {
            //todo
            deleteCopyFiles(scanRepoPath);
        }

        return new TwoValue<>(ScanStatusEnum.DONE, rawIssues);

    }

    /**
     * Enable advance resource preparation
     *
     * @return Whether to enable advance resource preparation
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

        List<String> commitParents = new ArrayList<>();

        boolean isTotalScan = false;
        if (enableTotalScan) {
            for (String commitParent : jGitHelper.getCommitParents(curCommit)) {
                if (commitList.contains(commitParent)) {
                    commitParents.add(commitParent);
                }
            }
            isTotalScan = commitParents.size() == 0;
            // If the scan list is not empty and the scan information of the parent does not exist in the cache
            // Total scan
            for (String commitParent : commitParents) {
                if (!commitList.contains(commitParent) && !rawIssueCacheDao.cached(repoUuid, commitParent, getToolName())) {
                    isTotalScan = true;
                    break;
                }
            }
        } else {
            commitParents = Arrays.asList(jGitHelper.getCommitParents(curCommit));
        }

        // Only the first commit requires a total scan
//        boolean isTotalScan = curCommit.equals(commitList.get(0));


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
            if (!jGitHelper.checkout(commitParent)) {
                // If the checkout fails, the total scan is performed
                IS_TOTAL_SCAN_MAP.replace(generateUniqueProjectKey(repoUuid, curCommit), true);
                return jGitHelper.getRepoPath();
            }
            for (String parentFile : parentFiles) {
                if (!filterFile(parentFile)) {
                    FileUtil.copyFile(jGitHelper.getRepoPath() + FILE_SEPARATOR + parentFile, parentBaseDir + parentFile);
                }
            }
            curFiles.addAll(addFiles);
            curFiles.addAll(changeFiles.values());
        }
        if (!jGitHelper.checkout(curCommit)) {
            // If the checkout fails, the total scan is performed
            IS_TOTAL_SCAN_MAP.replace(generateUniqueProjectKey(repoUuid, curCommit), true);
            return jGitHelper.getRepoPath();
        }
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
     * Whether to filter files based on language
     *
     * @return true / false
     */
    public abstract boolean filterFile(String fileName);


}
