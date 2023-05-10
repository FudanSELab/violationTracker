package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
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
     * @param issueUuid     issueUuid
     * @param parentCommits parentCommit
     * @return status list
     */
    List<String> getMatchInfoByIssueUuidAndCommitsAndRepo(String issueUuid, @Param("parentCommits") List<String> parentCommits, String repoUuid);

    /**
     * get rawIssueMathcInfos by repoUuid and issueUuid
     *
     * @param issueUuid issueUuid
     * @param repoUuid  repoUuid
     * @return number
     */
    List<RawIssueMatchInfo> getByIssueUuidAndRepoUuid(String issueUuid, String repoUuid);


    /**
     * get the rawIssueMatchInfo by id
     *
     * @param matchIds ids
     * @return RawIssueMatchInfos
     */
    List<RawIssueMatchInfo> getMatchInfosByIds(@Param("matchIds") List<Integer> matchIds);

    /**
     * get the rawIssueMatchInfos by commits
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

    void deleteRawIssueMatchInfoByRepoUuid(String repoUuid);

    int getMatchInfoCount(@Param("repoUuid") String repoUuid);

    /**
     * update solved way
     *
     * @param updateSolveList key RawIssueMatchInfoId value solve_way
     */
    void batchUpdateSolveWay(@Param("list") List<TwoValue<Integer, String>> updateSolveList);

    /**
     * get the rawIssueMatchInfos by repoUuid and status
     *
     * @param repoUuid repoUuid
     * @param statuses status
     * @return list
     */
    List<RawIssueMatchInfo> getMatchInfoByRepoUuidAndStatuses(@Param("repo_uuid") String repoUuid, @Param("statuses") List<String> statuses);

    /**
     * get the rawIssueMatchInfos by repoUuid and status
     *
     * @param repoUuid repoUuid
     * @param statuses
     * @return list
     */
    List<RawIssueMatchInfo> getMatchInfoByRepoUuidAndStatusesWithNullSolvedWay(@Param("repo_uuid") String repoUuid, @Param("statuses") List<String> statuses);
    List<Map<String, String>> getMatchInfoByIssueUuidList(@Param("issue_uuids") List<String> issueUuidList);

}
