package cn.edu.fudan.issueservice.domain.dbo;

import lombok.*;

import java.util.List;
/**
 * @author Jerry Zhang <https://github.com/doughit>
 * @date 2022-08-10 09:44
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RangeCommitEdge {
    private Commit oldCommit;
    private Commit newCommit;
    // All commits between two endpoint commits
    private List<Commit> commits;

    @Setter(AccessLevel.PRIVATE)
    private Integer weight;

    public Integer getWeight() {
        setWeight(commits != null ? commits.size() : 0);
        return this.weight;
    }
}
