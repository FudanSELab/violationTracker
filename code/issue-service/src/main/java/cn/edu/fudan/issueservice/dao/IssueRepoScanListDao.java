package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.issueservice.mapper.IssueRepoScanListMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Joshua
 * @description
 * @date 2022-12-29 17:49
 **/
@Repository
public class IssueRepoScanListDao {

    private IssueRepoScanListMapper issueRepoScanListMapper;

    public void insertRepoScanList(List<RepoScan> repoScanList) {
        issueRepoScanListMapper.insertRepoScanList(repoScanList);
    }

    public List<RepoScan> getRepoScansByCondition(String repoUuid, List<String> stringList) {
        final List<RepoScan> repoScansByCondition = issueRepoScanListMapper.getRepoScansByCondition(repoUuid, stringList);
        return repoScansByCondition == null ? new ArrayList<>():repoScansByCondition;
    }

    public void updateStatusByRepoUuid(String repoUuid, String status) {
        issueRepoScanListMapper.updateStatusByRepoUuid(repoUuid, status);
    }

    @Autowired
    public void setIssueRepoScanListMapper(IssueRepoScanListMapper issueRepoScanListMapper) {
        this.issueRepoScanListMapper = issueRepoScanListMapper;
    }

}
