package cn.edu.fudan.issueservice.domain.dto;

import lombok.Data;

/**
 *
 * @author Jerry Zhang
 * create: 2022-07-19 20:49
 */
@Data
public class AnalysisIssue {
    private Integer id;
    private String repoUuid;
    private String issueUuid;
    private String rawIssueUuid;
    private String status;
    private String solveWay;
    private String commitId;
    private String commitTime;
    private String developer;
}
