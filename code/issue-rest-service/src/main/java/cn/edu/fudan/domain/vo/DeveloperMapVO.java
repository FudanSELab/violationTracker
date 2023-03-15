package cn.edu.fudan.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;

/**
 * @description:
 * @author: keyon
 * @time: 2022/7/20 8:37 下午
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeveloperMapVO {
    private Integer issueSum;
    private HashMap<String, DeveloperIssueVO> developerIssueHashMap;

    public void add(int a) {
        this.issueSum += a;
    }
}
