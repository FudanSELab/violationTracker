package cn.edu.fudan.issueservice.core.process;

import cn.edu.fudan.issueservice.core.process.strategy.MatcherContext;
import cn.edu.fudan.issueservice.domain.dbo.IssueType;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dto.RawIssueMatchResult;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import cn.edu.fudan.issueservice.util.JavaAstParserUtil;
import cn.edu.fudan.issueservice.util.MapSortUtil;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author fancying
 */
@Slf4j
public class RawIssueMatcher {

    /**
     * todo This method should be extracted as an interface
     */
    public static Set<String> getAnchors(String absoluteFilePath) throws IOException {
        Set<String> methodsAndFields = new HashSet<>();

        methodsAndFields.addAll(JavaAstParserUtil.
                getAllFieldsInFile(absoluteFilePath));

        methodsAndFields.addAll(JavaAstParserUtil.
                getAllMethodsInFile(absoluteFilePath));

        methodsAndFields.addAll(JavaAstParserUtil.
                getAllClassNamesInFile(absoluteFilePath));

        return methodsAndFields;
    }

    /**
     * Currently, only Java file is supported
     */
    public static void match(List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, String preFilePath,
                             String curFilePath, Map<String, IssueType> issueTypeMap) {
        Set<String> curParentName = Collections.emptySet();
        try {
            curParentName = getAnchors(curFilePath);
        } catch (IOException e) {
            log.error(e.getMessage());
        }

        match(preRawIssues, curRawIssues, curParentName, issueTypeMap);
    }


    /**
     * Match RawIssues in two lists
     *  @param preRawIssues  raw issues in pre file
     *
     * @param curRawIssues raw issues in cur file
     * @param curParentName fields and method signatures in cur file
     * @param issueTypeMap
     */
    public static void match(List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, Set<String> curParentName, Map<String, IssueType> issueTypeMap) {
        Map<String, List<RawIssue>> typePreRawIssues = preRawIssues.stream().collect(Collectors.groupingBy(RawIssue::getType));
        Map<String, List<RawIssue>> typeCurRawIssues = curRawIssues.stream().collect(Collectors.groupingBy(RawIssue::getType));
        Set<String> curIssueTypes = typeCurRawIssues.keySet();
        for (Map.Entry<String, List<RawIssue>> preEntry : typePreRawIssues.entrySet()) {
            MatcherContext matcherContext = MatcherContext.getInstance(issueTypeMap.get(preEntry.getKey()));
            if (!curIssueTypes.contains(preEntry.getKey())) {
                continue;
            }
            List<RawIssue> preRawIssuesT1 = preEntry.getValue();
            List<RawIssue> curRawIssuesT2 = typeCurRawIssues.get(preEntry.getKey());
            // Loop matching is made according to type
            preRawIssuesT1.forEach(r1 -> curRawIssuesT2.forEach(r2 -> matcherContext.match(r1, r2, curParentName)));

            // Find the best matching pair after the match process is complete
            // key: RawIssueMatchPair, value: matchScore
            Map<RawIssueMatchPair, Double> mappedRawIssue = new LinkedHashMap<>(preRawIssuesT1.size() << 1);
            for (RawIssue preRawIssue1 : preRawIssuesT1) {
                for (RawIssueMatchResult r : preRawIssue1.getRawIssueMatchResults()) {
                    RawIssueMatchPair key = new RawIssueMatchPair(preRawIssue1, r.getRawIssue());
                    mappedRawIssue.put(key, r.getMatchingDegree());
                }
            }
            mappedRawIssue = MapSortUtil.sortByValueDesc(mappedRawIssue);
            // Find the best matching pair
            for (RawIssueMatchPair map : mappedRawIssue.keySet()) {
                RawIssue preRawIssue = map.getPreRawIssue();
                RawIssue curRawIssue = map.getCurRawIssue();
                if (preRawIssue.getMappedRawIssue() == null && curRawIssue.getMappedRawIssue() == null) {
                    preRawIssue.setMappedRawIssue(curRawIssue);
                    curRawIssue.setMappedRawIssue(preRawIssue);
                    curRawIssue.setIssueId(preRawIssue.getIssueId());
                    preRawIssue.setMatchDegree(mappedRawIssue.get(map));
                    curRawIssue.setMatchDegree(mappedRawIssue.get(map));
                    preRawIssue.setStatus(RawIssueStatus.CHANGED.getType());
                    curRawIssue.setStatus(RawIssueStatus.CHANGED.getType());
                    curRawIssue.setVersion(preRawIssue.getVersion() + 1);
                    curRawIssue.getMatchInfos().add(curRawIssue.generateRawIssueMatchInfo(preRawIssue.getCommitId()));
                }
            }
            // not matched
            preRawIssuesT1.stream().filter(r -> r.getMappedRawIssue() == null).forEach(r -> {
                r.setMapped(false);
                r.setStatus(RawIssueStatus.SOLVED.getType());
            });
            curRawIssuesT2.stream().filter(r -> r.getMappedRawIssue() == null).forEach(r -> {
                r.setMapped(false);
                r.setStatus(RawIssueStatus.ADD.getType());
            });
        }
    }


    @Data
    @AllArgsConstructor
    static class RawIssueMatchPair {
        RawIssue preRawIssue;
        RawIssue curRawIssue;
    }
}
