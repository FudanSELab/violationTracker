package cn.edu.fudan.issueservice.core.analyzer;

import cn.edu.fudan.issueservice.component.SonarRest;
import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.domain.dbo.LogicalStatement;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import cn.edu.fudan.issueservice.domain.enums.ToolEnum;
import cn.edu.fudan.issueservice.util.FileFilter;
import cn.edu.fudan.issueservice.util.FileUtil;
import cn.edu.fudan.issueservice.util.JavaAstParserUtil;
import cn.edu.fudan.issueservice.util.ShUtil;
import cn.edu.fudan.issueservice.util.stat.LogicalStatementUtil;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import javax.xml.bind.DatatypeConverter;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Matcher;
import java.util.stream.Collectors;

/**
 * description:
 *
 * @author fancying
 * create: 2020-05-20 15:55
 **/
@Slf4j
@Component
@Scope("prototype")
public class SonarQubeBaseAnalyzer extends BaseAnalyzer {


    static final boolean IS_WINDOWS = System.getProperty("os.name").contains("Windows");
    static final String RULE = "rule";
    static final String SONAR_SEPARATOR = ":";
    static final int SPLITTED_STR_LENGTH = 2;
    private static final Lock ANALYZE_LOCK = new ReentrantLock();
    private static final Map<String, AnalysisSignal> ANALYSIS_COMPLETE_FLAG = new ConcurrentHashMap<>(32);
    private static final String COMPONENT = "component";
    private static final String KEY = "key";
    private static final String TOTAL = "total";
    private static final String SONAR_RESULT_FAILED = "get sonar issue results failed!";
    /**
     * sonarPath Address prefix length
     * the length of {commit}/
     */
    private static final int PREFIX_LENGTH = 41;
    private static final int COMMIT_LENGTH = 40;
    private static SonarRest rest;
    final int maxWait = 4;
    static final int MAX_SONAR_RESULT = 10000;
    static final String LINE = "line";
    @Value("${deleteSonarProject:false}")
    private boolean deleteSonarProject;

    /**
     * wake up specific projectKey
     */
    public static void signalForAnalysis(String projectKey, boolean success) {
        AnalysisSignal finishedCondition = ANALYSIS_COMPLETE_FLAG.get(projectKey);
        if (finishedCondition == null) {
            log.debug("can not find projectKey {}", projectKey);
            return;
        }
        log.info("signal {} and success is {}", projectKey, success);
        finishedCondition.getSuccessful().set(success);
        finishedCondition.getDone().set(true);
        ANALYZE_LOCK.lock();
        try {
            finishedCondition.getCondition().signal();
        } finally {
            ANALYZE_LOCK.unlock();
        }
    }

    /**
     * @param repoUuid     A unique identifier with a maximum of 36 digits
     * @param scanRepoPath The absolute path of the repository needs to be analyzed
     */
    @Override
    public boolean invoke(String repoUuid, String scanRepoPath, String commit) {

        String projectKey = generateUniqueProjectKey(repoUuid, commit);
        if (!deleteSonarProject) {
            JSONObject sonarIssueResults = rest.getSonarIssueResults(projectKey, null, null, null, 1, false, 0);
            if (sonarIssueResults.getInteger(TOTAL) != 0) {
                return true;
            }
        } else {
            log.info("delete sonar project: {}", projectKey);
            deleteSonarProject(projectKey);
        }
        ANALYSIS_COMPLETE_FLAG.put(projectKey, new AnalysisSignal(ANALYZE_LOCK.newCondition(), new AtomicBoolean(false), new AtomicBoolean(false)));
        int timeout = analysisMaxTimeOut(scanRepoPath, commit);
        int result = ShUtil.executeToolCommand("sonarqube", pidFile,
                binHome + "executeSonar.sh ", timeout, scanRepoPath, projectKey, commit);
        if (result == 1) {
            return false;
        }
        boolean waitResult = waitForAnalysis(projectKey, timeout / 1000);
        if (waitResult && result == 2) {
            JSONObject results = rest.getSonarIssueResults(projectKey, null, null, null, 1, false, 0);
            if (results == null) {
                log.error(SONAR_RESULT_FAILED);
                return false;
            }
        } else if (result == 2) {
            log.info("file path: {}", scanRepoPath);
            log.warn("some files failed to scan, but we can retrieve data from sonarqube");
        }
        return waitResult;
    }

    static final int MAX_WAIT = 4;

    private boolean waitForAnalysis(String projectKey, int timeout) {
        AnalysisSignal finishedCondition = ANALYSIS_COMPLETE_FLAG.get(projectKey);
        // Wait immediately after the result is returned. Normally, the condition wait first
        // Wait without signal. The maximum number of waits is maxWait. The maximum wait time is maxWait * timeout seconds
        long startWaitTime = System.currentTimeMillis();
        for (int i = 1; i < MAX_WAIT && !finishedCondition.getDone().get(); i++) {
            log.info("Number of waits {} of projectKey {}, expect to wait for a total of {} s", i, projectKey, i * timeout);
            ANALYZE_LOCK.lock();
            try {
                finishedCondition.getCondition().await(timeout, TimeUnit.SECONDS);
            } catch (InterruptedException e) {

                log.error("The {} wait InterruptedException in {}, message is {}", i, projectKey, e.getMessage());
                /// The failure is temporarily treated as an error
                return false;
            } finally {
                ANALYZE_LOCK.unlock();
            }
        }
        log.info("sonar analysis use {} s, analysis {}! key: {}", (System.currentTimeMillis() - startWaitTime) / 1000,
                finishedCondition.getDone().get() ? "success" : "failed", projectKey);

        // If the timeout has not been signaled(analysis completed)
        if (!finishedCondition.getDone().get()) {
            return false;
        }
        // gc
        ANALYSIS_COMPLETE_FLAG.remove(projectKey);

        return finishedCondition.successful.get();
    }

    /**
     * todo sonarqube 分析的最长等待时间应该不是固定的 需要根据分析的文件数量来做判断
     */
    private int analysisMaxTimeOut(String repoPath, String commit) {
        return 180000;
    }

    @Override
    public List<RawIssue> analyze(String scanRepoPath, String repoUuid, String commit) {
        String projectKey = generateUniqueProjectKey(repoUuid, commit);

        long analyzeStartTime = System.currentTimeMillis();
        JSONObject results = rest.getSonarIssueResults(projectKey, null, null, null, 1, false, 0);
        if (results == null) {
            log.error(SONAR_RESULT_FAILED);
            return null;
        }
        int total = results.getInteger(TOTAL);
        List<RawIssue> resultRawIssues = new ArrayList<>(total);

        if (total > MAX_SONAR_RESULT) {
            final List<String> directoryArr = FileUtil.getJavaDirectories(scanRepoPath);
            // Iterate through each directory that contains a.java file
            for (String d : directoryArr) {
                List<RawIssue> rawIssuesInOneDirectory = analyzeDirectory(scanRepoPath, repoUuid, commit, d);
                if (rawIssuesInOneDirectory == null) {
                    return Collections.emptyList();
                }
                resultRawIssues.addAll(rawIssuesInOneDirectory);
            }

        } else {
            // the number of sonar issue <= MAX_SONAR_RESULT
            resultRawIssues = analyzeSonarIssue2RawIssues(scanRepoPath, repoUuid, commit, null, null, false);
        }

        // By default, the number of hotspot must be smaller than that MAX_SONAR_RESULT
        List<RawIssue> hotspots = analyzeSonarIssue2RawIssues(scanRepoPath, repoUuid, commit, null, null, true);
        resultRawIssues.addAll(hotspots);

        log.info("It takes {} s to wait for the latest sonar result ", (System.currentTimeMillis() - analyzeStartTime) / 1000);
        return resultRawIssues;
    }

    /**
     * @return Null indicates that the analysis fails
     */
    private List<RawIssue> analyzeDirectory(String scanRepoPath, String repoUuid, String commit, String directory) {
        JSONObject fileArr = rest.getSonarIssueFileUuidsInDirectory(
                generateUniqueProjectKey(repoUuid, commit), directory.substring(scanRepoPath.length() + 1));
        if (fileArr == null) {
            return Collections.emptyList();
        }
        if (fileArr.getInteger(TOTAL) > MAX_SONAR_RESULT) {
            List<RawIssue> results = new ArrayList<>(fileArr.getInteger(TOTAL));

            // > 10000, traverse the folder files (excluding subfolders)
            List<String> fileList = FileUtil.getJavaFiles(directory);
            for (String f : fileList) {
                // If one file fails to be analyzed, the entire directory fails to be analyzed
                List<RawIssue> rawIssuesInOneFile = analyzeSonarIssue2RawIssues(scanRepoPath, repoUuid, commit, null, f.substring(scanRepoPath.length() + 1), false);
                results.addAll(rawIssuesInOneFile);
            }
            return results;
        }
        // <= 10000 Directories (excluding subdirectories)
        return analyzeSonarIssue2RawIssues(scanRepoPath, repoUuid, commit, directory.substring(scanRepoPath.length() + 1), null, false);
    }

    /**
     * Parse sonar issues as rawIssues
     *
     * @return Null indicates that the analysis fails
     */
    private List<RawIssue> analyzeSonarIssue2RawIssues(String scanRepoPath, String repoUuid, String commit, String directory, String fileUuid, boolean isSecurityHotspot) {

        String componentKey = generateUniqueProjectKey(repoUuid, commit);

        int pageSize = 100;
        int issueTotal = getNumberOfSonarIssue(componentKey, isSecurityHotspot, directory, fileUuid);

        String sourceFilePath = concatPath(componentKey, directory, fileUuid);
        log.info("Current path {}, issueTotal in sonar result is {}", sourceFilePath, issueTotal);

        if (issueTotal > MAX_SONAR_RESULT) {
            log.error("issue in directory:{}, fileUuid:{} is larger than 10000", directory, fileUuid);
        }

        // fixme Take only the first 1w of sonar's issues over 1w
        int pages = Math.min(issueTotal % pageSize > 0 ? issueTotal / pageSize + 1 : issueTotal / pageSize, 100);
        List<RawIssue> rawIssues = new ArrayList<>(issueTotal);

        try {
            for (int i = 1; i <= pages; i++) {
                JSONArray sonarRawIssues;

                if (!isSecurityHotspot) {
                    sonarRawIssues = rest.getSonarIssueResults(
                                    componentKey, directory, fileUuid, null, pageSize, false, i)
                            .getJSONArray("issues");
                } else {
                    sonarRawIssues = rest.getSonarSecurityHotspotList(componentKey, pageSize, i)
                            .getJSONArray("hotspots");
                }
                if (sonarRawIssues == null) {
                    log.error(SONAR_RESULT_FAILED);
                    continue;
                }

                for (int j = 0; j < sonarRawIssues.size(); j++) {
                    JSONObject sonarIssue = sonarRawIssues.getJSONObject(j);

                    String component;
                    if (isSecurityHotspot) {
                        sonarIssue = rest.getSonarSecurityHotspot(sonarIssue.getString(KEY));
                        component = sonarIssue.getJSONObject(COMPONENT).getString(KEY);
                    } else {
                        component = sonarIssue.getString(COMPONENT);
                    }

                    // Only Java files in non-test folders are parsed
                    if (filterFile(component)) {
                        continue;
                    }

                    // Parse locations
                    List<Location> locations = isSecurityHotspot ? analyzeSecurityHotspotLocations(sonarIssue, repoUuid, commit) : analyzeLocations(sonarIssue, repoUuid, commit);

                    // The issue with no line number is not filtered. The default value of star_line and end_line is 0
                    //  case http://10.176.34.96:9000/project/issues?id=guava&open=AYSo3oK_L6CevAQYEPlQ&resolved=false&types=CODE_SMELL
                    if (null == locations || locations.isEmpty()) {
                        log.warn("locations are empty in comment {}", component);
                        continue;
                    }

                    // Parse rawIssue
                    RawIssue rawIssue = getRawIssue(repoUuid, commit, ToolEnum.SONAR.getType(), sonarIssue, isSecurityHotspot);
                    // This type of violation has no location information
                    if (rawIssue.getType().equals("Source files should not have any duplicated blocks")) {
                        continue;
                    }
                    String sonarRelativeFilePath = rawIssue.getFileName();
                    // Resets rawIssue's commit id and filePath during incremental scans
                    if (!isTotalScan(componentKey)) {
                        resetRawIssueCommitAndFilePath4Incremental(rawIssue, sonarRelativeFilePath);
                    }
                    completeRawIssue(rawIssue, locations);
                    rawIssues.add(rawIssue);
                }
            }

            addExtraAttributeInRawIssueLocations(rawIssues, scanRepoPath, componentKey);
            log.info("Current path {}, rawIssue total is {}", sourceFilePath, rawIssues.size());
            return rawIssues;
        } catch (Exception e) {
            e.printStackTrace();
            log.error("getSonarResult message:{}", e.getMessage());
            log.error("get {} raw issues failed", sourceFilePath);
        } finally {
            RawIssue.cleanUpRawIssueUuidCacheAfterOneCommitScan();
        }
        return Collections.emptyList();
    }

    /**
     * Decouple from the specific scan path
     */
    protected void resetRawIssueCommitAndFilePath4Incremental(RawIssue rawIssue, String sonarRelativeFilePath) {
        String prefixCommit = sonarRelativeFilePath.substring(0, COMMIT_LENGTH);
        rawIssue.setCommitId(prefixCommit);
        rawIssue.setFileName(getRelativeFilePath4Incremental(sonarRelativeFilePath));
    }

    /**
     * Decouple from the specific scan path
     */
    protected String getRelativeFilePath4Incremental(String sonarRelativeFilePath) {
        return sonarRelativeFilePath.substring(PREFIX_LENGTH);
    }

    private int getNumberOfSonarIssue(String componentKeys, boolean isSecurityHotspots, String directories, String fileUuids) {

        JSONObject sonarIssueResult;
        // Get the number of issues
        if (isSecurityHotspots) {
            sonarIssueResult = rest.getSonarSecurityHotspotList(componentKeys, 1, 0);
            return sonarIssueResult.getJSONObject("paging").getIntValue(TOTAL);
        }

        sonarIssueResult = rest.getSonarIssueResults(
                componentKeys, directories, fileUuids, null, 1, false, 0);
        return sonarIssueResult.getIntValue(TOTAL);
    }

    private void completeRawIssue(RawIssue rawIssue, List<Location> locations) {
        rawIssue.setLocations(locations);
        rawIssue.setStatus(RawIssueStatus.ADD.getType());

        String rawIssueUuid = RawIssue.generateRawIssueUUID(rawIssue);
        String rawIssueHash = RawIssue.generateRawIssueHash(rawIssue);
        rawIssue.setUuid(rawIssueUuid);
        rawIssue.setRawIssueHash(rawIssueHash);

        locations.forEach(location -> location.setFilePath(rawIssue.getFileName()));
        locations.forEach(location -> location.setRawIssueUuid(rawIssueUuid));
    }

    public void addExtraAttributeInRawIssueLocations(List<RawIssue> tempRawIssues, String scanRepoPath, String componentKey) {

        final Map<String, List<RawIssue>> file2RawIssuesMap = tempRawIssues.stream().collect(Collectors.groupingBy(rawIssue -> rawIssue.getLocations().get(0).getSonarRelativeFilePath()));
        log.info("{} {} total scan, scan repo path: {}", componentKey, isTotalScan(componentKey) ? "is" : "is not", scanRepoPath);
        for (Map.Entry<String, List<RawIssue>> file2RawIssues : file2RawIssuesMap.entrySet()) {
            final List<RawIssue> rawIssues = file2RawIssues.getValue();
            final List<Location> locations = rawIssues.stream().map(RawIssue::getLocations).flatMap(Collection::stream).collect(Collectors.toList());
            final List<Integer> beginLines = locations.stream().map(Location::getStartLine).collect(Collectors.toList());
            final List<Integer> endLines = locations.stream().map(Location::getEndLine).collect(Collectors.toList());
            final List<Integer> startTokens = locations.stream().map(Location::getStartToken).collect(Collectors.toList());
            log.info("relative path: {}", locations.get(0).getFilePath());
            log.info("sonar relative path: {}", locations.get(0).getSonarRelativeFilePath());
            String realFilePath = scanRepoPath + File.separator +
                    (isTotalScan(componentKey) ? locations.get(0).getFilePath() : locations.get(0).getSonarRelativeFilePath());

            // Localization of files for non-Linux platforms
            if (IS_WINDOWS) {
                realFilePath = realFilePath.replaceAll("/", Matcher.quoteReplacement(File.separator));
            }

            log.info("cur file  {}, rawIssueTotal is {}", realFilePath, rawIssues.size());

            try {
                List<LogicalStatement> logicalStatements = LogicalStatementUtil.getLogicalStatements(realFilePath, beginLines, endLines, startTokens);
                List<String> codeList = logicalStatements.stream().map(LogicalStatement::getContent).collect(Collectors.toList());
                List<String> anchorNameList = logicalStatements.stream().map(LogicalStatement::getAnchorName).collect(Collectors.toList());
                List<Integer> anchorOffsetList = logicalStatements.stream().map(LogicalStatement::getAnchorOffset).collect(Collectors.toList());
                List<String> classNameList = logicalStatements.stream().map(LogicalStatement::getClassName).collect(Collectors.toList());
                for (int i1 = 0; i1 < locations.size(); i1++) {
                    final Location location = locations.get(i1);
                    location.setAnchorName(anchorNameList.get(i1));
                    location.setOffset(anchorOffsetList.get(i1));
                    location.setClassName(classNameList.get(i1));
                    location.setCode(codeList.get(i1));
                }
            } catch (Exception e) {
                log.error("parse file {} failed! rawIssue num is {}, begin lines: {}, tokens:{}", realFilePath, rawIssues.size(), beginLines, startTokens);
                e.printStackTrace();
            }
        }
    }

    /**
     * todo Request the Sonar POST API
     */
    private boolean deleteSonarProject(String projectKey) {
        final String deleteScript = "deleteSonarProject.sh";
        String authSonar = DatatypeConverter.printBase64Binary((rest.sonarLogin + ":" + rest.sonarPassword).getBytes(StandardCharsets.UTF_8));

        if (ShUtil.executeCommand(binHome + deleteScript, 0, projectKey, authSonar)) {
            log.info("delete sonar project:{} success! ", projectKey);
            return true;
        }

        log.error("delete sonar project:{} failed!", projectKey);
        return false;
    }

    @Override
    public String getToolName() {
        return ToolEnum.SONAR.getType();
    }

    @Override
    public Integer getPriorityByRawIssue(RawIssue rawIssue) {
        int result = 1;
        String detail = rawIssue.getDetail();
        String[] rawIssueArgs = detail.split("---");
        String severity = rawIssueArgs[rawIssueArgs.length - 1];
        switch (severity) {
            case "BLOCKER":
                result = 0;
                break;
            case "CRITICAL":
                result = 1;
                break;
            case "MAJOR":
                result = 2;
                break;
            case "MINOR":
                result = 3;
                break;
            case "INFO":
                result = 4;
                break;
            default:
        }
        return result;
    }

    public List<Location> analyzeSecurityHotspotLocations(JSONObject sonarSh, String repoUuid, String commit) {


        int line = sonarSh.containsKey(LINE) ? sonarSh.getInteger(LINE) : 0;
        String sonarRelativeFilePath = splitSonarPath(sonarSh.getJSONObject(COMPONENT).getString(KEY));

        // If the path analysis error occurs, the {location} resolution fails
        if (sonarRelativeFilePath == null) {
            log.error("analyzeSecurityHotspotLocations error in {}", sonarSh.getJSONObject(COMPONENT).getString(KEY));
            return null;
        }

        JSONArray flows = sonarSh.getJSONArray("flows");
        if (flows != null && !flows.isEmpty()) {
            // multi location ?
            log.error("SecurityHotspot  has multi locations in sonarIssue:{}", sonarSh);
        }

        return Collections.singletonList(newLocation(line, line, sonarRelativeFilePath, repoUuid, commit, 0, 0));

    }

    public List<Location> analyzeLocations(JSONObject issue, String repoUuid, String commit) {
        int startLine = 0;
        int endLine = 0;
        int startOffset = 0;
        int endOffset = 0;
        JSONArray flows = issue.getJSONArray("flows");
        if (flows == null || flows.isEmpty()) {
            // For the location stored in the textRange in the issue
            JSONObject textRange = issue.getJSONObject("textRange");
            if (textRange != null) {
                startLine = textRange.getIntValue("startLine");
                endLine = textRange.getIntValue("endLine");
                startOffset = textRange.getIntValue("startOffset");
                endOffset = textRange.getInteger("endOffset");
            }

            String sonarRelativeFilePath = splitSonarPath(issue.getString(COMPONENT));

            // If the path analysis error occurs, the {location} resolution fails
            if (sonarRelativeFilePath == null) {
                return null;
            }

            return Collections.singletonList(newLocation(startLine, endLine, sonarRelativeFilePath, repoUuid, commit, startOffset, endOffset));
        }

        List<Location> locations = new ArrayList<>();
        // For multiple locations stored by flows in an issue
        for (int i = 0; i < flows.size(); i++) {
            JSONObject flow = flows.getJSONObject(i);
            JSONArray flowLocations = flow.getJSONArray("locations");
            // There are multiple locations in a flows
            for (int j = 0; j < flowLocations.size(); j++) {
                JSONObject flowLocation = flowLocations.getJSONObject(j);
                String flowComponent = flowLocation.getString(COMPONENT);
                JSONObject flowTextRange = flowLocation.getJSONObject("textRange");
                if (flowTextRange == null || flowComponent == null) {
                    continue;
                }
                int flowStartLine = flowTextRange.getIntValue("startLine");
                int flowEndLine = flowTextRange.getIntValue("endLine");
                int flowStartOffset = flowTextRange.getIntValue("startOffset");
                int flowEndOffset = flowTextRange.getIntValue("endOffset");

                String sonarRelativeFilePath = splitSonarPath(flowComponent);
                if (sonarRelativeFilePath == null) {
                    continue;
                }

                Location location = newLocation(flowStartLine, flowEndLine, sonarRelativeFilePath, repoUuid, commit, flowStartOffset, flowEndOffset);
                locations.add(location);
            }
        }

        return locations;
    }

    private Location newLocation(int startLine, int endLine, String sonarRelativeFilePath, String repoUuid, String commit, int startToken, int endToken) {

        String relativePath = sonarRelativeFilePath;
        if (!isTotalScan(generateUniqueProjectKey(repoUuid, commit))) {
            relativePath = getRelativeFilePath4Incremental(sonarRelativeFilePath);
        }

        Location location = new Location();
        location.setFilePath(relativePath);
        // If it is not a total scan, we need to remove the first commit

        String locationUuid = Location.generateLocationUUID(repoUuid, relativePath, startLine, endLine, startToken, endToken, wholeProcessTest);

        location.setSonarRelativeFilePath(sonarRelativeFilePath);
        location.setUuid(locationUuid);
        location.setStartLine(startLine);
        location.setEndLine(endLine);
        location.setStartToken(startToken);
        location.setEndToken(endToken);
        if (startLine > endLine) {
            log.error("startLine > endLine,fileName is {},startLine is {},endLine is {}", sonarRelativeFilePath, startLine, endLine);
            int temp = startLine;
            startLine = endLine;
            endLine = temp;
        }
        location.setBugLines(startLine + "-" + endLine);

        return location;
    }

    private RawIssue getRawIssue(String repoUuid, String commit, String category, JSONObject issue, boolean isSecurityHotspots) {

        // Get the name of the rule based on the ruleId
        String issueName = null;
        String issueType = isSecurityHotspots ? issue.getJSONObject(RULE).getString(KEY) : issue.getString(RULE);

        JSONObject rule = rest.getRuleInfo(issueType, null, null);
        if (rule != null) {
            issueName = rule.getJSONObject(RULE).getString("name");
        }

        //sonarPath eg:
        // {projectKey}:{commit}/dx/src/com/android/dx/command/dexer/Main.java
        // 3d54bdb3-6ead-3611-b5ab-dd776554b2cf_76aa4cd93590bcd41efe5c5b7858b2e5cf0d8355:76aa4cd93590bcd41efe5c5b7858b2e5cf0d8355/dx/src/com/android/dx/command/dexer/Main.java
        String sonarPath = isSecurityHotspots ? issue.getJSONObject(COMPONENT).getString(KEY) : issue.getString(COMPONENT);

        // Gets the file path
        String sonarRelativeFilePath = splitSonarPath(sonarPath);

        RawIssue rawIssue = new RawIssue();
        rawIssue.setTool(category);
        rawIssue.setType(issueName);
        rawIssue.setFileName(sonarRelativeFilePath);
        rawIssue.setCommitId(commit);
        String severity = null;
        if (rule != null) {
            severity = rule.getJSONObject("rule").getString("severity");
        }
        rawIssue.setDetail(issue.getString("message") + "---" + severity);
        rawIssue.setScanId(ToolEnum.SONAR.getType());
        rawIssue.setRepoUuid(repoUuid);


        rawIssue.setPriority(getPriorityByRawIssue(rawIssue));

        return rawIssue;
    }

    /**
     * sonarPath depends on the scanRepoPath The scanned address is scanRepoPath; The address of the
     * file is {scanRepoPath}/{appendDirPrefix}/{relativeFilePath} SonarPath is {projectKey}:{appendDirPrefix}/{relativeFilePath}
     *
     * @return sonarRelativeFilePath Examples:
     * <blockquote><pre>
     * incremental analysis returns {appendDirPrefix}/dx/src/com/android/dx/command/dexer/Main.java
     * full analysis returns dx/src/com/android/dx/command/dexer/Main.java
     * </pre></blockquote>
     */
    private String splitSonarPath(String sonarPath) {
        if (sonarPath != null) {
            String[] sonarComponents = sonarPath.split(SONAR_SEPARATOR);
            if (sonarComponents.length == SPLITTED_STR_LENGTH) {
                return sonarComponents[1];
            }
            log.error("splitSonarPath error; sonarPath [{}] does not contain only one SEPARATOR [{}]", sonarPath, SONAR_SEPARATOR);
        }
        return null;
    }

    private String concatPath(String componentKey, String directories, String fileUuids) {
        StringBuilder sb = new StringBuilder(componentKey);
        if (directories != null) {
            sb.append(" ").append(directories);
        }
        if (fileUuids != null) {
            sb.append(" ").append(fileUuids);
        }
        return sb.toString();
    }

    @Override
    public boolean filterFile(String fileName) {
        return FileFilter.javaFilenameFilter(fileName);
    }

    @Override
    public boolean closeResourceLoader() {
        return false;
    }

    @Override
    public Set<String> getMethodsAndFieldsInFile(String absoluteFilePath) throws IOException {
        Set<String> methodsAndFields = new HashSet<>();

        methodsAndFields.addAll(JavaAstParserUtil.
                getAllFieldsInFile(absoluteFilePath));

        methodsAndFields.addAll(JavaAstParserUtil.
                getAllMethodsInFile(absoluteFilePath));

        methodsAndFields.addAll(JavaAstParserUtil.
                getAllClassNamesInFile(absoluteFilePath));

        return methodsAndFields;
    }

    @Autowired
    public void setRestInterfaceManager(SonarRest restInterfaceManager) {
        SonarQubeBaseAnalyzer.rest = restInterfaceManager;
    }

    @AllArgsConstructor
    @Getter
    static class AnalysisSignal {
        /**
         * Scan flag information
         */
        Condition condition;
        /**
         * scanning complete flag
         */
        AtomicBoolean done;
        /**
         * scan Success or not
         */
        AtomicBoolean successful;
    }


}
