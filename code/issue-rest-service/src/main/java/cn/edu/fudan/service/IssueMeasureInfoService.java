package cn.edu.fudan.service;


import cn.edu.fudan.domain.vo.IssueTrackerMapVO;

/**
 * @author beethoven
 */
public interface IssueMeasureInfoService {


    /**
     * living violation tendency
     *
     * @param since      since
     * @param until      until
     * @param projectIds repo uuids
     * @param interval   interval
     * @param showDetail show detail?
     * @return living violation tendency
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
