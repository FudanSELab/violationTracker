package cn.edu.fudan.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc violation overview
 * @date 2023/3/6 14:22
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssueWithLocationItem {
    /**
     * overview
     */
    private String issueUuid;
    private String type;
    private String category;
    private String producer;
    private String produceCommit;
    private String produceCommitTime;
    private String solver;
    private String solveCommit;
    private String solveCommitTime;
    private String lastCommit;
    private String lastCommitTime;
    private String status;
    private Integer versions;
    /**
     * last revision
     */
    private List<Location> locations;

    /**
     * current revision
     */
    private String currCommit;
    private String currFilePath;
    private String currRawIssueUuid;
    private String currRawIssueDetail;
}
