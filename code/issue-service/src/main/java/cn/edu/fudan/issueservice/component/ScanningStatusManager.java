package cn.edu.fudan.issueservice.component;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.domain.po.scan.ScanStatus;
import cn.edu.fudan.issueservice.dao.IssueRepoDao;
import cn.edu.fudan.issueservice.dao.IssueRepoScanListDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.util.List;

/**
 * Manage the status of the scanning code repository
 * @author Jerry Zhang
 * create: 2022-11-18 13:56
 */
@Component
public class ScanningStatusManager {
    @Autowired
    private IssueRepoDao issueRepoDao;
    @Autowired
    private IssueRepoScanListDao issueRepoScanListDao;


    /**
     * After restarting the program, automatically update the scanning status to the interrupt status.
     */
    @PostConstruct
    @Transactional(rollbackFor = Exception.class)
    public void updateScanningRepo() {
        List<RepoScan> repoScanList = issueRepoDao.getScanningRepos(null);
        repoScanList.forEach(repoScan -> {
            repoScan.setScanStatus(ScanStatus.INTERRUPT);
            issueRepoDao.updateIssueRepo(repoScan);
        });
        issueRepoScanListDao.getRepoScansByCondition(null, null).stream()
                .filter(issueRepo -> issueRepo.getScanStatus().equals(ScanStatus.SCANNING))
                .forEach(issueRepo -> issueRepoScanListDao.updateStatusByRepoUuid(issueRepo.getRepoUuid(), ScanStatus.INTERRUPT));
    }
}
