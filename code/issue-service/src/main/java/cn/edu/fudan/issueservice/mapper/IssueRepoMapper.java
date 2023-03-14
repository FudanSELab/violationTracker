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
     * insert one issueRepo
     *
     * @param issueRepo issueRepo
     */
    void insertOneIssueRepo(@Param("issueRepo") RepoScan issueRepo);

    /**
     * update one issueRepo
     *
     * @param issueRepo issueRepo
     */
    void updateIssueRepo(@Param("issueRepo") RepoScan issueRepo);

    /**
     * get issueRepos by condition
     *
     * @param repoId repoUuid
     * @param tool   tool
     * @return issueRepo list
     */
    List<RepoScan> getIssueRepoByCondition(@Param("repoUuid") String repoId, @Param("tool") String tool);

    /**
     * delete issueRepos by condition
     *
     * @param repoId repoUuid
     * @param tool   tool
     */
    void deleteIssueRepoByCondition(@Param("repo_uuid") String repoId, @Param("tool") String tool, @Param("status") String status);

    /**
     * returns the number of commits that have not scanned
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return key: repo uuid, value: the number of commits
     */
    List<HashMap<String, Integer>> getNotScanCommitsCount(@Param("repoUuid") String repoUuid, @Param("tool") String tool);

    /**
     * get main issueRepo
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
     * get start commit time
     *
     * @param repoUuid
     * @param tool
     * @return
     */
    String getStartCommitTime(@Param("repoUuid") String repoUuid, @Param("tool") String tool);

    /**
     * get start commit
     *
     * @param repoUuid
     * @param tool
     * @return
     */
    String getStartCommit(@Param("repoUuid") String repoUuid, @Param("tool") String tool);

    /**
     * get start commits
     *
     * @param repoUuids
     * @param tool
     * @return key: repo uuid, value: start commit
     */

    List<String> getStartCommits(@Param("repoUuids") List<String> repoUuids, @Param("tool") String tool);

    /**
     * get repoScan by condition
     *
     * @return
     */
    List<RepoScan> getReposByScanStatus(@Param("status") String status, @Param("tool") String tool);

    List<RepoScan> getRepoScanByStatus(@Param("status") String status);

    void insertIssueRepos(@Param("repoScanList") List<RepoScan> repoScanList);

}
