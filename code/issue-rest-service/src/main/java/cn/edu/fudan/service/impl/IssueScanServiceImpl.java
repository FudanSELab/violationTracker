package cn.edu.fudan.service.impl;


import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.dao.IssueRepoDao;
import cn.edu.fudan.domain.enums.ToolEnum;
import cn.edu.fudan.service.IssueScanService;
import com.github.pagehelper.PageHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc
 * @date 2023/3/15 10:40
 */
@Slf4j
@Service
public class IssueScanServiceImpl implements IssueScanService {
    private static final String NAME = "name";
    private static final String REPO_ID = "repo_id";
    private static final String BRANCH = "branch";

    private IssueRepoDao issueRepoDao;

    @Override
    public List<RepoScan> getScanStatuses(String repoUuids, Integer page, Integer ps) {
        PageHelper.startPage(page, ps);
        return issueRepoDao.getRepoScanByRepoUuids(Arrays.stream(repoUuids.split(","))
                .filter(s -> !s.isEmpty()).collect(Collectors.toList()));
    }

    @Override
    public Map<String, List<Map<String, String>>> getScanRepos() {
        List<RepoScan> allRepos = issueRepoDao.getAllRepos();
        Map<String, List<Map<String, String>>> retMap = new HashMap<>();

        List<Map<String, String>> javaRepos = new ArrayList<>();
        allRepos.stream().filter(repoScan -> repoScan.getTool().equals(ToolEnum.SONAR.getType())).forEach(repoScan -> {
            Map<String, String> repo = new HashMap<>(8);
            repo.put(NAME, repoScan.getRepoUuid());
            repo.put(REPO_ID, repoScan.getRepoUuid());
            repo.put(BRANCH, repoScan.getBranch());
            javaRepos.add(repo);
        });

        List<Map<String, String>> cppRepos = new ArrayList<>();
        allRepos.stream().filter(repoScan -> repoScan.getTool().equals(ToolEnum.TSCANCODE.getType())).forEach(repoScan -> {
            Map<String, String> repo = new HashMap<>(8);
            repo.put(NAME, repoScan.getRepoUuid());
            repo.put(REPO_ID, repoScan.getRepoUuid());
            repo.put(BRANCH, repoScan.getBranch());
            cppRepos.add(repo);
        });
        List<Map<String, String>> jsRepos = new ArrayList<>();
        allRepos.stream().filter(repoScan -> repoScan.getTool().equals(ToolEnum.ESLINT.getType())).forEach(repoScan -> {
            Map<String, String> repo = new HashMap<>(8);
            repo.put(NAME, repoScan.getRepoUuid());
            repo.put(REPO_ID, repoScan.getRepoUuid());
            repo.put(BRANCH, repoScan.getBranch());
            jsRepos.add(repo);
        });
        retMap.put(ToolEnum.SONAR.getType(), javaRepos);
        // fixme FSE
//        retMap.put(ToolEnum.TSCANCODE.getType(), cppRepos);
//        retMap.put(ToolEnum.ESLINT.getType(), jsRepos);
        return retMap;
    }

    @Autowired
    public void setIssueRepoDao(IssueRepoDao issueRepoDao) {
        this.issueRepoDao = issueRepoDao;
    }
}
