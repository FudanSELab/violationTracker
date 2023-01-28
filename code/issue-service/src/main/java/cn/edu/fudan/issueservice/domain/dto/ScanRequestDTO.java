package cn.edu.fudan.issueservice.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author Beethoven
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ScanRequestDTO {
    private String repoUuid;
    private String branch;
    private String beginCommit;
    private String endCommit;
    private String url;
    private String repoPath;
}
