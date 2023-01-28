package cn.edu.fudan.issueservice.domain.dbo;

import lombok.Data;

/**
 * @author beethoven
 * @date 2021-06-28 09:30:11
 */
@Data
public class RepoMetric {

    private String repoUuid;
    private int bestMax;
    private int bestMin;
    private int betterMax;
    private int betterMin;
    private int normalMax;
    private int normalMin;
    private int worseMax;
    private int worseMin;
    private int worstMax;
    private int worstMin;

    public RepoMetric() {
        bestMax = 0;
        bestMin = 0;
        betterMax = 1;
        betterMin = 3;
        normalMax = 4;
        normalMin = 5;
        worseMax = 6;
        worseMin = 10;
        worstMax = 11;
        worstMin = 2147483647;
    }
}
