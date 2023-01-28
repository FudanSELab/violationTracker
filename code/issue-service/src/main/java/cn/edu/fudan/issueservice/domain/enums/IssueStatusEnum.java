package cn.edu.fudan.issueservice.domain.enums;

import lombok.Getter;

/**
 * @author Beethoven
 */

@Getter
public enum IssueStatusEnum {

    /**
     * OPEN   代表该缺陷正待解决
     * SOLVED  代表该缺陷已被解决
     */
    OPEN("Open"),
    SOLVED("Solved");

    private final String name;

    IssueStatusEnum(String name) {
        this.name = name;
    }

    public static boolean isStatusRight(String status) {
        for (IssueStatusEnum statusEnum : IssueStatusEnum.values()) {
            if (statusEnum.getName().equals(status)) {
                return true;
            }
        }
        return false;
    }

    public String getName() {
        return name;
    }
}
