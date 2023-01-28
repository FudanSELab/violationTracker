package cn.edu.fudan.issueservice.domain.dto;

import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.issueservice.core.analyzer.BaseAnalyzer;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * @author beethoven
 * @date 2021-09-22 14:38:57
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatcherData {

    private String tool;
    private String repoUuid;
    private String currentCommit;
    private BaseAnalyzer analyzer;
    private JGitHelper jGitHelper;
    private List<RawIssue> currentRawIssues;
    private Map<String, List<String>> commitFileMap;
    private Map<String, List<RawIssue>> parentRawIssuesMap;
    private Map<String, Map<String, String>> preFile2CurFileMap;
    private Map<String, Map<String, String>> curFile2PreFileMap;

}
