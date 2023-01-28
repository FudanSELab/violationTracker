package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.issueservice.domain.dbo.Issue;
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
     * 返回开发者参与并且有引入过issue的项目的repoUuid
     *
     * @param developer 开发者
     * @return 返回开发者参与并且有引入过issue的项目的repo_uuid
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
     * 获取指定缺陷id列表的缺陷集
     *
     * @param issueIdList repoUuidList
     * @return 获取指定缺陷id列表的缺陷集
     */
    List<Issue> getIssuesByIds(@Param("issueId_list") List<String> issueIdList);

    /**
     * 返回筛选后issues数量
     *
     * @param query 条件
     * @return 筛选后issues数量
     */
    int getIssueFilterListCount(Map<String, Object> query);

    /**
     * 返回解决issues数量
     *
     * @param query 条件
     * @return 返回解决issues数量
     */
    int getSolvedIssueFilterListCount(Map<String, Object> query);

    /**
     * update issue manual status
     *
     * @param repoUuid     所在repo库
     * @param issueUuid    issueUuid
     * @param manualStatus 要改成的 目标状态 Ignore, Misinformation, To review, Default
     * @param issueType    要忽略的issue 类型
     * @param tool         issue 的检测工具
     * @param currentTime  当前更新记录的时间
     */
    void updateIssueManualStatus(@Param("repoUuid") String repoUuid, @Param("issueUuid") String issueUuid, @Param("manualStatus") String manualStatus,
                                 @Param("issueType") String issueType, @Param("tool") String tool, @Param("currentTime") String currentTime);

    /**
     * 获取自己引入自己解决的issue
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getSelfIntroduceSelfSolvedIssueInfo(Map<String, Object> query);

    /**
     * 获取他人引入自己解决的issue
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getOtherIntroduceSelfSolvedIssueInfo(Map<String, Object> query);

    /**
     * 获取自己引入未解决的issue
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getSelfIntroduceLivingIssueInfo(Map<String, Object> query);

    /**
     * 获取自己引入他人解决的issue
     *
     * @param query condition
     * @return issue date list
     */
    List<Integer> getSelfIntroduceOtherSolvedIssueInfo(Map<String, Object> query);

    /**
     * 获取自己引入自己解决的issue detail
     *
     * @param query condition
     * @return issue detail list
     */
    List<JSONObject> getSelfIntroduceSelfSolvedIssueDetail(Map<String, Object> query);

    /**
     * 获取他人引入自己解决的issue detail
     *
     * @param query condition
     * @return issue detail list
     */
    List<JSONObject> getOtherIntroduceSelfSolvedIssueDetail(Map<String, Object> query);

    /**
     * 获取自己引入未解决的issue detail
     *
     * @param query condition
     * @return issue detail list
     */
    List<JSONObject> getSelfIntroduceLivingIssueDetail(Map<String, Object> query);

    /**
     * 获取自己引入他人解决的issue detail
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
     * 获取自己引入未解决的issue 数量
     *
     * @param query condition
     * @return 按照人员group by的 producer, livingCount
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
    List<Map<String, Object>> getIssueCountByCategoryAndType(Map<String, Object> query);

    /**
     * 获取趋势图数据
     *
     * @param until     until
     * @param projectId projectId
     * @return 获取趋势图数据
     */
    Map<String, Object> getLivingIssueTendency(@Param("until") String until, @Param("projectId") String projectId);

    /**
     * 获取趋势图数据
     *
     * @param until     until
     * @param projectId projectId
     * @return 获取趋势图数据
     */
    List<Map<String, Object>> getLivingIssueTendencyDetail(@Param("until") String until, @Param("projectId") String projectId);


    /**
     * 根据条件筛选issue
     *
     * @param query 条件
     * @return issue列表
     */
    List<Map<String, Object>> getIssueFilterList(Map<String, Object> query);

    /**
     * 返回解决issues列表
     *
     * @param query 条件
     * @return 返回解决issues列表
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
     * 根据 issue uuid 获取 issue 状态
     *
     * @param repoUuid repoUuid
     * @return issue uuids
     */
    Set<String> getSolvedIssueUuidsByRepoUuid(String repoUuid);

    /**
     * @description: 获得最近引入缺陷的时间
     * @return: java.util.Date
     * @time: 2022/1/18 4:33 下午
     */

    Date getLatestIntroduceTime(@Param("developer") String developer);

    /**
     * @description: 获得当前issue为open的数量
     * @return: Integer
     * @time: 2022/2/22 4:33 下午
     */
    Integer getOpenIssueCount(@Param("repoUuid") String repoUuid);

    /**
     * @param issueId         issue的uuid
     * @param status          要修改的状态
     * @param solveCommit     解决的Commit
     * @param solver          解决者
     * @param solveCommitDate 解决Commit日期
     */
    void updateOneIssueAfterMerged(@Param("issueId") String issueId, @Param("status") String status, @Param("solveCommit") String solveCommit, @Param("solver") String solver, @Param("solveCommitDate") Date solveCommitDate);

    List<Issue> getIssuesByRepos(@Param("repos") List<String> repos);

    /**
     * @param repoUuid   项目uuid
     * @param issueTypes 缺陷类型
     * @param file       缺陷所在文件
     * @return 符合条件的缺陷
     */
    List<String> getSolvedIssuesByTypeAndFile(@Param("repoUuid") String repoUuid, @Param("issueTypes") List<String> issueTypes, @Param("file") String file);

    void deleteIssueByRepoUuid(@Param("repoUuid") String repoUuid);

    List<Issue> getIssuesByIdsAndRepo(@Param("issueId_list") List<String> issueIds, @Param("repoUuid") String repoUuid);

    List<Issue> getIssuesByRepo(@Param("repoUuid") String repo);

    /**
     * 获取项目/分支截止until时存活的issue数量
     *
     * @param repoUuids
     * @param until
     * @return map<repoUuid, live count>
     */
    Map<String, Integer> getLiveIssueCount(@Param("repoUuids") List<String> repoUuids, @Param("until") String until);

    /**
     * 获取开发人员截止until时存活的issue数量
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

//    /**
//     * 获取项目/分支截止until时存活的issue数量
//     *
//     * @param repoUuids
//     * @param until
//     * @return map<repoUuid, live count>
//     */
//    Map<String, Integer> getLiveIssueCount(@Param("repoUuids") List<String> repoUuids, @Param("until") String until);
//
//    /**
//     * 获取开发人员截止until时存活的issue数量
//     *
//     * @param repoUuid
//     * @param developers
//     * @param until
//     * @return map<developer, live count>
//     */
//    Map<String, Integer> getLiveIssueCountInDeveloper(@Param("repoUuid") String repoUuid, @Param("developers") List<String> developers, @Param("until") String until);

    /**
     * 获取项目的issue uuid（分类统计）
     *
     * @param repoUuids
     * @param tool
     * @param developers
     * @param categories
     * @param types
     * @param priorities
     * @param since
     * @param until
     * @return
     */
    List<Map<String, Object>> getIssuesInListBoundariesWithUTC(@Param("repoUuids") List<String> repoUuids, @Param("tool") String tool, @Param("developers") List<String> developers, @Param("categories") List<String> categories,
                                                               @Param("types") List<String> types, @Param("priorities") List<Integer> priorities, @Param("since") String since, @Param("until") String until);

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

}
