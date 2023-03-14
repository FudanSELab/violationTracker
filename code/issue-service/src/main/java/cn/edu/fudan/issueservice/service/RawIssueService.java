package cn.edu.fudan.issueservice.service;

import cn.edu.fudan.issueservice.domain.vo.IssueTrackerMapVO;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import com.alibaba.fastjson.JSONObject;

import java.util.List;
import java.util.Map;

/**
 * @author WZY
 * @version 1.0
 **/
public interface RawIssueService {

    /**
     * get rawIssueList by uuid
     *
     * @param issueId issue_uuid
     * @return rawIssueList
     */
    List<RawIssue> getRawIssueByIssueUuid(String issueId);

    List<RawIssue> getRawIssueByIssueUuids(List<String> issueUuids);
    /**
     * @param issueId
     * @description:
     * @return:java.lang.String
     * @author:keyon
     */
    String getRawIssueDetailByIssueUuid(String issueId);


    List<RawIssue> getRawIssuesInCommit(String repoUuid, String commit, String tool);


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
