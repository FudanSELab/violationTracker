package cn.edu.fudan.issueservice.core.solved;

import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * description:
 *
 * @author fancying
 * create: 2021/10/25
 **/
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SolvedRecord {
    private int id;
    private String repoUuid;
    private int matchId;
    private String issueUuid;
    private String type;

    public static SolvedRecord instanceOf(RawIssueMatchInfo rawIssueMatchInfo, String repoUuid) {
        return SolvedRecord.builder().
                repoUuid(repoUuid).
                matchId(rawIssueMatchInfo.getId()).
                issueUuid(rawIssueMatchInfo.getIssueUuid()).
                build();
    }

}
