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
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     */
    void deleteIssueByRepoIdAndTool(String repoUuid, String tool);


    /**
     *
     * @param tool tool
     * @return all issue types
     */
    List<String> getExistIssueTypes(String tool);

    /**
     *
     * @param repoUuids repo_uuids
     * @param since     since
     * @param until     until
     * @param tool      tool
     * @return
     */
    List<Map<String, Object>> getRepoIssueCounts(List<String> repoUuids, String since, String until, String tool);

    /**
     * violation severities
     *
     * @return severity list
     */
    List<String> getIssueSeverities();

    /**
     * violation statuses
     *
     * @return status list
     */
    List<String> getIssueStatus();

    /**
     * developers who have introduced some violations
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
     * count violations by condition
     *
     * @param query query
     * @return violation list size
     */
    Map<String, Object> getIssueFilterListCount(Map<String, Object> query);

    /**
     * filter violations by condition
     *
     * @param query           query
     * @param issueFilterList issueFilterList
     * @return issuesList
     */
    Map<String, Object> getIssueFilterList(Map<String, Object> query, Map<String, Object> issueFilterList);

    /**
     * violation details
     *
     * @param query           query
     * @param issueFilterList result list
     * @return IssueFilterListWithDetail
     */
    Map<String, Object> getIssueFilterListWithDetail(Map<String, Object> query, Map<String, Object> issueFilterList);

    /**
     * developer risk
     *
     * @param repoList  repoList
     * @param developer developer
     * @param asc       asc
     * @param page      page
     * @param ps        ps
     * @return
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

    Object getLivingIssueTendency(String beginDate, String endDate, String projectIds, String interval, String showDetail);

    PagedGridResult<IssueWithLocationItem> getFileIssues(String repoUuid, String commitId, String filePath, boolean closed);

}
