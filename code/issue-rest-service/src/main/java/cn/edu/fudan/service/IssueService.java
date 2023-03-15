package cn.edu.fudan.service;

import cn.edu.fudan.domain.dbo.IssueWithLocationItem;
import cn.edu.fudan.domain.vo.*;

import java.util.List;
import java.util.Map;

/**
 * @author Beethoven
 */
public interface IssueService {

    /**
     * 根据repoUuid和tool删除对应issue
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     */
    void deleteIssueByRepoIdAndTool(String repoUuid, String tool);


    /**
     * 根据缺陷扫描工具获取该工具下扫描的所有的issue类型
     *
     * @param tool tool
     * @return 所有的issue类型
     */
    List<String> getExistIssueTypes(String tool);

    /**
     * 更新缺陷优先级
     *
     * @param issueUuid issueUuid
     * @param priority  优先级
     * @param token     token
     * @throws Exception 异常
     */
    void updatePriority(String issueUuid, String priority, String token) throws Exception;

    /**
     * 修改Issue的状态
     *
     * @param issueUuid    issueUuid
     * @param status       状态
     * @param manualStatus manualStatus
     */
    void updateStatus(String issueUuid, String status, String manualStatus);

    /**
     * 项目详情页面的issueCount每日数据
     *
     * @param repoUuids repo_uuids
     * @param since     since
     * @param until     until
     * @param tool      tool
     * @return 项目详情页面的issueCount每日数据
     */
    List<Map<String, Object>> getRepoIssueCounts(List<String> repoUuids, String since, String until, String tool);

    /**
     * 获取缺陷严重程度列表
     *
     * @return 获取缺陷严重程度列表
     */
    List<String> getIssueSeverities();

    /**
     * 获取缺陷的状态列表
     *
     * @return 缺陷的状态列表
     */
    List<String> getIssueStatus();

    /**
     * 获取引入过缺陷的所有开发者姓名列表
     *
     * @param repoUuids repoUuid list
     * @return issueIntroducers
     */
    List<String> getIssueIntroducers(List<String> repoUuids);

    /**
     * get issue filter sidebar
     *
     * @param query query
     * @return sidebar
     */
    List<IssueFilterSidebarVO> getIssuesFilterSidebar(Map<String, Object> query);

    /**
     * 返回issue总数
     *
     * @param query 条件
     * @return issue总数
     */
    Map<String, Object> getIssueFilterListCount(Map<String, Object> query);

    /**
     * 根据query获取issuesList
     *
     * @param query           条件
     * @param issueFilterList issueFilterList
     * @return issuesList
     */
    Map<String, Object> getIssueFilterList(Map<String, Object> query, Map<String, Object> issueFilterList);

    /**
     * 返回缺陷详情 由于只有open的issue才有location，所以去除solved issues
     *
     * @param query           条件
     * @param issueFilterList 结果
     * @return IssueFilterListWithDetail
     */
    Map<String, Object> getIssueFilterListWithDetail(Map<String, Object> query, Map<String, Object> issueFilterList);

    /**
     * 开发者风险页面
     *
     * @param repoList  repoList
     * @param developer developer
     * @param asc       asc
     * @param page      page
     * @param ps        ps
     * @return 开发者风险页面
     */
    Map<String, Object> getIssueRiskByDeveloper(List<String> repoList, String developer, Boolean asc, int page, int ps, int level);

    /**
     * @description:
     * @param: [repo_uuids]
     * @return: List<Map < String, String>>
     * @time : 2022/1/25 1:08 下午
     */
    List<Map<String, String>> getOpenIssues(List<String> repoUuid);

    List<String> getRepoListByUrlProjectNamesRepoUuids(String url, String projectNames, String repoUuids, String userToken);

    PagedGridResult<DeveloperIssueVO> getDeveloperImportIssue(String repoUuids, String developers, String facets, String since, String until, String tool, int page, int ps, String identity);

    PagedGridResult<DeveloperIssueVO> getRelationToOthers(String repoUuids, String developers, String facets, String identity, boolean isSelf, String since, String until, String tool, int page, int ps);

    PagedGridResult<DeveloperMapVO> getMapOthers(String repoUuids, String developers, String facets, String identity, boolean isSelf, String since, String until, String tool, int page, int ps);

    PagedGridResult<DeveloperIssueVO> getDeveloperIssueByCommit(String repoUuids, String developers, String facets, String identity, String since, String until, String tool, int page, int ps);

    public Object getLivingIssueTendency(String beginDate, String endDate, String projectIds, String interval, String showDetail);

    PagedGridResult<IssueWithLocationItem> getFileIssues(String repoUuid, String commitId, String filePath);

}
