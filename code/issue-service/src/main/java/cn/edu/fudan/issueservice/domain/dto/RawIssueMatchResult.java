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

//    /**
//     * 匹配到的IssueId
//     */
//    String matchedIssueId;
//
//    /**
//     * 匹配到的RawIssue Id
//     */
//    String matchedRawIssueId;

    /**
     * 两个raw issue 是否完全一样
     */
    boolean isBestMatch = false;

    /**
     * 两个rawIssue的匹配度
     */
    double matchingDegree;

    /**
     * 匹配到的RawIssue
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
