package cn.edu.fudan.controller;

import cn.edu.fudan.common.domain.ResponseBean;
import cn.edu.fudan.domain.dbo.RawIssue;
import cn.edu.fudan.domain.vo.IssueTrackerMapVO;
import cn.edu.fudan.service.RawIssueService;
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

    @Autowired
    public void setRawIssueService(RawIssueService rawIssueService) {
        this.rawIssueService = rawIssueService;
    }
}
