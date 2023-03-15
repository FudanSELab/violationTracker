package cn.edu.fudan.domain.vo;

import cn.edu.fudan.domain.dbo.IssueNum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;

/**
 * @description:
 * @author: keyon
 * @time: 2022/7/21 6:13 下午
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeveloperCommitIssueVO {
    public static final String SOLVED_NUM = "solvedNum";
    private String commitId;
    private String commitTime;
    private Integer issueSum;
    private HashMap<String, IssueNum> issueNumHashMap;

    public void addImportNum(IssueNum issueNum, String facet) {
        this.issueNumHashMap.put(facet, issueNum);
        this.issueSum += issueNum.getImportNum();

    }

    public void addSolvedNum(int num, String facet, String solveWay) {
        if (issueNumHashMap.containsKey(facet)) {
            if ("normal_solved".equals(solveWay)) {
                issueNumHashMap.get(facet).getSolvedNum().put(SOLVED_NUM, num);
            } else {
                int solveTemp = issueNumHashMap.get(facet).getSolvedNum().get(SOLVED_NUM) + num;
                int allTemp = issueNumHashMap.get(facet).getSolvedNum().get("allSolvedNum") + num;
                issueNumHashMap.get(facet).getSolvedNum().put(SOLVED_NUM, solveTemp);
                issueNumHashMap.get(facet).getSolvedNum().put("allSolvedNum", allTemp);
            }

        } else {
            IssueNum issueNum = new IssueNum();
            if ("normal_solved".equals(solveWay)) {
                issueNum.initSolvedNum(num, num, 0);
            } else {
                issueNum.initSolvedNum(num, 0, num);
            }
            this.issueNumHashMap.put(facet, issueNum);
        }
        this.issueSum += num;

    }


}
