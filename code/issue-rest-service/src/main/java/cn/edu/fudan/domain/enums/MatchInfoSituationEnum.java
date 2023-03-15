package cn.edu.fudan.domain.enums;


import cn.edu.fudan.domain.dbo.RawIssue;
import cn.edu.fudan.domain.dbo.RawIssueMatchInfo;

import java.util.List;

/**
 * @author beethoven
 * @date 2021-09-23 18:46:07
 * @description The cases of merge nodes
 */
public enum MatchInfoSituationEnum {

    /**
     * default
     */
    DEFAULT,

    /**
     * The merge node contains issues
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
