package cn.edu.fudan.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * description: Record matching information for raw issues
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
     * Similarity
     */
    double matchDegree;
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
