package cn.edu.fudan.issueservice.component;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.domain.po.scan.ScanStatus;
import cn.edu.fudan.issueservice.dao.IssueRepoDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.List;

/**
 * 库扫描情况管理
 * @author Jerry Zhang
 * create: 2022-11-18 13:56
 */
@Component
public class ScanningStatusManager {
    @Autowired
    private IssueRepoDao issueRepoDao;

    /**
     * 重启程序后自动执行
     * 将 scanning 状态更新为 interrupt 状态
     */
    @PostConstruct
    public void updateScanningRepo() {
        List<RepoScan> repoScanList = issueRepoDao.getScanningRepos();
        repoScanList.forEach(repoScan -> {
            repoScan.setScanStatus(ScanStatus.INTERRUPT);
            issueRepoDao.updateIssueRepo(repoScan);
        });
    }
}
