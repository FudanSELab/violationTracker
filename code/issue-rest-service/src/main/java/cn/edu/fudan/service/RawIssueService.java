package cn.edu.fudan.service;


import cn.edu.fudan.domain.dbo.RawIssue;
import cn.edu.fudan.domain.vo.IssueTrackerMapVO;

import java.util.List;

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



}
