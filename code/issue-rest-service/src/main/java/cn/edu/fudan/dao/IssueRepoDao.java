package cn.edu.fudan.dao;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.domain.po.scan.ScanStatus;
import cn.edu.fudan.mapper.IssueRepoMapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;

/**
 * @author beethoven
 */
@Repository
public class IssueRepoDao {

    private IssueRepoMapper issueRepoMapper;

    public void delIssueRepo(String repoId, String tool, String status) {
        issueRepoMapper.deleteIssueRepoByCondition(repoId, tool, status);
    }

    public List<RepoScan> getRepoScanByRepoUuids(List<String> repoUuids) {
        return issueRepoMapper.getRepoScanByRepoUuids(repoUuids);
    }

    public List<RepoScan> getAllRepos() {
        return issueRepoMapper.getAllRepos();
    }
}
