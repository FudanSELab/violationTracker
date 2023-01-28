package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.issueservice.domain.dto.AnalysisIssue;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import cn.edu.fudan.common.util.pojo.TwoValue;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * @author beethoven
 * @date 2021-01-19 16:04:34
 */
@Repository
public interface RawIssueMatchInfoMapper {
    /**
     * insert rawIssueMatchInfoList
     *
     * @param list list
     */
    void insertRawIssueMatchInfoList(List<RawIssueMatchInfo> list);

    /**
     * delete rawIssueMatchInfo
     *
     * @param partOfRawIssueIds partOfRawIssueIds
     */
    void deleteRawIssueMatchInfo(@Param("partOfRawIssueIds") List<String> partOfRawIssueIds);

    /**
     * pre Issues
     *
     * @param preCommitParents preCommitParents
     * @return pre Issues
     */
    List<String> getIssueByPreCommits(@Param("preCommitParents") List<String> preCommitParents);

    /**
     * get rawIssueMatchInfo list
     *
     * @param issueUuid issueUuid
     * @return rawIssueMatchInfo list
     */
    List<Map<String, String>> getMatchInfoByIssueUuid(String issueUuid);

    /**
     * get raw issue match info status list
     *
     * @param issueUuid    issueUuid
     * @param parentCommits parentCommit
     * @return status list
     */
    List<String> getMatchInfoByIssueUuidAndCommitsAndRepo(String issueUuid, @Param("parentCommits") List<String> parentCommits, String repoUuid);

    /**
     * 查看某些commit 包含特定 Issue 的匹配状态数量
     *
     * @param issueUuid    issueUuid
     * @param parentCommits parent commits
     * @param repoUuid  repoUuid
     * @return  number
     */
    Integer countByIssueUuidAndCommitsAndRepo(String issueUuid, @Param("parentCommits") List<String> parentCommits, String repoUuid);


    /**
     * 根据Id 得到 RawIssueMatchInfo
     *
     * @param matchIds ids
     * @return RawIssueMatchInfos
     */
    List<RawIssueMatchInfo> getMatchInfosByIds(@Param("matchIds") List<Integer> matchIds);

    /**
     * 根据repoUuid和 commits 得到 RawIssueMatchInfo
     *
     * @param status     status
     * @param commitList commits
     * @return RawIssueMatchInfos
     */
    List<RawIssueMatchInfo> getMatchInfosByStatusAndCommits(@Param("status") String status, @Param("commits") List<String> commitList);

    /**
     * get raw issue match info status list
     *
     * @param issueUuid issueUuid
     * @param commit    commit
     * @return raw issue match info list
     */
    List<RawIssueMatchInfo> getRawIssueMathInfoByIssueAndCommit(String issueUuid, String commit, String repoUuid);

    /**
     * get raw issue match info status list
     *
     * @param curRawIssueUuid curRawIssueUuid
     * @param commit          commit
     * @return raw issue match info list
     */
    List<RawIssueMatchInfo> getMatchInfoByCurRawIssueAndCommit(@Param("curRawIssueUuid") String curRawIssueUuid, @Param("commit") String commit);

    List<RawIssueMatchInfo> getMatchInfoByRepoUuidAndCommit(@Param("repoUuid") String repoUuid, @Param("commit") String commit);

    List<String> getDuplicateCurRawIssue(@Param("repoUuid") String repoUuid, @Param("commit") String commit);

    List<String> getDuplicateCurRawIssueToIssues(@Param("curRawIssueUuid") String curRawIssueUuid);

    RawIssueMatchInfo getMaxIdMatchInfoByIssueUuid(String uuid, String status);


    List<String> getCurCommitsByIssueUuid(String issueUuid);

    /**
     * get rawIssueMatchInfo list
     *
     * @param issueUuids issueUuids
     * @return rawIssueMatchInfo list
     */
    List<Map<String, String>> listMatchInfoByIssueUuids(@Param("issueUuids") List<String> issueUuids);


    List<RawIssueMatchInfo> listRawIssueMatchInfoByRepoAndTime(@Param("repoUuid") String repoUuid,
                                                               @Param("commitTime") String commitTime,
                                                               @Param("issueUuid") String issueUuid);

    /**
     * 获取项目/分支的的issue
     *
     * @param repoUuid
     * @param status
     * @return
     */
    List<AnalysisIssue> getAnalysisIssueInfo(@Param("repoUuid") String repoUuid, @Param("commits") List<String> commits, @Param("status") String status);


    void deleteRawIssueMatchInfoByRepoUuid(String repoUuid);

    int getMatchInfoCount(@Param("repoUuid") String repoUuid);

    /**
     * 根据ID 批量 更新 solve way
     * @param updateSolveList key RawIssueMatchInfoId value solve_way
     */
    void batchUpdateSolveWay(@Param("list") List<TwoValue<Integer, String>> updateSolveList);

    /**
     * 根据uuid 和  status 获取
     * @param repoUuid repoUuid
     * @param type {@link RawIssueStatus#type}
     * @return list
     */
    List<RawIssueMatchInfo> getMatchInfoByRepoUuidAndStatuses(@Param("repo_uuid") String repoUuid, @Param("statuses") List<String> statuses);

    /**
     * 根据uuid 和  status 获取
     * @param repoUuid repoUuid
     * @param type {@link RawIssueStatus#type}
     * @return list
     */
    List<RawIssueMatchInfo> getMatchInfoByRepoUuidAndStatusesWithNullSolvedWay(@Param("repo_uuid") String repoUuid, @Param("statuses") List<String> statuses);
}
