package cn.edu.fudan.issueservice.controller;

import cn.edu.fudan.issueservice.domain.ResponseBean;
import cn.edu.fudan.issueservice.domain.vo. IssueTrackerMapVO;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.service.RawIssueService;
import com.alibaba.fastjson.JSONObject;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * @author Beethoven
 */
@Slf4j
@RestController
@Api(value = "rawIssue", tags = {"APIs for counting rawIssue."})
public class RawIssueController {

    private static final String SUCCESS = "success";
    private static final String FAILED = "failed ";
    private RawIssueService rawIssueService;

    @ApiOperation(value = "Filter rawIssue based on issue_uuid.", notes = "@return List<RawIssue>", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "issue_uuid", value = "issue的uuid", required = true)
    })
    @GetMapping(value = {"/raw-issue"})
    public ResponseBean<List<RawIssue>> getRawIssueList(@RequestParam("issue_uuid") String issueUuid) {
        try {
            return new ResponseBean<>(200, SUCCESS, rawIssueService.getRawIssueByIssueUuid(issueUuid));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Get detailed information of raw_issue based on issue_uuid.", notes = "@return String", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "issue_uuid", value = "issue的uuid", required = true)
    })
    @GetMapping(value = {"/raw-issue-detail"})
    public ResponseBean<String> getRawIssueDetail(@RequestParam("issue_uuid") String issueUuid) {
        try {
            return new ResponseBean<>(200, SUCCESS, rawIssueService.getRawIssueDetailByIssueUuid(issueUuid));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }


    @GetMapping("/raw-issue/snapshot")
    public ResponseBean<List<RawIssue>> getRawIssuesInCommit(@RequestParam(name = "repo_uuid") String repoUuid,
                                                             @RequestParam(name = "commit_id") String commit,
                                                             @RequestParam(name = "tool") String tool) {
        return new ResponseBean<>(200, SUCCESS, rawIssueService.getRawIssuesInCommit(repoUuid, commit, tool));
    }

    @ApiOperation(value = "Get the complete trace chain (graph) information based on issue information or node information.",
            notes = "@return  IssueTrackerMapVO", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "repo_uuid", value = "repo_uuid", dataType = "String"),
            @ApiImplicitParam(name = "issue_uuid", value = "issue_uuid", dataType = "String"),
            @ApiImplicitParam(name = "page", value = "page number", dataType = "Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "ps", value = "page size, the default is 20 per page."),
            @ApiImplicitParam(name = "show_all", value = "是否展示所有commit，若为否,则只展示部分commit和间接父子关系", dataType = "String", defaultValue = "false")
    })
    @GetMapping(value = {"/issue/tracker-map"})
    public ResponseBean<IssueTrackerMapVO> getTrackerMap(@RequestParam(value = "repo_uuid", required = false) String repoUuid,
                                                         @RequestParam(value = "issue_uuid", required = false) String issueUuid,
                                                         @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
                                                         @RequestParam(value = "ps", required = false, defaultValue = "20") Integer ps,
                                                         @RequestParam(value = "show_all", required = false, defaultValue = "false") Boolean showAll) {
        try {
            IssueTrackerMapVO data = rawIssueService.getTrackerMap(repoUuid, issueUuid,  page, ps, showAll);
            return new ResponseBean<>(200, SUCCESS, data);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, e.getMessage(), null);
        }
    }

    @Autowired
    public void setRawIssueService(RawIssueService rawIssueService) {
        this.rawIssueService = rawIssueService;
    }
}
