package cn.edu.fudan.domain.enums;

import lombok.Getter;

/**
 * @author Beethoven
 */
@Getter
public enum IgnoreTypeEnum {
    /**
     * DEFAULT, Default status
     * IGNORE, Ignore this issue
     * MISINFORMATION, False positive
     * TO_REVIEW, The problem requires a review to see if it is really a violation
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
