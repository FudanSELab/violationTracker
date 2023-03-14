package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.issueservice.domain.dbo.Commit;
import cn.edu.fudan.issueservice.domain.dbo.IssueScan;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * @author lsw
 */
@Repository
public interface IssueScanMapper {

    /**
     * insert one issueScan
     *
     * @param scan issueScan
     */
    void insertOneScan(IssueScan scan);

    /**
     * delete issueScans by condition
     *
     * @param repoId repoUuid
     * @param tool   tool
     */
    void deleteIssueScanByRepoIdAndTool(@Param("repo_uuid") String repoId, @Param("tool") String tool);

    /**
     * get issueScans by condition
     *
     * @param repoId     repoUuid
     * @param statusList statusList
     * @param tool       tool
     * @return issueScan list
     */
    List<IssueScan> getIssueScanByRepoIdAndStatusAndTool(@Param("repo_uuid") String repoId, @Param("statusList") List<String> statusList, @Param("tool") String tool);

    /**
     * get issueScans by condition
     *
     * @param repoId   repoUuid
     * @param commitId commitId
     * @param tool     tool
     * @param since    since
     * @param until    until
     * @return issueScan list
     */
    List<IssueScan> getIssueScanByRepoIdAndCommitIdAndTool(@Param("repo_uuid") String repoId, @Param("commit_id") String commitId, @Param("tool") String tool,
                                                           @Param("since") String since, @Param("until") String until);

    /**
     * get the issueScan by repo uuid and tool name
     *
     * @param repoId repoUuid
     * @param tool   tool
     * @return issueScan
     */
    IssueScan getLatestIssueScanByRepoIdAndTool(@Param("repo_uuid") String repoId, @Param("tool") String tool);

    /**
     * get scanned commit list
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return the scanned commit list
     */
    List<String> getScannedCommitList(String repoUuid, String tool);

    /**
     * 获取扫描的起止commit日期
     * @param repoUuid
     * @param tool
     * @return
     */
    Map<String, Object> getRangeCommitDate(@Param("repoUuid") String repoUuid, @Param("tool") String tool);

    /**
     * get commit list with their parent commits
     *
     * @param repoUuid
     * @return
     */
    List<Commit> getAllCommitsWithParents(@Param("repoUuid") String repoUuid, @Param("since") String since, @Param("until") String until);

    /**
     * get the commits that have failed scan
     *
     * @param repoUuid
     * @return first commit_id  second commit_time
     */
    List<TwoValue<String, String>> getScanFailedCommitList(String repoUuid);

    /**
     * get scan status
     *
     * @param repoUuid repoUuid
     * @return commit_id, status
     */
    List<TwoValue<String, String>> getScanStatusInRepo(String repoUuid);
}
