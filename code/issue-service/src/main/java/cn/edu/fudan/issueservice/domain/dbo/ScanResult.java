package cn.edu.fudan.issueservice.domain.dbo;

import lombok.Data;

import java.util.Date;

/**
 * @author WZY
 * @version 1.0
 **/
@Data
public class ScanResult {

    private int id;
    private String category;
    private String repoId;
    private Date scanDate;
    private String commitId;
    private Date commitDate;
    private String developer;
    private int newCount;
    private int eliminatedCount;
    private int remainingCount;
    private int reopenCount;
    private int ignoreCount;
    private String parentCommitId;

    public ScanResult() {
    }

    public ScanResult(String category, String repoId, Date scanDate, String commitId, Date commitDate, String developer, int newCount, int eliminatedCount, int reopenCount, int remainingCount, int ignoreCount, String parentCommitId) {
        this.category = category;
        this.repoId = repoId;
        this.scanDate = scanDate;
        this.commitId = commitId;
        this.commitDate = commitDate;
        this.developer = developer;
        this.newCount = newCount;
        this.eliminatedCount = eliminatedCount;
        this.remainingCount = remainingCount;
        this.reopenCount = reopenCount;
        this.ignoreCount = ignoreCount;
        this.parentCommitId = parentCommitId;
    }

}
