package cn.edu.fudan.issueservice.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @author Beethoven
 */

@Getter
@AllArgsConstructor
public enum RawIssueStatus {
    // issue 的 第一条 raw issue 插入时的状态
    ADD("add"),
    // raw issue 对比前一条 raw issue location 发生改变
    CHANGED("changed"),
    // 这个 issue 在这个 commit 通过开发者修改代码被消除
    SOLVED("solved"),
    // 这个 issue 在这个 commit 通过 merge 的方式自动消除
    MERGE_SOLVE("merge solve"),
    // issue 被重新打开
    REOPEN("reopen"),
    // issue merge时仅一个parent有 那么应该区别于单纯reopen情况
    MERGE_REOPEN("merge reopen"),
    MERGE_NEW("merge new"),
    // issue merge时与两个parent都匹配上 匹配分低的matchInfo记做此状态 并且该issue状态记为解决
    MERGE_CHANGED("merge changed"),
    DEFAULT("default");

    private final String type;

    public static RawIssueStatus getStatusByName(String name) {
        for (RawIssueStatus status : RawIssueStatus.values()) {
            if (status.getType().equals(name)) {
                return status;
            }
        }
        return null;
    }
}
