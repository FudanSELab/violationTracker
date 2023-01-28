package cn.edu.fudan.issueservice.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @author Jerry Zhang
 * create: 2022-06-27 11:33
 */
@Getter
@AllArgsConstructor
public enum IssueTrackerStatus {
    CHANGED("changed"),
    FAILED("failed"),
    BUG_ADD("bug_add"),
    BUG_ADD_LAST("bug_add_last"),
    BUG_MAY_CHANGED("bug_may_changed"),
    BUG_CHANGED("bug_changed"),
    SOLVED("solved");

    final String type;
}
