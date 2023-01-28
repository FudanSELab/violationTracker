package cn.edu.fudan.issueservice.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * @description:
 * @author: keyon
 * @time: 2022/7/19 2:59 下午
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class IssueNum {

    int importNum;
    Map<String, Integer> solvedNum;


    public void initSolvedNum(int overall, int solved, int delete){
        this.solvedNum = new HashMap<>();
        this.solvedNum.put("allSolvedNum", overall);
        this.solvedNum.put("solvedNum", solved);
        this.solvedNum.put("deleteNum", delete);
    }
    public void mapPriorityIntToString(String priority){

    }
}
