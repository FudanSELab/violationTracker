package cn.edu.fudan.issueservice.domain.dbo;

import lombok.*;

import java.io.Serializable;
import java.util.Date;
import java.util.Objects;

/**
 * @author Jerry Zhang
 * create: 2022-06-24 15:35
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IssueTrackerNode implements Serializable {
    private String commitId;
    private String committer;
    private Date commitTime;
    private Date authorTime;
    private String parentCommit;
    private String filePath;
    private String issueStatus;
    private String solveWay;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IssueTrackerNode that = (IssueTrackerNode) o;
        return commitId.equals(that.commitId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(commitId);
    }
}
