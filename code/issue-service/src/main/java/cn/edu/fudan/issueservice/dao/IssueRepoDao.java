package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.domain.po.scan.ScanStatus;
import cn.edu.fudan.issueservice.mapper.IssueRepoMapper;
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

    public void insertOneIssueRepo(RepoScan issueRepo) {
        issueRepoMapper.insertOneIssueRepo(issueRepo);
    }

    //    public void insertOneIssueRepo(RepoScan issueRepo) {
//        issueRepoMapper.insertOneIssueRepo(issueRepo, UUID.randomUUID().toString());
//    }
    public List<RepoScan> getScanningRepos(String tool) {
        return issueRepoMapper.getReposByScanStatus(ScanStatus.SCANNING, tool);
    }

    public List<RepoScan> getCompleteRepos(String tool) {
        return issueRepoMapper.getReposByScanStatus(ScanStatus.COMPLETE, tool);
    }

    public List<RepoScan> getInterruptRepos(String tool) {
        return issueRepoMapper.getReposByScanStatus(ScanStatus.INTERRUPT, tool);
    }

    public void updateIssueRepo(RepoScan issueRepo) {
        issueRepoMapper.updateIssueRepo(issueRepo);
    }

    public void delIssueRepo(String repoId, String tool, String status) {
        issueRepoMapper.deleteIssueRepoByCondition(repoId, tool, status);
    }

    public List<RepoScan> getIssueRepoByRepoUuid(String repoId) {
        return issueRepoMapper.getIssueRepoByCondition(repoId, null);
    }

    public List<HashMap<String, Integer>> getNotScanCommitsCount(String repoUuid, String tool) {
        return issueRepoMapper.getNotScanCommitsCount(repoUuid, tool);
    }

    public RepoScan getMainIssueRepo(String repoUuid, String tool) {
        return issueRepoMapper.getMainIssueRepo(repoUuid, tool);
    }

    public RepoScan getRepoScan(String repoUuid, String tool) {
        return issueRepoMapper.getRepoScan(repoUuid, tool);
    }

    public String getStartCommitTime(String repoUuid, String tool) {
        return issueRepoMapper.getStartCommitTime(repoUuid, tool);
    }

    public String getStartCommit(@Param("repoUuid") String repoUuid, @Param("tool") String tool) {
        return issueRepoMapper.getStartCommit(repoUuid, tool);
    }

    public List<String> getStartCommits(@Param("repoUuids") List<String> repoUuids, @Param("tool") String tool) {
        return issueRepoMapper.getStartCommits(repoUuids, tool);
    }

    @Autowired
    public void setIssueRepoMapper(IssueRepoMapper issueRepoMapper) {
        this.issueRepoMapper = issueRepoMapper;
    }

}
