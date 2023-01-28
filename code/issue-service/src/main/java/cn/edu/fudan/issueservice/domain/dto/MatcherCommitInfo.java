package cn.edu.fudan.issueservice.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatcherCommitInfo {
    String repoId;
    String commitId;
    String commitTime;

    @Override
    public String toString() {
        return "commit{" +
                "repoId='" + repoId +
                ", commitId=" + commitId +
                '}';
    }

    @Override
    public int hashCode() {
        return Objects.hash(repoId, commitId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        MatcherCommitInfo matcherCommitInfo = (MatcherCommitInfo) o;
        return repoId == matcherCommitInfo.getRepoId() &&
                commitId.equals(matcherCommitInfo.getCommitId());
    }
}
