package cn.edu.fudan.issueservice.domain.enums;

/**
 * @author Beethoven
 */
public enum LanguageEnum {
    /**
     * Supported languages
     */
    JAVA("Java"),
    JAVA_SCRIPT("JavaScript"),
    CPP("C++"),
    C("C");

    private final String name;

    LanguageEnum(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
