package cn.edu.fudan.issueservice.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @author Beethoven
 */

@Getter
@AllArgsConstructor
public enum RawIssueStatus {
    // The issue is introduced in this commit
    ADD("add"),
    // The location of the raw issue has changed from the previous raw issue
    CHANGED("changed"),
    // The issue is eliminated in this commit by the developer modifying the code
    SOLVED("solved"),
    // The issue is automatically eliminated in this commit by merging
    MERGE_SOLVE("merge solve"),
    // The issue is reopened
    REOPEN("reopen"),
    // There is only one parent at issue merge
    MERGE_REOPEN("merge reopen"),
    MERGE_NEW("merge new"),
    MERGE_CHANGED("merge changed"),
    DEFAULT("default");

    private final String type;

    public static RawIssueStatus getStatusByName(String name) {
        for (RawIssueStatus status : RawIssueStatus.values()) {
            if (status.getType().equals(name)) {
                return status;
            }
        }
        return null;
    }
}
