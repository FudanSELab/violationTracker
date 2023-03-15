package cn.edu.fudan.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc 缺陷整体情况与当前版本位置信息
 * @date 2023/3/6 14:22
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IssueWithLocationItem {
    /**
     * issue 整体状态
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
     * issue 指定版本信息
     */
    private String currCommit;
    private String currFilePath;
    private String currRawIssueUuid;
    private String currRawIssueDetail;
    private List<Location> locations;
}
