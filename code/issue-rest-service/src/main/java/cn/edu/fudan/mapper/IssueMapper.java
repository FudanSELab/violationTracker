package cn.edu.fudan.mapper;

import cn.edu.fudan.domain.dbo.Issue;
import cn.edu.fudan.domain.dbo.IssueWithLocationItem;
import com.alibaba.fastjson.JSONObject;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author beethoven
 */
@Repository
public interface IssueMapper {

    /**
     * insertIssueList
     *
     * @param list get issue list
     */
    void insertIssueList(List<Issue> list);

    /**
     * delete issue by repo id and category
     *
     * @param repoUuid get issue repo id
     * @param tool     get issue tool
     */
    void deleteIssueByRepoUuidAndTool(@Param("repo_uuid") String repoUuid, @Param("tool") String tool);

    /**
     * batch update issue
     *
     * @param issue issue
     */
    void batchUpdateIssue(@Param("issueInfo") Issue issue);

    /**
     * Returns the repoUuid of a project in which the developer participated and had an issue introduced
     *
     * @param developer developer name
     * @return repo uuids
     */
    List<String> getRepoWithIssues(@Param("developer") String developer);

    /**
     * get exist issue types
     *
     * @param tool get issue tool
     * @return List<Issue>
     */
    List<String> getExistIssueTypes(@Param("tool") String tool);

    /**
     * update one issue priority
     *
     * @param issueId  get issue id
     * @param priority get issue priority
     */
    void updateOneIssuePriority(@Param("uuid") String issueId, @Param("priority") int priority);

    /**
     * update one issue status
     *
     * @param issueId      issueUuid
     * @param status       status
     * @param manualStatus manualStatus
     */
    void updateOneIssueStatus(@Param("uuid") String issueId, @Param("status") String status, @Param("manual_status") String manualStatus);

    /**
     * get not solved issue all list by category and repo id
     *
     * @param repoUuids get issue repo id
     * @param tool      get issue type
     * @return List<Issue>
     */
    List<Issue> getNotSolvedIssueAllListByToolAndRepoUuid(@Param("repoUuids") List<String> repoUuids, @Param("tool") String tool);

    /**
     * Obtain the corresponding issue set from the issue id list
     *
     * @param issueIdList repoUuidList
     * @return List<Issue>
     */
    List<Issue> getIssuesByIds(@Param("issueId_list") List<String> issueIdList);

    /**
     * Return the number of surviving violations before the cutoff date, i.e., legacy data.
     * @param query
     * @return
     */
    int getRemainingIssueCountUntil(Map<String, Object> query);

    /**
     * Return the number of filtered issues
     *
     * @param query conditions
     * @return The number of filtered issues
     */
    int getIssueFilterListCount(Map<String, Object> query);

    /**
     * Return the number of solved issues
     *
     * @param query conditions
     * @return The number of solved issues
     */
    int getSolvedIssueFilterListCount(Map<String, Object> query);

    /**
     * update issue manual status
     *
     * @param repoUuid     repoUuid
     * @param issueUuid    issueUuid
     * @param manualStatus Ignore, Misinformation, To review, Default
     * @param issueType    The type of issue need be ignored
     * @param tool         tool name
     * @param currentTime  update time
     */
    void updateIssueManualStatus(@Param("repoUuid") String repoUuid, @Param("issueUuid") String issueUuid, @Param("manualStatus") String manualStatus,
                                 @Param("issueType") String issueType, @Param("tool") String tool, @Param("currentTime") String currentTime);

    /**
     * Self introduce and self solved
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getSelfIntroduceSelfSolvedIssueInfo(Map<String, Object> query);

    /**
     * Other introduce and self solved
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getOtherIntroduceSelfSolvedIssueInfo(Map<String, Object> query);

    /**
     * Self introduce and living now
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getSelfIntroduceLivingIssueInfo(Map<String, Object> query);

    /**
     * Self introduce and other solved
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getSelfIntroduceOtherSolvedIssueInfo(Map<String, Object> query);

    /**
     * Self introduce and self solved(detail)
     *
     * @param query condition
     * @return issue detail list
     */
    List<JSONObject> getSelfIntroduceSelfSolvedIssueDetail(Map<String, Object> query);

    /**
     * Other introduce and self solved(detail)
     *
     * @param query condition
     * @return issue detail list
     */
    List<JSONObject> getOtherIntroduceSelfSolvedIssueDetail(Map<String, Object> query);

    /**
     * Self introduce and living(detail)
     *
     * @param query condition
     * @return issue detail list
     */
    List<JSONObject> getSelfIntroduceLivingIssueDetail(Map<String, Object> query);

    /**
     * Self introduce and other solved(detail)
     *
     * @param query condition
     * @return issue detail list
     */
    List<JSONObject> getSelfIntroduceOtherSolvedIssueDetail(Map<String, Object> query);

    /**
     * issueIntroducers
     *
     * @param repoUuids repoUuid list
     * @return issueIntroducers
     */
    List<String> getIssueIntroducers(@Param("repoUuids") List<String> repoUuids);

    /**
     * get remaining issue count
     *
     * @param repoUuid repoUuid
     * @return issue count
     */
    int getRemainingIssueCount(String repoUuid);

    /**
     * Self introduce and living now
     *
     * @param query condition
     * @return group by producer, livingCount
     */
    List<JSONObject> getSelfIntroduceLivingIssueCount(Map<String, Object> query);

    /**
     * get developer introduced issues
     *
     * @param developer developer
     * @return issues
     */
    List<Issue> getIssueCountByIntroducerAndTool(String developer);

    /**
     * get issue filter info
     *
     * @param query query
     * @return issue filter info
     */
    List<Map<String, Object>> getIssuesOverview(Map<String, Object> query);

    /**
     * get issue count
     *
     * @param query query
     * @return issue count group by type
     */
    List<Map<String, Object>> getIssueByCategoryAndType(Map<String, Object> query);

    /**
     * living issue tendency data
     *
     * @param until     until
     * @param projectId projectId
     * @return living issue tendency data
     */
    Map<String, Object> getLivingIssueTendency(@Param("until") String until, @Param("projectId") String projectId);

    /**
     * get living issue tendency data from issue service
     * @param until
     * @param tool
     * @return
     */
    Map<String, Object> getLivingIssueTendencyInIssueService(@Param("until") String until, @Param("tool") String tool);

    /**
     * living issue tendency data
     *
     * @param until     until
     * @param projectId projectId
     * @return living issue tendency data
     */
    List<Map<String, Object>> getLivingIssueTendencyDetail(@Param("until") String until, @Param("projectId") String projectId);

    /**
     * get living issue tendency data from issue service
     * @param until
     * @param tool
     * @return
     */
    List<Map<String, Object>> getLivingIssueTendencyDetailInIssueService(@Param("until") String until, @Param("tool") String tool);

    /**
     * filter issues
     *
     * @param query conditions
     * @return issue list
     */
    List<Map<String, Object>> getIssueFilterList(Map<String, Object> query);

    /**
     * solved issues
     *
     * @param query conditions
     * @return solved issue list
     */
    List<Map<String, Object>> getSolvedIssueFilterList(Map<String, Object> query);

    /**
     * issues int file
     *
     * @param preFiles files
     * @param repoUuid repo uuid
     * @param toolName tool
     * @return issues
     */
    List<String> getIssuesByFilesToolAndRepo(@Param("preFiles") List<String> preFiles, String repoUuid, String toolName);

    /**
     * eslint ignore
     *
     * @param ignoreFiles ignoreFiles
     * @param repoUuid    repoUuid
     */
    void updateIssuesForIgnore(List<String> ignoreFiles, String repoUuid);

    /**
     * issue count
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return count
     */
    @Select("select count(*) from issue where repo_uuid = #{repoUuid} and tool = #{tool}")
    int getIssueCount(String repoUuid, String tool);


    /**
     * get developers living issues count
     *
     * @param since      since
     * @param until      until
     * @param repoUuid   repoUuid
     * @param developers developers
     * @return developers living issues count
     */
    List<Map<String, Object>> getDeveloperListLivingIssue(String since, String until, String repoUuid, List<String> developers);

    /**
     * obtain issue status by issue uuid
     *
     * @param repoUuid repoUuid
     * @return issue uuids
     */
    Set<String> getSolvedIssueUuidsByRepoUuid(String repoUuid);

    /**
     * @description: recent issue time
     * @return: java.util.Date
     */

    Date getLatestIntroduceTime(@Param("developer") String developer);

    /**
     * @description: living number of current repo
     * @return: Integer
     */
    Integer getOpenIssueCount(@Param("repoUuid") String repoUuid);

    /**
     * @param issueId         issue uuid
     * @param status          new status
     * @param solveCommit     solved commit
     * @param solver          solver
     * @param solveCommitDate solved commit time
     */
    void updateOneIssueAfterMerged(@Param("issueId") String issueId, @Param("status") String status, @Param("solveCommit") String solveCommit, @Param("solver") String solver, @Param("solveCommitDate") Date solveCommitDate);

    List<Issue> getIssuesByRepos(@Param("repos") List<String> repos);

    /**
     * @param repoUuid   repo uuid
     * @param issueTypes issue type
     * @param file       file path
     * @return issue uuid list
     */
    List<String> getSolvedIssuesByTypeAndFile(@Param("repoUuid") String repoUuid, @Param("issueTypes") List<String> issueTypes, @Param("file") String file);

    void deleteIssueByRepoUuid(@Param("repoUuid") String repoUuid);

    List<Issue> getIssuesByIdsAndRepo(@Param("issueId_list") List<String> issueIds, @Param("repoUuid") String repoUuid);

    List<Issue> getIssuesByRepo(@Param("repoUuid") String repo);

    /**
     * living issues of the repos
     *
     * @param repoUuids
     * @param until
     * @return map<repoUuid, live count>
     */
    Map<String, Integer> getLiveIssueCount(@Param("repoUuids") List<String> repoUuids, @Param("until") String until);

    /**
     * living issues of the developers
     *
     * @param repoUuid
     * @param developers
     * @param until
     * @return map<developer, live count>
     */
    Map<String, Integer> getLiveIssueCountInDeveloper(@Param("repoUuid") String repoUuid, @Param("developers") List<String> developers, @Param("until") String until);


    List<Map<String, Object>> getDeveloperImportIssue(Map<String, Object> query);

    List<Map<String, Object>> getDeveloperSolvedIssue(Map<String, Object> query);

    List<Map<String, Object>> getSelfSolve(Map<String, Object> query);

    List<Map<String, Object>> getOtherSolveSelfIntroduce(Map<String, Object> query);

    List<Map<String, Object>> getDeveloperImportIssueByCommit(Map<String, Object> query);

    List<Map<String, Object>> getDeveloperSolveIssueByCommit(Map<String, Object> query);



    /**
     * 获取项目引入的缺陷类型
     *
     * @param repoUuid
     * @param tool
     * @param developer
     * @return
     */
    List<String> getIssueTypes(@Param("repoUuid") String repoUuid, @Param("tool") String tool, @Param("developer") String developer);

    int getIssueCountByStatusAndRepoUuid(String status, String repoUuid);

    /**
     * 获取缺陷uuids
     *
     * @param repoUuid
     * @return
     */
    List<String> getIssueUuidsByRepoUuid(@Param("repoUuid") String repoUuid, @Param("tool") String tool);

    /**
     * 获取issue的type
     *
     * @param repoUuid
     * @param tool
     * @param issueUuids
     * @return
     */
    List<Map<String, String>> getIssueTypesInUuids(@Param("repoUuid") String repoUuid, @Param("tool") String tool, @Param("issueUuids") List<String> issueUuids);

    /**
     * 获取 READY / BETA / DEPRECATED 类型的 issue uuid
     *
     * @param repoUuids
     * @param tool
     * @param issueTypeStatus
     * @return
     */
    List<String> getIssueUuidsByIssueTypeStatus(@Param("repoUuids") List<String> repoUuids, @Param("tool") String tool, @Param("issueTypeStatus") String issueTypeStatus);

    /**
     * Issues resolved in the commit
     * @param repoUuid repo uuid
     * @param commitId solved commit
     * @param filePath file path
     * @return issue list
     */
    List<IssueWithLocationItem> getIssuesSolvedInCommitIdByConditions(@Param("repoUuid") String repoUuid, @Param("commitId") String commitId,
                                                                      @Param("filePath") String filePath);

    /**
     * Issues that still exist in the commit
     * @param repoUuid repo uuid
     * @param commitId commit id
     * @param filePath file path
     * @return issue list
     */
    List<IssueWithLocationItem> getIssuesInCommitIdByConditions(@Param("repoUuid") String repoUuid, @Param("commitId") String commitId,
                                                                @Param("filePath") String filePath);

    List<Issue> getIssuesByFileToolAndRepo(@Param("filePath") String filePath, @Param("repoUuid") String repoUuid, @Param("tool") String tool);


    List<Map<String, Object>> getIssueByCategoryAndTypeAndSolveWay(Map<String, Object> query);

}
