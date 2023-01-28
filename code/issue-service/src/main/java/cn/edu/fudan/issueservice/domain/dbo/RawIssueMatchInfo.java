package cn.edu.fudan.issueservice.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * description: 用于记录raw issue的匹配信息
 *
 * @author fancying
 * create: 2021-01-06 21:53
 **/
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RawIssueMatchInfo {

    public static final String EMPTY = "empty";
    /**
     * 当同一个rawIssue 在与不同的commit匹配 遇到不同的 Issue 时用到
     */
    double matchDegree;
    /**
     * 这个rawIssue是与哪一个版本的rawIssue进行的比较
     */
    private int id;
    private String curRawIssueUuid;
    private String curCommitId;
    private String preRawIssueUuid;
    private String preCommitId;
    private String issueUuid;
    private String status;
    private String repoUuid;
    private String solveWay;


    public RawIssueMatchInfo(int id, String curRawIssueUuid, String curCommitId, String preRawIssueUuid, String preCommitId, String issueUuid, String status) {
        this.id = id;
        this.curRawIssueUuid = curRawIssueUuid;
        this.curCommitId = curCommitId;
        this.preRawIssueUuid = preRawIssueUuid;
        this.preCommitId = preCommitId;
        this.issueUuid = issueUuid;
        this.status = status;
    }

}
