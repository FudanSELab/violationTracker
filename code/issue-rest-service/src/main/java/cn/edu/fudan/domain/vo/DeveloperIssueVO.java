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
 * @time: 2022/7/19 2:10 下午
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeveloperIssueVO {

    public static final String SOLVED_NUM = "solvedNum";
    private String repoUuid;
    private String developer;
    private String importDeveloper;
    private String solvedDeveloper;
    private Integer issueSum;
    private Integer importSum;
    private Integer solveSum;
    private HashMap<String, IssueNum> issueNumHashMap;
    private HashMap<String, HashMap<String, IssueNum>> developerMap;
    private HashMap<String, DeveloperCommitIssueVO> developerCommitIssueVOHashMap;


    public void addImportNum(IssueNum issueNum, String facet) {
        this.issueNumHashMap.put(facet, issueNum);
        this.importSum += issueNum.getImportNum();

    }

    public void adImportNum(IssueNum issueNum) {
        this.importSum += issueNum.getImportNum();
    }

    public void addSolvedNum(int a) {
        this.solveSum += a;
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

        this.solveSum += num;

    }


}
