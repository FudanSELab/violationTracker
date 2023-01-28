package cn.edu.fudan.issueservice.domain.enums;

import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;

import java.util.List;

/**
 * @author beethoven
 * @date 2021-09-23 18:46:07
 * @description merge 节点 match info 情况枚举
 */
public enum MatchInfoSituationEnum {

    /**
     * 默认情况, 无需做特殊 merge 的处理
     */
    DEFAULT,

    /**
     * merge 节点含有 issue
     */
    ADD_ADD, ADD_CHANGED, CHANGED_CHANGED, ADD_DEFAULT;

    public static MatchInfoSituationEnum getInstance(RawIssue rawIssue) {
        List<RawIssueMatchInfo> matchInfos = rawIssue.getMatchInfos();
        int add = 0, change = 0;
        for (RawIssueMatchInfo matchInfo : matchInfos) {
            if (RawIssueStatus.ADD.getType().equals(matchInfo.getStatus())) {
                add++;
            }
            if (RawIssueStatus.CHANGED.getType().equals(matchInfo.getStatus())) {
                change++;
            }
        }
        if (add == 1 && change == 1) {
            return ADD_CHANGED;
        } else if (add == 2) {
            return ADD_ADD;
        } else if (change == 2) {
            return CHANGED_CHANGED;
        } else if (add == 1){
            return ADD_DEFAULT;
        }
        return DEFAULT;
    }
}
