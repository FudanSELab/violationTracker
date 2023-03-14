package cn.edu.fudan.issueservice.domain.enums;

/**
 * @author fancying
 * @author beethoven
 * @date 2022-03-23 20:55:29
 */
public enum SolveWayEnum {

    /**
     * solveWayEnum.toString().toLowerCase()
     * DELETE
     */
    FILE_DELETE("file_delete"),
    ANCHOR_DELETE("anchor_delete"),
    CODE_DELETE("code_delete"),

    /**
     * CHANGE
     */
    CODE_CHANGE("code_change"),
    /**
     * Related to data flow and control flow
     * todo
     */
    CODE_RELATED_CHANGE("code_related_change"),
    /**
     * Independent of data flow and control flow
     */
    CODE_UNRELATED_CHANGE("code_unrelated_change"),

    EXCEPTION("exception");

    public final String lowercase;
    SolveWayEnum(String lowercase) {
        this.lowercase = lowercase;
    }
}

