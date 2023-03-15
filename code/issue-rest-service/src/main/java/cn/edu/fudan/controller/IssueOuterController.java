package cn.edu.fudan.controller;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.domain.ResponseBean;
import cn.edu.fudan.domain.dbo.IssueWithLocationItem;
import cn.edu.fudan.domain.enums.IssuePriorityEnums;
import cn.edu.fudan.domain.enums.SolveWayEnum;
import cn.edu.fudan.domain.enums.ToolEnum;
import cn.edu.fudan.domain.vo.*;
import cn.edu.fudan.service.*;
import cn.edu.fudan.util.DateTimeUtil;
import cn.edu.fudan.util.StringsUtil;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.*;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc Statistics APIs
 * @date 2023/3/14 14:47
 */

@Api(value = "issue outer", tags = {"The APIS used to request issue information"})
@Slf4j
@RestController
public class IssueOuterController {

    private static final String SUCCESS = "success";
    private static final String FAILED = "failed ";
    private static final String TOKEN = "token";
    private static final String TIME_FORMAT_ERROR = "time format error";
    private static final String TIME_ERROR_MESSAGE = "The input time format error,should be yyyy-MM-dd.";
    private static final String PARAMETER_IS_EMPTY = "parameter is empty";
    private static final String SINCE = "since";
    private static final String UNTIL = "until";
    private static final String STATUS = "status";
    private static final String REPO_LIST = "repoList";
    private static final String PRIORITY = "priority";
    private static final String TOOLS = "tools";
    private static final String MANUAL_STATUS = "manualStatus";
    private static final String PRODUCER = "producer";
    private static final String UUID = "uuid";
    private static final String SOLVED_TYPE = "solvedTypes";
    private static final String DEFAULT_SINCE = "1990-01-01";
    private IssueService issueService;
    private IssueScanService issueScanService;

    private IssueMeasureInfoService issueMeasureInfoService;
    private CodeService codeService;
    private RedisService redisService;

    @ApiOperation(value = "Get all the issue types of the tool", notes = "@return  List < String > ", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "tool", value = "tool name", defaultValue = "sonarqube", allowableValues = "sonarqube , ESLint")
    })
    @GetMapping(value = {"/issue/issue-types"})
    public ResponseBean<List<String>> getExistIssueTypes(@RequestParam(name = "tool", defaultValue = "sonarqube") String tool) {
        if (!ToolEnum.toolIsLegal(tool)) {
            return new ResponseBean<>(400, FAILED + "tool is illegal!", null);
        }
        try {
            return new ResponseBean<>(200, SUCCESS, issueService.getExistIssueTypes(tool));
        } catch (Exception e) {
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Get the severities of the issues", notes = "@return  List < String >", httpMethod = "GET")
    @GetMapping(value = {"/issue/issue-severities"})
    public ResponseBean<List<String>> getIssueSeverities() {
        try {
            return new ResponseBean<>(200, SUCCESS, issueService.getIssueSeverities());
        } catch (Exception e) {
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Get the statuses of the issues", notes = "@return List < String >", httpMethod = "GET")
    @GetMapping(value = {"/issue/issue-status"})
    public ResponseBean<List<String>> getIssueStatus() {
        try {
            return new ResponseBean<>(200, SUCCESS, issueService.getIssueStatus());
        } catch (Exception e) {
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Get a list of issues based on conditions", notes = "@return Map<String, Object>\n{\n\"total\": 59,\n" +
            "        \"totalPage\": 59,\n\"issueList\": [{}],\n\"issueListSortByType\":[\"\":{}]\n}", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "project_name", value = "Project name\nSupport multiple items with commas as separators"),
            @ApiImplicitParam(name = "repo_uuids", value = "UUIDS for the repositories\nUse commas as separators"),
            @ApiImplicitParam(name = "since", value = "Since when\nFormat: yyyy-MM-dd"),
            @ApiImplicitParam(name = "until", value = "Until when\nFormat: yyyy-MM-dd"),
            @ApiImplicitParam(name = "tool", value = "Tool name", defaultValue = "sonarqube,ESLint,TscanCode", allowableValues = "sonarqube , ESLint , TscanCode"),
            @ApiImplicitParam(name = "types", value = "Issue types\nUse commas as separators"),
            @ApiImplicitParam(name = "page", value = "Page number", defaultValue = "1"),
            @ApiImplicitParam(name = "ps", value = "Page size\nRange 0-100", defaultValue = "10"),
            @ApiImplicitParam(name = "status", value = "Issue status\nUse commas as separators", allowableValues = "Open , Solved , Misinformation , To_Review , Ignore"),
            @ApiImplicitParam(name = "introducer", value = "Producer\nUse commas as separators"),
            @ApiImplicitParam(name = "solver", value = "Solver\nUse commas as separators"),
            @ApiImplicitParam(name = "category", value = "Issue category", allowableValues = "Code smell , Bug"),
            @ApiImplicitParam(name = "priority", value = "Issue severity", allowableValues = "Low , Urgent , Normal , High , Immediate"),
            @ApiImplicitParam(name = "file_paths", value = "File paths\nUse commas as separators"),
            @ApiImplicitParam(name = "url", value = "Repository url"),
            @ApiImplicitParam(name = "commit", value = "Commit id\nThe default value is the recent commit"),
            @ApiImplicitParam(name = "detail", defaultValue = "false", allowableValues = "true , false"),
            @ApiImplicitParam(name = "asc", defaultValue = "false",allowableValues = "true , false"),
            @ApiImplicitParam(name = "order", defaultValue = "no", allowableValues = "no , quantity , open , solved"),
            @ApiImplicitParam(name = "issue_uuids", value = "Issue uuids\nUse commas as separators"),
            @ApiImplicitParam(name = "manual_status", defaultValue = "Default", allowableValues = "Ignore , Misinformation , To_Review , Default"),
            @ApiImplicitParam(name = "solved_types", value = "Solved issue types\nUse commas as separators")
    })
    @GetMapping(value = {"/issue/filter"})
    public ResponseBean<Map<String, Object>> filterIssues(HttpServletRequest request,
                                                          @RequestParam(value = "project_names", required = false) String projectNames,
                                                          @RequestParam(value = "repo_uuids", required = false) String repoUuids,
                                                          @RequestParam(value = "since", required = false) String since,
                                                          @RequestParam(value = "until", required = false) String until,
                                                          @RequestParam(value = "tool", required = false) String toolName,
                                                          @RequestParam(value = "types", required = false) String type,
                                                          @RequestParam(value = "page", required = false, defaultValue = "1") int page,
                                                          @RequestParam(value = "ps", required = false, defaultValue = "10") int ps,
                                                          @RequestParam(value = "status", required = false) String status,
                                                          @RequestParam(value = "introducer", required = false) String introducers,
                                                          @RequestParam(value = "solver", required = false) String solver,
                                                          @RequestParam(value = "category", required = false) String category,
                                                          @RequestParam(value = "priority", required = false) String priority,
                                                          @RequestParam(value = "file_paths", required = false) String filesPath,
                                                          @RequestParam(value = "url", required = false) String url,
                                                          @RequestParam(value = "commit", required = false) String commit,
                                                          @RequestParam(value = "detail", required = false, defaultValue = "false") Boolean detail,
                                                          @RequestParam(value = "asc", required = false, defaultValue = "true") Boolean asc,
                                                          @RequestParam(value = "order", required = false) String order,
                                                          @RequestParam(value = "issue_uuids", required = false) String issueUuids,
                                                          @RequestParam(value = "manual_status", required = false, defaultValue = "Default") String manualStatus,
                                                          @RequestParam(value = "solved_types", required = false) String solvedType,
                                                          @RequestParam(value = "tag", required = false) String tagIds,
                                                          @RequestParam(value = "exclude", required = false, defaultValue = "false") Boolean exclude) {
        String userToken = request.getHeader(TOKEN);

        Map<String, Object> query = new HashMap<>(32);

        if (ps < 0 || ps > 100) {
            return new ResponseBean<>(400, FAILED + "page size should in [0,100]!", null);
        }

        if (TIME_FORMAT_ERROR.equals(DateTimeUtil.timeFormatIsLegal(since, false)) || TIME_FORMAT_ERROR.equals(DateTimeUtil.timeFormatIsLegal(until, true))) {
            return new ResponseBean<>(400, FAILED + TIME_ERROR_MESSAGE, null);
        }

        if (!StringUtils.isEmpty(priority)) {
            query.put(PRIORITY, Objects.requireNonNull(IssuePriorityEnums.JavaIssuePriorityEnum.getPriorityEnum(priority)).getRank());
        }

        try {
            List<String> repoList = issueService.getRepoListByUrlProjectNamesRepoUuids(url, projectNames, repoUuids, userToken);
            query.put(REPO_LIST, repoList);
        } catch (Exception e) {
            return new ResponseBean<>(400, FAILED + e.getMessage(), null);
        }
        String[] queryName = {STATUS, "filesPath", "issueUuids"};
        String[] spiltStrings = {status, filesPath, issueUuids};
        StringsUtil.splitString(queryName, spiltStrings, query);
        if (!StringUtils.isEmpty(type)) {
            List<String> types = new ArrayList<>();
            types.add(type);
            query.put("types",types);
        }
        List<String> solvedTypes = new ArrayList<>();
        if (!StringUtils.isEmpty(solvedType)) {
            if ("deleted".equals(solvedType)) {
                solvedTypes.add(SolveWayEnum.FILE_DELETE.lowercase);
                solvedTypes.add(SolveWayEnum.ANCHOR_DELETE.lowercase);
            } else {
                solvedTypes.add(SolveWayEnum.CODE_CHANGE.lowercase);
                solvedTypes.add(SolveWayEnum.CODE_RELATED_CHANGE.lowercase);
                solvedTypes.add(SolveWayEnum.CODE_UNRELATED_CHANGE.lowercase);
                solvedTypes.add(SolveWayEnum.CODE_DELETE.lowercase);
            }
        }
        query.put(SINCE, since);
        query.put(UNTIL, DateTimeUtil.datePlus(until));
        query.put("category", category);
        query.put("toolName", toolName);
        query.put("developer", StringsUtil.splitStringList(introducers));
        query.put("commit", commit);
        query.put("start", (page - 1) * ps);
        query.put("solver", solver);
        query.put("ps", ps);
        query.put("asc", asc);
        query.put("detail", detail);
        if ("id".equals(order)) {
            order = "displayId";
        }
        query.put("order", order);
        query.put("manual_status", manualStatus);
        query.put(SOLVED_TYPE, solvedTypes);
        // step1 ps = 0 only return total(because fetch time --)  or  ps != 0 do select;
        Map<String, Object> issueFilterList = issueService.getIssueFilterListCount(query);
        if (ps == 0) {
            return new ResponseBean<>(200, SUCCESS, issueFilterList);
        }
        // step2 select issueList (always(since,until,status,types,filesPath,repoList,priority,toolName,start,ps,category) and
        //                        options(commit ? do select commit : pass)(solver ? select introducer and solver : select introducer))
        issueFilterList = issueService.getIssueFilterList(query, issueFilterList);
        // step3 final check detail
        issueFilterList = issueService.getIssueFilterListWithDetail(query, issueFilterList);

        return new ResponseBean<>(200, SUCCESS, issueFilterList);
    }

    @ApiOperation(value = "Issue overview sidebar", notes = "@return IssueFilterSidebar", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "project_names", value = "Project name\nSupport multiple items with commas as separators"),
            @ApiImplicitParam(name = "repo_uuids", value = "UUIDS for the repositories\nUse commas as separators"),
            @ApiImplicitParam(name = "since", value = "Since when\nFormat: yyyy-MM-dd"),
            @ApiImplicitParam(name = "until", value = "Until when\nFormat: yyyy-MM-dd"),
            @ApiImplicitParam(name = "tools", value = "Tool name", defaultValue = "sonarqube,ESLint,TscanCode", allowableValues = "sonarqube , ESLint , TscanCode"),
            @ApiImplicitParam(name = "status", value = "Issue status", allowableValues = "Open , Solved , Misinformation , To_Review , Ignore"),
            @ApiImplicitParam(name = "producer", value = "Producer\nUse commas as separators"),
            @ApiImplicitParam(name = "priority", value = "Priority", allowableValues = "Low , Urgent , Normal , High , Immediate"),
            @ApiImplicitParam(name = "issue_uuids", value = "Issue uuids\nUse commas as separators"),
            @ApiImplicitParam(name = "manual_status", value = "manual status", defaultValue = "Default", allowableValues = "Ignore , Default"),
            @ApiImplicitParam(name = "solved_types", value = "Solved issue types"),
    })
    @GetMapping(value = "issue/filter/sidebar")
    public ResponseBean<List<IssueFilterSidebarVO>> getIssueFilterSidebar(@RequestParam(value = "project_names", required = false) String projectNames,
                                                                          @RequestParam(value = "repo_uuids", required = false) String repoUuids,
                                                                          @RequestParam(value = "tools", required = false, defaultValue = "sonarqube,ESLint,TscanCode") String tools,
                                                                          @RequestParam(value = "since", required = false) String since,
                                                                          @RequestParam(value = "until", required = false) String until,
                                                                          @RequestParam(value = "status", required = false) String status,
                                                                          @RequestParam(value = "manual_status", required = false, defaultValue = "Default") String manualStatus,
                                                                          @RequestParam(value = "priority", required = false) String priority,
                                                                          @RequestParam(value = "introducer", required = false) String introducer,
                                                                          @RequestParam(value = "issue_uuids", required = false) String issueUuids,
                                                                          @RequestParam(value = "solved_types", required = false) String solvedType,
                                                                          HttpServletRequest httpServletRequest) {
        Map<String, Object> query = new HashMap<>(16);
        if (TIME_FORMAT_ERROR.equals(DateTimeUtil.timeFormatIsLegal(since, false)) || TIME_FORMAT_ERROR.equals(DateTimeUtil.timeFormatIsLegal(until, true))) {
            return new ResponseBean<>(400, TIME_FORMAT_ERROR, null);
        }

        String token = httpServletRequest.getHeader(TOKEN);
        List<String> repoList = issueService.getRepoListByUrlProjectNamesRepoUuids(null, projectNames, repoUuids, token);
        log.debug("repo list: {}", repoList);
        List<String> solvedTypes = new ArrayList<>();
        if (!StringUtils.isEmpty(solvedType)) {
            if ("deleted".equals(solvedType)) {
                solvedTypes.add(SolveWayEnum.FILE_DELETE.lowercase);
                solvedTypes.add(SolveWayEnum.ANCHOR_DELETE.lowercase);
            } else {
                solvedTypes.add(SolveWayEnum.CODE_CHANGE.lowercase);
                solvedTypes.add(SolveWayEnum.CODE_RELATED_CHANGE.lowercase);
                solvedTypes.add(SolveWayEnum.CODE_UNRELATED_CHANGE.lowercase);
                solvedTypes.add(SolveWayEnum.CODE_DELETE.lowercase);
            }
        }

        query.put(UUID, StringsUtil.splitStringList(issueUuids));
        query.put(TOOLS, StringsUtil.splitStringList(tools));
        query.put(SINCE, since);
        query.put(UNTIL, DateTimeUtil.datePlus(until));
        query.put(STATUS, status);
        query.put(MANUAL_STATUS, manualStatus);
        query.put(REPO_LIST, repoList);
        query.put(PRIORITY, priority == null ? null : Objects.requireNonNull(IssuePriorityEnums.JavaIssuePriorityEnum.getPriorityEnum(priority)).getRank());
        query.put(PRODUCER, StringsUtil.splitStringList(introducer));
        query.put(SOLVED_TYPE, solvedTypes);
        try {
            return new ResponseBean<>(200, SUCCESS, issueService.getIssuesFilterSidebar(query));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Interface for issueCount data graphs on the project details page", notes = "@return List<Map<String, Object>>\n[\n" +
            "        {\n" +
            "            \"date\": \"2020-06-10\",\n" +
            "            \"newIssueCount\": 0,\n" +
            "            \"eliminatedIssueCount\": 0,\n" +
            "            \"remainingIssueCount\": \"176\"\n" +
            "        }\n]", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "since", value = "Since when\nFormat: yyyy-MM-dd", required = true),
            @ApiImplicitParam(name = "until", value = "Until when\nFormat: yyyy-MM-dd", required = true),
            @ApiImplicitParam(name = "repo_uuids", value = "Repository uuids", required = true),
            @ApiImplicitParam(name = "tool", value = "Tool name", defaultValue = "sonarqube", allowableValues = "sonarqube , ESLint")
    })
    @GetMapping(value = {"/issue/repository/issue-count"})
    public ResponseBean<List<Map<String, Object>>> getNewTrend(@RequestParam("repo_uuids") String repoUuids,
                                                               @RequestParam("since") String since,
                                                               @RequestParam("until") String until,
                                                               @RequestParam(name = "tool", required = false, defaultValue = "sonarqube") String tool) {
        List<String> repoList = StringsUtil.splitStringList(repoUuids);
        try {
            return new ResponseBean<>(200, SUCCESS, issueService.getRepoIssueCounts(repoList, since, DateTimeUtil.datePlus(until), tool));
        } catch (Exception e) {
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Get a list of all developer names that have introduced issues", notes = "@return  List < String >", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "repo_uuids", value = "Repository uuids")
    })
    @GetMapping(value = {"/issue/issue-introducers"})
    public ResponseBean<List<String>> getIssueIntroducers(@RequestParam(value = "repo_uuids", required = false) String repoUuids) {

        List<String> repoUuidList = StringsUtil.splitStringList(repoUuids);

        try {
            return new ResponseBean<>(200, SUCCESS, issueService.getIssueIntroducers(repoUuidList));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Get a sorted list of introduced issues of the developer", notes = "@return  List < DeveloperIssueRiskVO >", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "project_names", value = "Project name"),
            @ApiImplicitParam(name = "repo_uuids", value = "Repository uuids"),
            @ApiImplicitParam(name = "developer", value = "Developer name"),
            @ApiImplicitParam(name = "asc"),
            @ApiImplicitParam(name = "page", value = "Page number"),
            @ApiImplicitParam(name = "ps", value = "Page size"),
            @ApiImplicitParam(name = "level", value = "Rank level")

    })

    @GetMapping(value = "/issue/risk")
    public ResponseBean<Map<String, Object>> getIssueRiskByDeveloper(@RequestParam(value = "project_names", required = false) String projectNames,
                                                                     @RequestParam(value = "repo_uuids", required = false) String repoUuids,
                                                                     @RequestParam(value = "developer", required = false) String developer,
                                                                     @RequestParam(value = "asc", required = false, defaultValue = "true") Boolean asc,
                                                                     @RequestParam(value = "page", required = false, defaultValue = "1") int page,
                                                                     @RequestParam(value = "ps", required = false, defaultValue = "10") int ps,
                                                                     @RequestParam(value = "level", required = false, defaultValue = "0") int level,
                                                                     HttpServletRequest httpServletRequest) {
        log.info("issue risk:receive request");
        String token = httpServletRequest.getHeader(TOKEN);
        List<String> repoList = issueService.getRepoListByUrlProjectNamesRepoUuids(null, projectNames, repoUuids, token);
        return new ResponseBean<>(200, SUCCESS, issueService.getIssueRiskByDeveloper(repoList, developer, asc, page, ps, level));
    }

    @ApiOperation(value = "Living issues", notes = "return int", httpMethod = "GET")
    @ApiImplicitParam(name = "repo_uuids", value = "Repository uuids")
    @GetMapping("/issue/remaining-issues")
    public ResponseBean<List<Map<String, String>>> getOpenIssues(@RequestParam(value = "repo_uuids") String repoUuids) {
        List<String> repoUuidList = StringsUtil.splitStringList(repoUuids);
        return new ResponseBean<>(200, SUCCESS, issueService.getOpenIssues(repoUuidList));
    }

    @GetMapping("issue/developer-issue")
    public ResponseBean<PagedGridResult<DeveloperIssueVO>> getImportIssue(@RequestParam(value = "repo_uuids") String repoUuids,
                                                                          @RequestParam(value = "developers", required = false) String developers,
                                                                          @RequestParam(value = "facets") String facets,
                                                                          @RequestParam(value = "identity") String identity,
                                                                          @RequestParam(value = "since", required = false) String since,
                                                                          @RequestParam(value = "until", required = false) String until,
                                                                          @RequestParam(value = "tool") String tool,
                                                                          @RequestParam(value = "page") int page,
                                                                          @RequestParam(value = "ps") int ps) {
        if (since == null) {
            since = DEFAULT_SINCE;
        }
        if (until == null) {
            until = DateTimeUtil.today();
        }
        return new ResponseBean<>(200, SUCCESS, issueService.getDeveloperImportIssue(repoUuids, developers, facets, since,
                DateTimeUtil.datePlus(until), tool, page, ps, identity));
    }

    @GetMapping("issue/developer-self-solve-issue")
    public ResponseBean<PagedGridResult<DeveloperIssueVO>> getSelfSolve(@RequestParam(value = "repo_uuids") String repoUuids,
                                                                        @RequestParam(value = "developers", required = false) String developers,
                                                                        @RequestParam(value = "facets") String facets,
                                                                        @RequestParam(value = "identity") String identity,
                                                                        @RequestParam(value = "is_self") boolean isSelf,
                                                                        @RequestParam(value = "since", required = false) String since,
                                                                        @RequestParam(value = "until", required = false) String until,
                                                                        @RequestParam(value = "tool") String tool,
                                                                        @RequestParam(value = "page") int page,
                                                                        @RequestParam(value = "ps") int ps) {
        if (since == null) {
            since = DEFAULT_SINCE;
        }
        if (until == null) {
            until = DateTimeUtil.today();
        }
        return new ResponseBean<>(200, SUCCESS, issueService.getRelationToOthers(repoUuids, developers, facets, identity, isSelf,
                since, DateTimeUtil.datePlus(until), tool, page, ps));
    }

    @GetMapping("issue/developer-other-solve-issue")
    public ResponseBean<PagedGridResult<DeveloperMapVO>> getOthersSolve(@RequestParam(value = "repo_uuids") String repoUuids,
                                                                        @RequestParam(value = "developers", required = false) String developers,
                                                                        @RequestParam(value = "facets") String facets,
                                                                        @RequestParam(value = "identity") String identity,
                                                                        @RequestParam(value = "is_self", required = false) boolean isSelf,
                                                                        @RequestParam(value = "since", required = false) String since,
                                                                        @RequestParam(value = "until", required = false) String until,
                                                                        @RequestParam(value = "tool") String tool,
                                                                        @RequestParam(value = "page") int page,
                                                                        @RequestParam(value = "ps") int ps) {
        if (since == null) {
            since = DEFAULT_SINCE;
        }
        if (until == null) {
            until = DateTimeUtil.today();
        }
        return new ResponseBean<>(200, SUCCESS, issueService.getMapOthers(repoUuids, developers, facets, identity, isSelf,
                since, DateTimeUtil.datePlus(until), tool, page, ps));
    }

    @GetMapping("issue/developer-commit-issue")
    public ResponseBean<PagedGridResult<DeveloperIssueVO>> getDeveloperIssueByCommit(@RequestParam(value = "repo_uuids") String repoUuids,
                                                                                     @RequestParam(value = "developers", required = false) String developers,
                                                                                     @RequestParam(value = "facets") String facets,
                                                                                     @RequestParam(value = "identity") String identity,
                                                                                     @RequestParam(value = "since", required = false) String since,
                                                                                     @RequestParam(value = "until", required = false) String until,
                                                                                     @RequestParam(value = "tool") String tool,
                                                                                     @RequestParam(value = "page") int page,
                                                                                     @RequestParam(value = "ps") int ps) {
        if (since == null) {
            since = DEFAULT_SINCE;
        }
        if (until == null) {
            until = DateTimeUtil.today();
        }
        return new ResponseBean<>(200, SUCCESS, issueService.getDeveloperIssueByCommit(repoUuids, developers, facets, identity,
                since, DateTimeUtil.datePlus(until), tool, page, ps));
    }

    @ApiOperation(value = "The tendency for living issues", httpMethod = "GET", notes = "@return Map{\"code\": String, \"msg\": String, \"data\": List<Map>}")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "since", value = "Since (yyyy-MM-dd)", required = true, dataType = "String", defaultValue = "1990-01-01"),
            @ApiImplicitParam(name = "until", value = "Until (yyyy-MM-dd)", required = true, dataType = "String", defaultValue = "1990-01-01"),
            @ApiImplicitParam(name = "project_ids", value = "Repository uuids", dataType = "String"),
            @ApiImplicitParam(name = "interval", value = "Interval", dataType = "String", defaultValue = "week"),
            @ApiImplicitParam(name = "detail", dataType = "String", defaultValue = "false")
    })
    @GetMapping(value = {"/issue/living-issue-tendency"})
    public ResponseBean<Object> getCcnMethodNum(@RequestParam(value = "since", required = false) String since,
                                                @RequestParam(value = "until") String until,
                                                @RequestParam(value = "project_ids", required = false) String tools,
                                                @RequestParam(value = "interval", required = false, defaultValue = "week") String interval,
                                                @RequestParam(value = "detail", required = false, defaultValue = "false") String showDetail) {

        String keyOfRedis = "living-issue-tendency?" + "since:" + since + "until:" + until + "projectIds:" + tools + "detail:" + showDetail;
        Object results;
        try {
            if (until.isEmpty()) {
                return new ResponseBean<>(412, PARAMETER_IS_EMPTY, null);
            }
            if (TIME_FORMAT_ERROR.equals(DateTimeUtil.timeFormatIsLegal(since, false)) || TIME_FORMAT_ERROR.equals(DateTimeUtil.timeFormatIsLegal(until, false))) {
                return new ResponseBean<>(400, TIME_ERROR_MESSAGE, null);
            }
            if (redisService.getValueFromRedis(keyOfRedis) != null) {
                results = redisService.getValueFromRedis(keyOfRedis);
            } else {
                results = issueService.getLivingIssueTendency(since, until, tools, interval, showDetail);
                redisService.addNewRedis(keyOfRedis, results);
            }
            return new ResponseBean<>(200, SUCCESS, results);
        } catch (Exception e) {
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    /**
     * Get the code of the file
     */
    @GetMapping("/issue/code/file")
    public ResponseBean<HashMap<String, String>> getFileContent(@RequestParam("repo_uuid") String repoUuid,
                                                                @RequestParam(name = "commit_id") String commitId,
                                                                @RequestParam(name = "file_path") String filePath,
                                                                @RequestParam(name = "start", required = false, defaultValue = "1") int start,
                                                                @RequestParam(name = "end", required = false, defaultValue = "50") int end) {
        try {
            return new ResponseBean<>(200, SUCCESS, codeService.getFileContent(repoUuid, commitId, filePath, start, end));
        } catch (Exception e) {
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    /**
     * Get the issues of the file
     *
     * @param repoUuid
     * @param commitId
     * @param filePath
     * @return
     */
    @GetMapping("/issue/tracker-file")
    public ResponseBean<PagedGridResult<IssueWithLocationItem>> getFileIssues(@RequestParam(name = "repo_uuid") String repoUuid,
                                                                              @RequestParam(name = "commit_id") String commitId,
                                                                              @RequestParam(name = "file_path") String filePath) {
        try {
            return new ResponseBean<>(200, SUCCESS, issueService.getFileIssues(repoUuid, commitId, filePath));
        } catch (Exception e) {
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }


    @GetMapping(value = {"/issue/scan-statuses"})
    public ResponseBean<List<RepoScan>> scanStatuses(@RequestParam(name = "repo_uuids", required = false, defaultValue = "") String repoUuids,
                                                     @RequestParam(name = "page", required = false, defaultValue = "1") Integer page,
                                                     @RequestParam(name = "ps", required = false, defaultValue = "100") Integer ps) {
        try {
            List<RepoScan> repoScans = issueScanService.getScanStatuses(repoUuids, page, ps);
            return new ResponseBean<>(200, "success!", repoScans);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, e.getMessage(), null);
        }
    }

    @GetMapping(value = {"/issue/scan-repos"})
    public ResponseBean<Map<String, List<Map<String, String>>>> scanRepos() {
        try {
            Map<String, List<Map<String, String>>> repos = issueScanService.getScanRepos();
            return new ResponseBean<>(200, "success!", repos);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, e.getMessage(), null);
        }
    }


    @ApiOperation(value = "Get the complete trace chain (graph) information based on issue information or node information.",
            notes = "@return  IssueTrackerMapVO", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "repo_uuid", value = "repo_uuid", dataType = "String"),
            @ApiImplicitParam(name = "issue_uuid", value = "issue_uuid", dataType = "String"),
            @ApiImplicitParam(name = "page", value = "page number", dataType = "Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "ps", value = "page size, the default is 20 per page."),
            @ApiImplicitParam(name = "show_all", value = "All commits or related commits", dataType = "String", defaultValue = "false")
    })
    @GetMapping(value = {"/issue/tracker-map"})
    public cn.edu.fudan.common.domain.ResponseBean<IssueTrackerMapVO> getTrackerMap(@RequestParam(value = "repo_uuid", required = false) String repoUuid,
                                                                                    @RequestParam(value = "issue_uuid", required = false) String issueUuid,
                                                                                    @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
                                                                                    @RequestParam(value = "ps", required = false, defaultValue = "20") Integer ps,
                                                                                    @RequestParam(value = "show_all", required = false, defaultValue = "false") Boolean showAll) {
        try {
            IssueTrackerMapVO data = issueMeasureInfoService.getTrackerMap(repoUuid, issueUuid,  page, ps, showAll);
            return new cn.edu.fudan.common.domain.ResponseBean<>(200, SUCCESS, data);
        } catch (Exception e) {
            e.printStackTrace();
            return new cn.edu.fudan.common.domain.ResponseBean<>(500, e.getMessage(), null);
        }
    }


    @Autowired
    public void setIssueService(IssueService issueService) {
        this.issueService = issueService;
    }
    @Autowired
    public void setRedisService(RedisService redisService) {
        this.redisService = redisService;
    }
    @Autowired
    public void setIssueScanService(IssueScanService issueScanService) {
        this.issueScanService = issueScanService;
    }
    @Autowired
    public void setIssueMeasureInfoService(IssueMeasureInfoService issueMeasureInfoService) {
        this.issueMeasureInfoService = issueMeasureInfoService;
    }
    @Autowired
    public void setCodeService(CodeService codeService) {
        this.codeService = codeService;
    }
}
