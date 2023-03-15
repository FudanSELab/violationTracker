package cn.edu.fudan.service;


import cn.edu.fudan.domain.vo.IssueTrackerMapVO;

/**
 * @author beethoven
 */
public interface IssueMeasureInfoService {


    /**
     * 指定某些项目的留存缺陷数的趋势统计图数据
     *
     * @param since      since
     * @param until      until
     * @param projectIds 项目ids
     * @param interval   时间粒度
     * @param showDetail 是否展示细节
     * @return 指定某些项目的留存缺陷数的趋势统计图数据
     */
    Object getLivingIssueTendency(String since, String until, String projectIds, String interval, String showDetail);


    /**
     * tracker map
     *
     * @param repoUuid  repo uuid
     * @param issueUuid issue uuid
     * @param page      page number
     * @param ps        page size
     * @param showAll   Whether to display all revisions data
     * @return issue tracker map
     */
    IssueTrackerMapVO getTrackerMap(String repoUuid, String issueUuid, Integer page, Integer ps, Boolean showAll);
}
