package cn.edu.fudan.issueservice.domain.enums;

import lombok.Getter;

/**
 * @author Beethoven
 */
@Getter
public enum IgnoreTypeEnum {
    /**
     * DEFAULT 代表缺陷默认状态
     * IGNORE 代表忽略该缺陷
     * MISINFORMATION   代表该缺陷属于误报，假阳性
     * TO_REVIEW  代表该问题需要review是否真的是个缺陷
     */
    DEFAULT("Default"),
    IGNORE("Ignore"),
    PATH_IGNORE("Path Ignore"),
    MISINFORMATION("Misinformation"),
    TO_REVIEW("To_Review");

    private final String name;

    IgnoreTypeEnum(String name) {
        this.name = name;
    }

    /**
     * 检查状态name在不在枚举类中
     *
     * @param name name
     * @return true or false
     */
    public static boolean isStatusRight(String name) {
        for (IgnoreTypeEnum status : IgnoreTypeEnum.values()) {
            if (status.getName().equals(name)) {
                return true;
            }
        }
        return false;
    }

    public String getName() {
        return name;
    }
}
