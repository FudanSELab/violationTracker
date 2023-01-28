package cn.edu.fudan.issueservice.core;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.domain.po.scan.ScanStatus;
import cn.edu.fudan.common.scan.AbstractToolScan;
import cn.edu.fudan.common.scan.BaseScanProcess;
import cn.edu.fudan.issueservice.component.SonarRest;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dbo.IssueScan;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
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

    private IssueScanDao issueScanDao;

    private IssueRepoDao issueRepoDao;

    private RawIssueCacheDao rawIssueCacheDao;

    private IssueDao issueDao;

    private RawIssueDao rawIssueDao;

    private RawIssueMatchInfoDao rawIssueMatchInfoDao;

    private LocationDao locationDao;


    @Value("${enableAllScan}")
    private boolean enableAllScan;

    private static ThreadLocal<Map<String, String>> toolWithBeginCommit;

    private final Map<String, Map<String, String>> repoUuid2ToolWithBeginCommit = new HashMap<>();

    public IssueScanProcess(@Autowired ApplicationContext applicationContext) {
        super(applicationContext);
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
        String beginCommitFromScanService = toolWithBeginCommit.get().get(tool);
        if (beginCommitFromScanService != null) {
            log.info("get begin commit:{} from scan service", beginCommitFromScanService);
            return beginCommitFromScanService;
        }
        final Map<String, String> tool2BeginCommit = repoUuid2ToolWithBeginCommit.get(repoUuid);
        if (tool2BeginCommit != null && tool2BeginCommit.containsKey(tool)) {
            log.info("get begin commit:{} from before issue repo", tool2BeginCommit.get(tool));
            return tool2BeginCommit.get(tool);
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
        issueRepoDao.delIssueRepo(repoUuid, null);
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

    public Map<String, Map<String, String>> getRepoUuid2ToolWithBeginCommit() {
        return repoUuid2ToolWithBeginCommit;
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
}
