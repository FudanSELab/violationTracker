package cn.edu.fudan.issueservice.core;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.domain.po.scan.ScanStatus;
import cn.edu.fudan.common.scan.AbstractToolScan;
import cn.edu.fudan.common.scan.BaseScanProcess;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.IssueScan;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * @author beethoven
 * @author pjh
 * @date 2021-04-25 13:51:11
 */
@Slf4j
@Component
public class IssueScanProcess extends BaseScanProcess {

    private final Map<String, Map<String, String>> repoUuid2ToolWithBeginCommit = new HashMap<>();
    private IssueScanDao issueScanDao;
    private IssueRepoDao issueRepoDao;
    private RawIssueCacheDao rawIssueCacheDao;
    private IssueDao issueDao;
    private RawIssueDao rawIssueDao;
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;
    private LocationDao locationDao;
    private IssueRepoScanListDao issueRepoScanListDao;
    @Value("${enableAllScan}")
    private boolean enableAllScan;
    @Value("${maxPoolSize:5}")
    private int maxPoolSize;

    public IssueScanProcess(@Autowired ApplicationContext applicationContext) {
        super(applicationContext);
    }

    private final Set<String> repoIsAdded = new HashSet<>();

    @Transactional(rollbackFor = Exception.class)
    void handleBeforeStartScan(String repoUuid) {
        issueRepoScanListDao.updateStatusByRepoUuid(repoUuid, ScanStatus.SCANNING);
    }

    //Every 150s, check whether there are still repos to be scanned
    @Scheduled(fixedRate = 150000)
    public void scanReposWaitForScan() {
        final List<RepoScan> waitToScanList = issueRepoScanListDao.getRepoScansByCondition(null, Arrays.asList(ScanStatus.WAITING_FOR_SCAN, ScanStatus.INTERRUPT));
        if (waitToScanList.isEmpty()) {
            return;
        }
        final int scanningRepoSize = issueRepoDao.getScanningRepos(null).size();
        //Some threads are reserved to service new scanning requests
        int reserveForScanRequestThreadNum = 2;
        log.info("maxPoolSize:{} scanningRepoSize:{} waitToScanList:{}",maxPoolSize, scanningRepoSize, waitToScanList.size());
        if (scanningRepoSize <= maxPoolSize - reserveForScanRequestThreadNum) {
            int canAddRepoNum = maxPoolSize - reserveForScanRequestThreadNum - scanningRepoSize;
            for (RepoScan repoScan : waitToScanList) {
                if (canAddRepoNum == 0) {
                    break;
                }
                String repoUuid = repoScan.getRepoUuid();
                if (!repoIsAdded.contains(repoUuid)) {
                    repoIsAdded.add(repoUuid);
                    canAddRepoNum--;
                    log.info("start scan repoUuid:{} branch:{}", repoUuid, repoScan.getBranch());
                    IssueScanProcess issueScanProcess = applicationContext.getBean(IssueScanProcess.class);
                    try {
                        handleBeforeStartScan(repoUuid);
                        //由于调用方与被调用方在同一个类，导致scan()的@Async注解失效，所以通过此种方法启用异步
                        issueScanProcess.scan(repoScan.getRepoUuid(), repoScan.getBranch(), repoScan.getStartCommit(), repoScan.getEndCommit());
                    } catch (Exception e) {
                        log.warn("add thead to pool failed");
                        issueRepoScanListDao.updateStatusByRepoUuid(repoUuid, ScanStatus.WAITING_FOR_SCAN);
                        break;
                    }
                }
            }
        }
    }

    /**
     * 根据不同的工具或者不同的策略生成不同的 beginCommit
     * 首先从issue_scan中查询最新的扫描commit
     * 如果没有，则尝试获取issue_repo中的beginCommit
     * 最后，如果以上全都没有，则表示是第一次扫描，从scan尝试获取，没有获取到的话则用默认传入的beginCommit
     */
    @Override
    protected @NonNull String generateToolBeginCommit(String repoUuid, String tool, String beginCommit) {
        IssueScan latestIssueScan = issueScanDao.getLatestIssueScanByRepoIdAndTool(repoUuid, tool);
        if (latestIssueScan != null) {
            log.info("get begin commit:{} from issue scan", latestIssueScan.getCommitId());
            return latestIssueScan.getCommitId();
        }
        String beginCommitFromIssueRepo = issueRepoDao.getStartCommit(repoUuid, tool);
        if (beginCommitFromIssueRepo != null) {
            log.info("get begin commit:{} from issue repo", beginCommitFromIssueRepo);
            return beginCommitFromIssueRepo;
        }
        if (beginCommit != null) {
            log.info("get begin commit:{} from request", beginCommit);
            return beginCommit;
        }
        //找不到该repo的beginCommit 触发全局扫描
        return "";
    }

    /**
     * After an error occurs, set the tool being scanned to failed in the issue repo state.
     * <p>
     * If an error is reported before the issue repo scans the data once, no processing is required,
     * because the issue repo status will be directly recorded as failed if it cannot be found in subsequent queries
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    protected void handleExceptionInScan(String repoUuid, String branch, String beginCommit, String endCommit, Exception e) {
        final List<RepoScan> issueRepoByRepoUuid = issueRepoDao.getIssueRepoByRepoUuid(repoUuid);
        if (issueRepoByRepoUuid.isEmpty()) {
            return;
        }
        issueRepoByRepoUuid.stream().filter(issueRepo -> issueRepo.getScanStatus().equals(ScanStatus.SCANNING))
                .forEach((repoScan) -> {
                    repoScan.setScanStatus(ScanStatus.FAILED);
                    repoScan.setEndScanTime(LocalDateTime.now());
                    Duration duration = Duration.between(repoScan.getStartScanTime(), repoScan.getEndScanTime());
                    repoScan.setScanTime(duration.toMillis() / 1000);
                    updateRepoScan(repoScan);
                });
        log.info("repoUuid:{} handle exception in scan after issue repo", repoUuid);
        issueRepoScanListDao.updateStatusByRepoUuid(repoUuid, ScanStatus.FAILED);
        log.info("repoUuid:{} handle exception in scan after issue repo scan list", repoUuid);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    protected void handleAfterScan(String repoUuid, String branch, String beginCommit, String endCommit) {
        log.info("repoUuid:{} handle after scan", repoUuid);
        issueRepoScanListDao.updateStatusByRepoUuid(repoUuid, ScanStatus.COMPLETE);
    }

    @Override
    protected AbstractToolScan getToolScan(String tool) {
        return applicationContext.getBean(IssueToolScanImpl.class);
    }

    @Override
    protected List<String> getScannedCommitList(String repoUuid, String tool) {
        return new ArrayList<>(issueScanDao.getScannedCommitList(repoUuid, tool));
    }

    @Override
    protected String getLastedScannedCommit(String repoUuid, String tool) {
        IssueScan latestIssueScan = issueScanDao.getLatestIssueScanByRepoIdAndTool(repoUuid, tool);
        if (latestIssueScan == null) {
            return issueRepoDao.getStartCommit(repoUuid, tool);
        }
        return latestIssueScan.getCommitId();
    }

    @Override
    protected String[] getToolsByRepo(String repoUuid) {
        return new String[]{"sonarqube"};
    }

    @Override
    protected void insertRepoScan(RepoScan repoScan) {
        issueRepoDao.insertOneIssueRepo(repoScan);
    }

    @Override
    public void updateRepoScan(RepoScan scanInfo) {
        issueRepoDao.updateIssueRepo(scanInfo);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteRepo(String repoUuid) {
        issueRepoDao.delIssueRepo(repoUuid, null, null);
        issueScanDao.deleteIssueScanByRepoIdAndTool(repoUuid, null);
        rawIssueCacheDao.deleteRepo(repoUuid, null);
        issueDao.deleteIssuesByRepoUuid(repoUuid);
        rawIssueDao.deleteRawIssuesByRepoUuid(repoUuid);
        rawIssueMatchInfoDao.deleteMatchInfosByRepoUuid(repoUuid);
        locationDao.deleteLocationsByRepoUuid(repoUuid);
    }

    @Override
    protected RepoScan getRepoScan(String repoUuid, String tool, String branch) {
        return issueRepoDao.getRepoScan(repoUuid, tool);
    }

    @Override
    public void deleteRepo(String repoUuid, String toolName) {

    }

    @Override
    public List<String> filterToScanCommitList(String repoUuid, List<String> toScanCommitList) {
        //如果不是全量扫描，且是第一次扫描，只扫描最后一个
        if (!enableAllScan && !toScanCommitList.isEmpty()) {
            return Collections.singletonList(toScanCommitList.get(toScanCommitList.size() - 1));
        }
        return toScanCommitList;
    }

    @Override
    protected String getBeginCommit(String repoUuid, String tool) {
        return issueRepoDao.getRepoScan(repoUuid, tool).getStartCommit();
    }

    @Autowired
    public void setIssueScanDao(IssueScanDao issueScanDao) {
        this.issueScanDao = issueScanDao;
    }

    @Autowired
    public void setIssueRepoDao(IssueRepoDao issueRepoDao) {
        this.issueRepoDao = issueRepoDao;
    }

    @Autowired
    public void setRawIssueCacheDao(RawIssueCacheDao rawIssueCacheDao) {
        this.rawIssueCacheDao = rawIssueCacheDao;
    }

    @Autowired
    public void setIssueDao(IssueDao issueDao) {
        this.issueDao = issueDao;
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
    public void setLocationDao(LocationDao locationDao) {
        this.locationDao = locationDao;
    }

    @Autowired
    public void setIssueRepoScanListDao(IssueRepoScanListDao issueRepoScanListDao) {
        this.issueRepoScanListDao = issueRepoScanListDao;
    }
}
