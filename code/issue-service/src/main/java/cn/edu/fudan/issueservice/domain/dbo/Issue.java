package cn.edu.fudan.issueservice.domain.dbo;

import cn.edu.fudan.issueservice.domain.enums.IgnoreTypeEnum;
import cn.edu.fudan.issueservice.domain.enums.IssueStatusEnum;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.Date;


/**
 * @author Beethoven
 */
@Data
@Slf4j
public class Issue {

    private String uuid;
    private String type;
    private String tool;
    private String startCommit;
    private Date startCommitDate;
    private String endCommit;
    private Date endCommitDate;
    private String repoUuid;
    private String targetFiles;
    private Date createTime;
    private Date updateTime;
    private IssueType issueType;
    private int priority;
    private String status;
    private String manualStatus;
    private String resolution;
    private String issueCategory;
    private String solveCommit;
    private Date solveCommitDate;
    private String producer;
    private String solver;
    private String latestProducer;
    private String latestSolver;

    /**
     * 根据 rawIssue 产生一个新的 Issue
     */
    public static Issue valueOf(RawIssue r) {
        Issue issue = new Issue();
        issue.setUuid(r.getUuid());
        issue.setType(r.getType());
        issue.setTool(r.getTool());
        issue.setStartCommit(r.getCommitId());
        issue.setStartCommitDate(r.getCommitTime());
        issue.setEndCommit(r.getCommitId());
        issue.setEndCommitDate(r.getCommitTime());
        issue.setRepoUuid(r.getRepoUuid());
        issue.setTargetFiles(r.getFileName());
        Date date = new Date();
        issue.setCreateTime(date);
        issue.setUpdateTime(date);
        issue.setPriority(r.getPriority());
        issue.setStatus(IssueStatusEnum.OPEN.getName());
        issue.setManualStatus(IgnoreTypeEnum.DEFAULT.getName());
        issue.setResolution(String.valueOf(0));
        issue.setProducer(r.getDeveloperName());
        issue.setSolveCommit(null);
        issue.setSolveCommitDate(null);
        return issue;
    }


}
