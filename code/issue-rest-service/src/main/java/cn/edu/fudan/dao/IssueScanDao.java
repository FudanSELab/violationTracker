package cn.edu.fudan.dao;

import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.domain.dbo.Commit;
import cn.edu.fudan.domain.dbo.IssueScan;
import cn.edu.fudan.mapper.IssueScanMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * @author beethoven
 */
@Repository
public class IssueScanDao {

    protected IssueScanMapper issueScanMapper;

    @Autowired
    public void setScanMapper(IssueScanMapper issueScanMapper) {
        this.issueScanMapper = issueScanMapper;
    }

    public void insertOneIssueScan(IssueScan scan) {
        issueScanMapper.insertOneScan(scan);
    }

    public void deleteIssueScanByRepoIdAndTool(String repoId, String tool) {
        issueScanMapper.deleteIssueScanByRepoIdAndTool(repoId, tool);
    }

    public List<IssueScan> getIssueScanByRepoIdAndStatusAndTool(String repoId, List<String> status, String tool) {
        return issueScanMapper.getIssueScanByRepoIdAndStatusAndTool(repoId, status, tool);
    }

    public IssueScan getLatestIssueScanByRepoIdAndTool(String repoId, String tool) {
        return issueScanMapper.getLatestIssueScanByRepoIdAndTool(repoId, tool);
    }

    public Set<String> getScannedCommitList(String repoUuid, String tool) {
        return new HashSet<>(issueScanMapper.getScannedCommitList(repoUuid, tool));
    }

    public Map<String, String> getScanStatusInRepo(String repoUuid) {
        return issueScanMapper.getScanStatusInRepo(repoUuid).stream()
                .collect(Collectors.toMap(TwoValue::getFirst, TwoValue::getSecond));
    }

    public Map<String, String> getScanFailedCommitList(String repoUuid) {
        return issueScanMapper.getScanFailedCommitList(repoUuid).stream()
                .collect(Collectors.toMap(TwoValue::getFirst, TwoValue::getSecond));
    }

    public List<Commit> getAllCommitsBetween(String repoUuid, String since, String until) {
        return issueScanMapper.getAllCommitsWithParents(repoUuid, since, until);
    }

    public List<String> getAllDeveloper(List<String> repoUuids) {
        return issueScanMapper.getAllDevelopers(repoUuids);
    }
}
