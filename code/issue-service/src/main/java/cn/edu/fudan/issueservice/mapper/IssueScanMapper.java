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
     * 插入issueScan
     *
     * @param scan issueScan
     */
    void insertOneScan(IssueScan scan);

    /**
     * 删除issueScan
     *
     * @param repoId repoUuid
     * @param tool   tool
     */
    void deleteIssueScanByRepoIdAndTool(@Param("repo_uuid") String repoId, @Param("tool") String tool);

    /**
     * 获取issueScan
     *
     * @param repoId     repoUuid
     * @param statusList statusList
     * @param tool       tool
     * @return issueScan
     */
    List<IssueScan> getIssueScanByRepoIdAndStatusAndTool(@Param("repo_uuid") String repoId, @Param("statusList") List<String> statusList, @Param("tool") String tool);

    /**
     * 获取issueScan
     *
     * @param repoId   repoUuid
     * @param commitId commitId
     * @param tool     tool
     * @param since    since
     * @param until    until
     * @return issueScan
     */
    List<IssueScan> getIssueScanByRepoIdAndCommitIdAndTool(@Param("repo_uuid") String repoId, @Param("commit_id") String commitId, @Param("tool") String tool,
                                                           @Param("since") String since, @Param("until") String until);

    /**
     * 获取issueScan
     *
     * @param repoId repoUuid
     * @param tool   tool
     * @return issueScan
     */
    IssueScan getLatestIssueScanByRepoIdAndTool(@Param("repo_uuid") String repoId, @Param("tool") String tool);

    /**
     * 获取扫描过的issueScan记录
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return 扫描过的issueScan记录
     */
    List<String> getScannedCommitList(String repoUuid, String tool);


    /**
     * 包含 parent_commit 信息
     * @param repoUuid
     * @return
     */
    List<Commit> getAllCommitsWithParents(@Param("repoUuid") String repoUuid, @Param("since") String since,@Param("until") String until);

    /**
     * 获取扫描失败的commit list
     *
     * @param repoUuid
     * @return first commit_id  second commit_time
     */
    List<TwoValue<String, String>> getScanFailedCommitList(String repoUuid);

    /**
     * 获取扫描状态
     *
     * @param repoUuid repoUuid
     * @return commit_id, status
     */
    List<TwoValue<String, String>> getScanStatusInRepo(String repoUuid);
}
