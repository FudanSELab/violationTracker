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
     * todo 后续抽取成接口
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
     * fixme raw issue 匹配上之后 如果不是在同一个方法中 还需要考虑 是否存在含有相同名字的方法
     * 匹配两个列表中的 RawIssue
     *  @param preRawIssues  pre file 中
     *
     * @param curRawIssues  cur file 中
     * @param curParentName cur file 中所有的 field name 和 method signature
     * @param issueTypeMap
     */
    public static void match(List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, Set<String> curParentName, Map<String, IssueType> issueTypeMap) {
        // 根据type分类 key {type}
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
            // 根据 type 进行循环匹配
            preRawIssuesT1.forEach(r1 -> curRawIssuesT2.forEach(r2 -> matcherContext.match(r1, r2, curParentName)));

            //  匹配完成后找到最佳的匹配 key  RawIssueMatchPair    value matchScore
            Map<RawIssueMatchPair, Double> mappedRawIssue = new LinkedHashMap<>(preRawIssuesT1.size() << 1);
            for (RawIssue preRawIssue1 : preRawIssuesT1) {
                for (RawIssueMatchResult r : preRawIssue1.getRawIssueMatchResults()) {
                    RawIssueMatchPair key = new RawIssueMatchPair(preRawIssue1, r.getRawIssue());
                    mappedRawIssue.put(key, r.getMatchingDegree());
                }
            }
            mappedRawIssue = MapSortUtil.sortByValueDesc(mappedRawIssue);
            // 排序 设置 最佳匹配
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
            // 没匹配上的将mapped设置为false
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
