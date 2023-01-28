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
     * 根据issueId返回rawIssueList
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
     * @time:2021/11/29 7:56 下午
     */
    String getRawIssueDetailByIssueUuid(String issueId);


    List<RawIssue> getRawIssuesInCommit(String repoUuid, String commit, String tool);


    /**
     * 文件级别issue追溯图
     *
     * @param repoUuid  项目uuid
     * @param issueUuid issue uuid
     * @param page      页码
     * @param ps        每页条数
     * @param showAll   是否显示全部数据
     * @return issue历史追溯图
     */
    IssueTrackerMapVO getTrackerMap(String repoUuid, String issueUuid, Integer page, Integer ps, Boolean showAll);

}
