package cn.edu.fudan.issueservice.domain.dbo;

import com.alibaba.fastjson.JSONObject;
import lombok.*;
import org.springframework.data.annotation.Transient;

import java.util.ArrayList;
import java.util.List;

/**
 * Used to store data before and after the issue analyzing process
 *
 * @author Jeff
 * @author fancying
 * @author heyue
 * @author PJH
 */
@Data
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RawIssueCache {
    private String repoUuid;
    private String commitId;
    private int invokeResult;
    private JSONObject analyzeResult;
    private String tool;
    private int rawIssueNum;

    /**
     * Used of fragmentation.
     */
    private int sharding;

    /**
     * This parameter is used to determine whether a full scan is performed.
     * 1 for yes. 0 for no
     */
    private int isTotalScan;
    /**
     * This field is only used to pass values and does not need to be stored in the database
     */
    @Transient
    private List<RawIssue> rawIssueList;

    public static RawIssueCache init(String repoUuid, String commitId, String tool) {
        return RawIssueCache.builder()
                .repoUuid(repoUuid)
                .commitId(commitId)
                .invokeResult(InvokeResult.FAILED.getStatus())
                .analyzeResult(new JSONObject())
                .rawIssueList(new ArrayList<>())
                .tool(tool)
                .build();
    }

    public void updateIssueAnalyzeStatus(List<RawIssue> resultRawIssues) {
        this.setRawIssueList(resultRawIssues);
        this.setRawIssueNum(resultRawIssues.size());
    }

    @Getter
    public enum InvokeResult {
        /**
         * result of issue analyzing
         */
        SUCCESS(1),
        FAILED(0);

        private final int status;

        InvokeResult(int status) {
            this.status = status;
        }
    }

}
