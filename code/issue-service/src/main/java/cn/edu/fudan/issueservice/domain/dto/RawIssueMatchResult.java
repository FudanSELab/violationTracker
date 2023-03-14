package cn.edu.fudan.issueservice.domain.dto;

import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 *
 * @author fancying
 */
@Data
public class RawIssueMatchResult {

    /**
     * Whether the two raw issues are exactly the same
     */
    boolean isBestMatch = false;

    /**
     * The degree of matching between the two rawIssues
     */
    double matchingDegree;

    /**
     * Matched rawIssue
     */
    RawIssue rawIssue;


    private RawIssueMatchResult() {}

    public static RawIssueMatchResult newInstance(RawIssue rawIssue, double matchDegree) {
        RawIssueMatchResult result = new RawIssueMatchResult();
        result.setRawIssue(rawIssue);
        result.setMatchingDegree(matchDegree);
        return result;
    }
}
