package cn.edu.fudan.issueservice.controller;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.issueservice.component.SonarRest;
import cn.edu.fudan.issueservice.core.IssueScanProcess;
import cn.edu.fudan.issueservice.core.analyzer.SonarQubeBaseAnalyzer;
import cn.edu.fudan.issueservice.core.solved.IssueSolved;
import cn.edu.fudan.issueservice.domain.ResponseBean;
import cn.edu.fudan.issueservice.domain.dto.ScanRequestDTO;
import cn.edu.fudan.issueservice.service.IssueScanService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * description: Issue tool API management.
 *
 * @author fancying
 * create: 2020-05-19 21:03
 **/
@Api(value = "issue scan", tags = {"APIs for issue scanning."})
@Slf4j
@RestController
public class IssueScanController {

    private static final String SUCCESS = "success";
    private static final String FAILED = "failed ";
    private static final String INVOKE_TOOL_FAILED_MESSAGE = "invoke tool:[{}] failed! message is {}";
    private IssueScanService issueScanService;
    private ApplicationContext applicationContext;
    private SonarRest sonarRest;
    private IssueSolved issueSolved;

    @PostMapping(value = {"/issue/scan"})
    public ResponseBean<String> scanStart(@RequestBody ScanRequestDTO scanRequestDTO) {
        log.info("process scan request, repo {}, branch {}, begin commit {}", scanRequestDTO.getRepoUuid(), scanRequestDTO.getBranch(), scanRequestDTO.getBeginCommit());
        String repoUuid = scanRequestDTO.getRepoUuid();
        String branch = scanRequestDTO.getBranch();
        String beginCommit = scanRequestDTO.getBeginCommit();
        String endCommit = scanRequestDTO.getEndCommit();
        String repoPath = scanRequestDTO.getRepoPath();

        SonarRest.cacheRepoPath(repoUuid, repoPath);
        IssueScanProcess issueScanProcess = applicationContext.getBean(IssueScanProcess.class);
        issueScanProcess.scan(repoUuid, branch, beginCommit, endCommit);
        return new ResponseBean<>(200, "success!", null);
    }

//    @ApiOperation(value = "Clear the database according to repoUuid and rescan a database", httpMethod = "POST")
//    @ApiImplicitParam(name = "repo_uuid", value = "repo uuid", required = true)
//    @PostMapping(value = {"/issue/re-scan"})
//    public ResponseBean<String> reScan(@RequestBody ScanRequestDTO scanRequestDTO) {
//        log.info("process re scan request, repoUuid: {}", scanRequestDTO.getRepoUuid());
//        String repoUuid = scanRequestDTO.getRepoUuid();
//        String branch = scanRequestDTO.getBranch();
//        String beginCommit = scanRequestDTO.getBeginCommit();
//        IssueScanProcess issueScanProcess = applicationContext.getBean(IssueScanProcess.class);
//        try {
//            if (beginCommit == null) {
//                final List<RepoScan> issueReposByRepoUuid = issueScanService.getIssueReposByRepoUuid(repoUuid);
//                if (!issueReposByRepoUuid.isEmpty()) {
//                    final Map<String, String> repoUuid2ToolWithBeginCommit = issueReposByRepoUuid.stream()
//                            .collect(Collectors.toMap(RepoScan::getTool, RepoScan::getStartCommit));
//                    issueScanProcess.getRepoUuid2ToolWithBeginCommit().put(repoUuid, repoUuid2ToolWithBeginCommit);
//                } else {
//                    issueScanProcess.getRepoUuid2ToolWithBeginCommit().remove(repoUuid);
//                }
//            }
//            issueScanProcess.deleteRepo(repoUuid);
//            if (branch == null) {
//                if ((branch = sonarRest.getBranchByRepoUuid(repoUuid)) == null) {
//                    return new ResponseBean<>(500, "failed!", "can not get branch from code service");
//                }
//            }
//        } catch (Exception e) {
//            log.error("repoUuid:{} error occurs before rescanning, message:{}", repoUuid, e.getMessage());
//            return new ResponseBean<>(500, "failed!", e.getMessage());
//        }
//        issueScanProcess.scan(repoUuid, branch, null, null);
//        return new ResponseBean<>(200, "success!", null);
//    }

    /**
     * { "serverUrl": "http://localhost:9010", "taskId": "AYRm3ait2vWUWN6i5Ci0", "status": "SUCCESS",
     * "analysedAt": "2022-11-11T21:25:06+0800", "revision":
     * "b0d8a4a7c323fafcf0c7e418e0f4c0fee79a0cba", "changedAt": "2022-11-11T21:25:06+0800", "project":
     * { "key": "test-scan-speed", "name": "JavaNCSS", "url":
     * "http://localhost:9010/dashboard?id=test-scan-speed" }, "branch": { "name": "master", "type":
     * "BRANCH", "isMain": true, "url": "http://localhost:9010/dashboard?id=test-scan-speed" },
     * "qualityGate": { "name": "Sonar way", "status": "OK", "conditions": [ { "metric":
     * "new_reliability_rating", "operator": "GREATER_THAN", "value": "1", "status": "OK",
     * "errorThreshold": "1" }, { "metric": "new_security_rating", "operator": "GREATER_THAN",
     * "value": "1", "status": "OK", "errorThreshold": "1" }, { "metric":
     * "new_maintainability_rating", "operator": "GREATER_THAN", "value": "1", "status": "OK",
     * "errorThreshold": "1" }, { "metric": "new_coverage", "operator": "LESS_THAN", "status":
     * "NO_VALUE", "errorThreshold": "80" }, { "metric": "new_duplicated_lines_density", "operator":
     * "GREATER_THAN", "status": "NO_VALUE", "errorThreshold": "3" }, { "metric":
     * "new_security_hotspots_reviewed", "operator": "LESS_THAN", "status": "NO_VALUE",
     * "errorThreshold": "100" } ] }, "properties": { "sonar.analysis.detectedscm": "git",
     * "sonar.analysis.detectedci": "undetected" } } *
     *
     * <p> Webhooks need to be configured in http://${SONAR_URL}/admin/webhooks.
     * <p> name is issue-service
     * <p> url is http://{ip}:{port}/issue/webhook/sonarqube
     */
    @PostMapping(value = {"/issue/webhook/sonarqube"})
    public ResponseBean<Object> acceptTheSonarQubeCallback(
            @RequestBody Map<String, Object> notification, @RequestHeader HttpHeaders headers) {

        log.debug("get a callback notification {}", notification);

        String status = (String) notification.get(STATUS);
        boolean success = SUCCESS_STATUS.equals(status);

        Map<String, String> project = (Map<String, String>) notification.get(PROJECT_KEY);
        String projectKey = project.get(KEY);

        SonarQubeBaseAnalyzer.signalForAnalysis(projectKey, success);
        return ResponseBean.OK_RESPONSE_BEAN;

    }

    static final String STATUS = "status";
    static final String SUCCESS_STATUS = "SUCCESS";
    static final String PROJECT_KEY = "project";
    static final String KEY = "key";

    /**
     * Temporarily not validate the HTTP request.
     */
//    private static boolean isValidSignature(YourHttpRequest request) {
//        // "x-sonar-webhook-hmac-sha256"
//        String receivedSignature = request.getHeader("X-Sonar-Webhook-HMAC-SHA256");
//        // See Apache commons-codec
//        String expectedSignature = new HmacUtils(HmacAlgorithms.HMAC_SHA_256, "your_secret").hmacHex(request.getBody())
//        return Objects.equals(expectedSignature, receivedSignature);
//    }

    @PutMapping(value = {"/issue/update/solve-way"})
    public ResponseBean<String> updateSolveWay(@RequestParam("repo_uuid") String repoUuid) {
        try {
            issueSolved.updateSolvedWay(Arrays.asList(repoUuid.split(",")));
            return new ResponseBean<>(200, "success!", null);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, "update repo failed!", e.getMessage());
        }
    }

    @ApiOperation(value = "Return the current scan status of the code repository based on the tool name and repoId.",
            notes = "@return Map<String, Object>\n{\n" +
            "        \"uuid\": \"3f9aee42-ca85-415b-8e92-5a4257f87368\",\n" +
            "        \"repoId\": \"3ecf804e-0ad6-11eb-bb79-5b7ba969027e\",\n" +
            "        \"branch\": \"zhonghui20191012\",\n" +
            "        \"tool\": \"sonarqube\",\n" +
            "        \"startCommit\": \"e12f6cee85c89d14b9de8d94577fe8844d7b3c25\",\n" +
            "        \"endCommit\": \"7697c69d749dad14f37e1a6072b0090cb869caf2\",\n" +
            "        \"totalCommitCount\": 459,\n" +
            "        \"scannedCommitCount\": 459,\n" +
            "        \"scanTime\": 83524,\n" +
            "        \"status\": \"complete\",\n" +
            "        \"nature\": \"main\",\n" +
            "        \"startScanTime\": \"2020-10-14 17:46:10\",\n" +
            "        \"endScanTime\": \"2020-10-15 17:02:44\"\n" +
            "    }", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "repo_uuid", value = "repository uuid", required = true)
    })
    @GetMapping(value = {"/issue/scan-status"})
    public ResponseBean<RepoScan> scanStatus(@RequestParam("repo_uuid") String repoUuid) {
        try {
            RepoScan issueRepo = issueScanService.getScanStatusByRepoUuid(repoUuid);
            return new ResponseBean<>(200, "success!", issueRepo);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, e.getMessage(), null);
        }
    }

    @ApiOperation(value = "Stop the scan of the corresponding code repository based on the tool name and repoId.",
            notes = "@return String", httpMethod = "GET")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "tool", value = "tool name", required = true, defaultValue = "sonarqube", allowableValues = "sonarqube"),
            @ApiImplicitParam(name = "repo_uuid", value = "repository uuid", required = true)
    })
    @GetMapping(value = {"/issue/scan-stop"})
    public ResponseBean<String> stopScan(@RequestParam("repo_uuid") String repoUuid, @RequestParam("tool") String tool) {
//        String tool = restInterfaceManager.getToolByRepoUuid(repoUuid);
        if (tool == null) {
            return new ResponseBean<>(400, FAILED, "stop failed!");
        }

        try {
            IssueScanProcess issueScanProcess = applicationContext.getBean(IssueScanProcess.class);
            issueScanProcess.stopScan(repoUuid, tool);
            return new ResponseBean<>(200, SUCCESS, "stop success!");
        } catch (Exception e) {
            log.error(INVOKE_TOOL_FAILED_MESSAGE, tool, e.getMessage());
            return new ResponseBean<>(500, FAILED, e.getMessage());
        }
    }

//    @ApiOperation(value = "Get the un-scanned commits of a repository based on the tool name and repoId.",
//    notes = "@return Map<String, Object>\n{\n" +
//            "        \"totalCount\": 0,\n" +
//            "        \"commitList\": [],\n" +
//            "        \"pageCount\": 0\n" +
//            "    }", httpMethod = "GET")
//    @ApiImplicitParams({
//            @ApiImplicitParam(name = "tool", value = "tool name", required = true, defaultValue = "sonarqube", allowableValues = "sonarqube"),
//            @ApiImplicitParam(name = "repo_uuid", value = "repository uuid", required = true),
//            @ApiImplicitParam(name = "page", value = "page number\nThe default is page 1."),
//            @ApiImplicitParam(name = "ps", value = "page size\nThe default is 10 items per page."),
//            @ApiImplicitParam(name = "is_whole", value = "all information\nThe default is false", allowableValues = "false , true")
//    })
//    @GetMapping(value = {"/issue/commit-list"})
//    public ResponseBean<Map<String, Object>> getStockCommit(@RequestParam(name = "repo_uuids") String repoUuidsBefore,
//                                                            @RequestParam(name = "page", required = false, defaultValue = "1") Integer page,
//                                                            @RequestParam(name = "ps", required = false, defaultValue = "10") Integer size,
//                                                            @RequestParam(name = "is_whole", required = false, defaultValue = "false") Boolean isWhole) {
//        if (repoUuidsBefore == null) {
//            return new ResponseBean<>(200, SUCCESS, new ArrayMap<>());
//        }
//        List<String> repoUuids = Arrays.asList(repoUuidsBefore.split(","));
//        if (repoUuids.get(0) == null || "".equals(repoUuids.get(0))) {
//            return new ResponseBean<>(200, SUCCESS, new ArrayMap<>());
//        }
//        Map<String, String> temp = new HashMap<>() {{
//            repoUuids.forEach(repoUuid -> put(repoUuid, sonarRest.getToolByRepoUuid(repoUuid)));
//        }};
//        try {
//            return new ResponseBean<>(200, SUCCESS, size == 0 ? issueScanService.getCommitsCount(temp) : issueScanService.getCommits(repoUuids.get(0), page, size, isWhole, temp.get(repoUuids.get(0))));
//        } catch (Exception e) {
//            e.printStackTrace();
//            return new ResponseBean<>(500, e.getMessage(), null);
//        }
//    }

    @GetMapping(value = "/issue/scan/failed")
    public ResponseBean<Map<String, String>> getScanFailedCommitList(@RequestParam(name = "repo_uuid") String repoUuid) {
        try {
            return new ResponseBean<>(200, SUCCESS, issueScanService.getScanFailedCommitList(repoUuid));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseBean<>(500, FAILED + e.getMessage(), null);
        }
    }

    @Autowired
    public void setIssueSolved(IssueSolved issueSolved) {
        this.issueSolved = issueSolved;
    }

    @Autowired
    public void setIssueScanService(IssueScanService issueScanService) {
        this.issueScanService = issueScanService;
    }

    @Autowired
    public void setRestInterfaceManager(SonarRest sonarRest) {
        this.sonarRest = sonarRest;
    }

    @Autowired
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }
}
