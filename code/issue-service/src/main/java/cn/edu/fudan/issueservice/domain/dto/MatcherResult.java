package cn.edu.fudan.issueservice.domain.dto;

import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author beethoven
 * @date 2021-09-23 09:18:36
 */
@Data
public class MatcherResult {

    private String commit;
    private int ignoreSolvedMergeIssueNum = 0;
    private Map<String, Issue> newIssues = new HashMap<>();
    private Map<String, Issue> mappedIssues = new HashMap<>();
    private Map<String, Issue> solvedIssue = new HashMap<>();
    private Map<String, Issue> reopenIssues = new HashMap<>();
    private List<RawIssue> curAllRawIssues = new ArrayList<>();
    private Map<String, List<RawIssue>> parentRawIssuesResult = new HashMap<>(4);

    public MatcherResult(String commit) {
        this.commit = commit;
    }
}
