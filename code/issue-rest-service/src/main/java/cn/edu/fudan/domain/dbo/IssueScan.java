package cn.edu.fudan.domain.dbo;

import cn.edu.fudan.domain.enums.ScanStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.UUID;

/**
 * description: Record the violation scanning status for each commit of the repo
 *
 * @author lsw
 * @blame lsw
 * @since 20/05/21 09:28
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IssueScan {

    private String uuid;
    private String tool;
    private Date startTime;
    private Date endTime;
    private String status;
    private String repoUuid;
    private String commitId;
    private Date commitTime;
    private Date authorTime;
    private String resultSummary;
    private String parentCommit;
    private String developer;

    public static IssueScan initIssueScan(String repoId, String commitId, String toolName, Date commitTime,
                                          Date authorTime, String parentCommit, String developer) {
        IssueScan issueScan = new IssueScan();
        issueScan.setUuid(UUID.randomUUID().toString());
        issueScan.setTool(toolName);
        issueScan.setStartTime(new Date());
        issueScan.setStatus(ScanStatusEnum.DOING.getType());
        issueScan.setRepoUuid(repoId);
        issueScan.setCommitId(commitId);
        issueScan.setCommitTime(commitTime);
        issueScan.setAuthorTime(authorTime);
        issueScan.setParentCommit(parentCommit);
        issueScan.setDeveloper(developer);
        return issueScan;
    }


}
