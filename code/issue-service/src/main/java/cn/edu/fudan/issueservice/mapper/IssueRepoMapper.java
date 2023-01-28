package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;

/**
 * @author beethoven
 */
@Repository
public interface IssueRepoMapper {

    /**
     * 插入issueRepo
     *
     * @param issueRepo issueRepo
     */
    void insertOneIssueRepo(@Param("issueRepo") RepoScan issueRepo);

    /**
     * 更新issueRepo
     *
     * @param issueRepo issueRepo
     */
    void updateIssueRepo(@Param("issueRepo") RepoScan issueRepo);

    /**
     * 获取issueRepo
     *
     * @param repoId repoUuid
     * @param tool   tool
     * @return issueRepo list
     */
    List<RepoScan> getIssueRepoByCondition(@Param("repoUuid") String repoId, @Param("tool") String tool);

    /**
     * 删除issueRepo
     *
     * @param repoId repoUuid
     * @param tool   tool
     */
    void deleteIssueRepoByCondition(@Param("repo_uuid") String repoId, @Param("tool") String tool);

    /**
     * 返回没扫描commit数
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return 没扫描commit数
     */
    List<HashMap<String, Integer>> getNotScanCommitsCount(@Param("repoUuid") String repoUuid, @Param("tool") String tool);

    /**
     * 获取main issueRepo
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return main issueRepo
     */
    RepoScan getMainIssueRepo(String repoUuid, String tool);

    /**
     * get repo scan info
     *
     * @param repoUuid
     * @param tool
     * @return
     */
    RepoScan getRepoScan(String repoUuid, String tool);

    /**
     * 获取开始扫描的commit 时间
     * @param repoUuid
     * @param tool
     * @return
     */
    String getStartCommitTime(@Param("repoUuid") String repoUuid, @Param("tool")String tool);

    /**
     * 获取开始扫描的 commit id
     * @param repoUuid
     * @param tool
     * @return
     */
    String getStartCommit(@Param("repoUuid") String repoUuid, @Param("tool") String tool);

    /**
     * 获取开始扫描的 commit ids
     *
     * @param repoUuids
     * @param tool
     * @return
     */

    List<String> getStartCommits(@Param("repoUuids") List<String> repoUuids, @Param("tool") String tool);

    /**
     * 获取正在扫描的 repo 数据
     * @return
     */
    List<RepoScan> getScanningRepos();

}
