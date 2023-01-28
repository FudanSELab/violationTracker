package cn.edu.fudan.issueservice.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @author beethoven
 */

@Getter
@AllArgsConstructor
public enum ToolEnum {
    /**
     * 工具枚举
     */
    SONAR("sonarqube"),
    ESLINT("ESLint"),
    TSCANCODE("TscanCode");

    private final String type;

    public static String getToolByLanguage(String language) {
        if (LanguageEnum.JAVA.getName().equals(language)) {
            return SONAR.getType();
        } else if (LanguageEnum.JAVA_SCRIPT.getName().equals(language)) {
            return ESLINT.getType();
        } else if (LanguageEnum.CPP.getName().equals(language) || LanguageEnum.C.getName().equals(language)) {
            return TSCANCODE.getType();
        }
        return null;
    }

    public static boolean toolIsLegal(String tool) {
        for (ToolEnum value : ToolEnum.values()) {
            if (value.getType().equals(tool)) {
                return true;
            }
        }
        return false;
    }
}
