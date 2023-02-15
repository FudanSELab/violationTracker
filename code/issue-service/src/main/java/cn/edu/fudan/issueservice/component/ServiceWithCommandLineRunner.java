package cn.edu.fudan.issueservice.component;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.issueservice.core.IssueScanProcess;
import cn.edu.fudan.issueservice.dao.IssueRepoDao;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author Jerry Zhang
 * create: 2023-01-05 08:39
 */
@Slf4j
@Component
public class ServiceWithCommandLineRunner implements CommandLineRunner {
    @Autowired
    private IssueRepoDao issueRepoDao;
    @Autowired
    private ApplicationContext applicationContext;
    @Value("${interruptScan:true}")
    private Boolean interruptScan;
    @Value("${scanThreadNum:3}")
    private int initValue;

    @Override
    public void run(String... args) throws Exception {
        log.info("check last interrupted repos");
        if (Boolean.TRUE.equals(interruptScan)) {
            List<RepoScan> repoScanList = issueRepoDao.getInterruptRepos(null);
            List<RepoScan> toScanList = repoScanList.stream()
                    .sorted(Comparator.comparing(RepoScan::getEndScanTime))
                    .collect(Collectors.toList());
            // 重扫最后 initValue 个未扫完（中断）的 repo 项目
            IssueScanProcess issueScanProcess = applicationContext.getBean(IssueScanProcess.class);
            for (int i = 1; i <= initValue && toScanList.size() - i > 0; i++) {
                RepoScan repoScan = toScanList.get(toScanList.size() - i);
                log.info("{} needs to resume scanning", repoScan.getRepoUuid());
                issueScanProcess.scan(repoScan.getRepoUuid(), repoScan.getBranch(), repoScan.getStartCommit(), null);
            }
        } else {
            log.info("interruptScan is false");
        }
    }
}
