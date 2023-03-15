package cn.edu.fudan.issueservice.service.impl;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.domain.po.scan.ScanStatus;
import cn.edu.fudan.issueservice.component.SonarRest;
import cn.edu.fudan.issueservice.dao.*;
import cn.edu.fudan.issueservice.domain.dto.ScanRequestDTO;
import cn.edu.fudan.issueservice.service.IssueScanService;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * -【【lsw
 *
 * @author lsw
 */
@Service
@Slf4j
public class IssueScanServiceImpl implements IssueScanService {

    private IssueScanDao issueScanDao;
    private IssueRepoDao issueRepoDao;
    private RawIssueCacheDao rawIssueCacheDao;
    private IssueDao issueDao;
    private RawIssueDao rawIssueDao;
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;
    private LocationDao locationDao;
    private IssueRepoScanListDao issueRepoScanListDao;


    @Override
    public RepoScan getScanStatusByRepoUuid(String repoUuid) {
        // fixme icse customize
        List<String> tools = Collections.singletonList("sonarqube");


        List<RepoScan> issueRepos = getIssueReposByRepoUuid(repoUuid);
        RepoScan issueRepo = new RepoScan();
        issueRepo.setRepoUuid(repoUuid);
        if (issueRepos.isEmpty()) {
            log.warn("can not find repo:{} in issue repo", repoUuid);
            issueRepo.setScanStatus(ScanStatus.FAILED);
            return issueRepo;
        }
        final List<RepoScan> issueReposOrderByEndScanTime = issueRepos.stream()
                .sorted(Comparator.comparing(r -> DateTimeUtil.format(r.getEndScanTime()))).collect(Collectors.toList());
        issueRepo.setStartScanTime(issueReposOrderByEndScanTime.get(0).getStartScanTime());
        issueRepo.setEndScanTime(issueReposOrderByEndScanTime.get(issueReposOrderByEndScanTime.size() - 1).getEndScanTime());
        boolean isScanning = false;
        boolean isFailed = false;
        for (RepoScan repoScan : issueReposOrderByEndScanTime) {
            // failed or interrupt
            if (repoScan.getScanStatus().equals(ScanStatus.FAILED) || repoScan.getScanStatus().equals(ScanStatus.INTERRUPT)) {
                isFailed = true;
                break;
            }
            if (repoScan.getScanStatus().equals(ScanStatus.SCANNING)) {
                isScanning = true;
            }
        }
        issueRepo.setScanStatus(isFailed || issueRepos.isEmpty() ? ScanStatus.FAILED : ((isScanning || tools.size() != issueRepos.size()) ? ScanStatus.SCANNING : ScanStatus.COMPLETE));
        return issueRepo;
    }

    @Override
    public void handleScanList(List<ScanRequestDTO> scanRequestDTOList) throws Exception {
        List<RepoScan> waitToScanList = new ArrayList<>();
        scanRequestDTOList.forEach(scanRequestDTO -> {
            RepoScan repoScan = RepoScan.builder()
                    .repoUuid(scanRequestDTO.getRepoUuid())
                    .branch(scanRequestDTO.getBranch())
                    .scanStatus(ScanStatus.WAITING_FOR_SCAN)
                    .startCommit(scanRequestDTO.getBeginCommit())
                    .build();
            waitToScanList.add(repoScan);
        });
        issueRepoScanListDao.insertRepoScanList(waitToScanList);
    }

    @Override
    public List<RepoScan> getIssueReposByRepoUuid(String repoUuid) {
        List<RepoScan> issueRepos = issueRepoDao.getIssueRepoByRepoUuid(repoUuid);
        return issueRepos == null || issueRepos.isEmpty() ? new ArrayList<>() : issueRepos;
    }

    @Override
    public RepoScan handleBeforeReScan(String repoUuid, String tool) {
        final RepoScan repoScan = issueRepoDao.getRepoScan(repoUuid, tool);
        log.info("start delete dataBase, repoUuid:{}, tool:{}", repoUuid, tool);
        cleanDataByRepoUuidAndTool(repoUuid, tool);
        log.info("finish delete dataBase, repoUuid:{}, tool:{}", repoUuid, tool);
        return repoScan;
    }

    @Transactional(rollbackFor = Exception.class)
    public void cleanDataByRepoUuidAndTool(String repoUuid, String tool) {
        issueRepoDao.delIssueRepo(repoUuid, tool, null);
        issueScanDao.deleteIssueScanByRepoIdAndTool(repoUuid, tool);
        rawIssueCacheDao.deleteRepo(repoUuid, tool);
        issueDao.deleteIssuesByRepoUuid(repoUuid);
        rawIssueDao.deleteRawIssuesByRepoUuid(repoUuid);
        rawIssueMatchInfoDao.deleteMatchInfosByRepoUuid(repoUuid);
        locationDao.deleteLocationsByRepoUuid(repoUuid);
    }

    @Override
    public Map<String, String> getScanFailedCommitList(String repoUuid) {
        return issueScanDao.getScanFailedCommitList(repoUuid);
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
