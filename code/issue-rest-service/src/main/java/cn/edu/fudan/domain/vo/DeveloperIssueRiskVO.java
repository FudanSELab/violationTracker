package cn.edu.fudan.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * @author beethoven
 * @date 2022-01-10 14:51:37
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DeveloperIssueRiskVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String developer;
    private Integer introduceNum;
    private Integer selfIntroduceOpenNum;
    private Integer selfIntroduceOthersSolveNum;
    private Integer selfIntroduceSelfSolvedNum;
    private String lastIntroduceTime;
    private Integer selfIntroduceSelfSolvedMiddleNum;
    private Double riskLevel;

}
