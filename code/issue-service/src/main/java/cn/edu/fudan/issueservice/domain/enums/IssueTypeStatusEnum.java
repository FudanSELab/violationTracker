package cn.edu.fudan.issueservice.domain.enums;

import lombok.Getter;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc 缺陷类型启用状态
 * @date 2022-10-08 16:17
 */
@Getter
public enum IssueTypeStatusEnum {
    READY("READY"), DEPRECATED("DEPRECATED"), BETA("BETA");
    private final String status;
    IssueTypeStatusEnum(String status) {
        this.status = status;
    }
}
