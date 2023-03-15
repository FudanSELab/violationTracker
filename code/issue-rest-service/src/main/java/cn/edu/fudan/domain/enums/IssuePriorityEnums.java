package cn.edu.fudan.domain.enums;

import lombok.Getter;

import java.util.Objects;

/**
 * @author beethoven
 * @date 2021-07-01 18:08:23
 */
public class IssuePriorityEnums {

    public static String getIssueCategory(String tool, int priority) {
        if (ToolEnum.TSCANCODE.getType().equals(tool)) {
            return CppIssuePriorityEnum.getPriorityByRank(priority);
        } else if (ToolEnum.ESLINT.getType().equals(tool)) {
            return JavaScriptIssuePriorityEnum.getPriorityByRank(priority);
        }
        return null;
    }

    @Getter
    public enum JavaIssuePriorityEnum {

        /**
         * violation priority
         */
        LOW("Low", 4, "Info"),
        NORMAL("Normal", 3,"Minor"),
        HIGH("High", 2,"Major"),
        URGENT("Urgent", 1,"Critical"),
        IMMEDIATE("Immediate", 0,"Blocker");

        private final String name;
        private final String tName;
        private final int rank;

        JavaIssuePriorityEnum(String name, int rank, String tName) {
            this.name = name;
            this.rank = rank;
            this.tName = tName;
        }

        public static JavaIssuePriorityEnum getPriorityEnum(String name) {
            for (JavaIssuePriorityEnum priority : JavaIssuePriorityEnum.values()) {
                if (priority.getName().equals(name)) {
                    return priority;
                }
            }
            return null;
        }

        public static JavaIssuePriorityEnum getPriorityEnumByRank(int rank) {
            for (JavaIssuePriorityEnum priority : JavaIssuePriorityEnum.values()) {
                if (priority.getRank() == rank) {
                    return priority;
                }
            }
            return null;
        }
    }

    @Getter
    public enum JavaScriptIssuePriorityEnum {
        /**
         * violation priority in javascript
         */
        OFF("Off", 0),
        WARN("Warn", 1),
        ERROR("Error", 2);

        private final String name;
        private final int rank;

        JavaScriptIssuePriorityEnum(String name, int rank) {
            this.name = name;
            this.rank = rank;
        }

        public static String getPriorityByRank(int rank) {
            for (JavaScriptIssuePriorityEnum priority : JavaScriptIssuePriorityEnum.values()) {
                if (priority.getRank() == rank) {
                    return priority.name;
                }
            }
            return null;
        }
    }

    @Getter
    public enum CppIssuePriorityEnum {
        /**
         * violaiton priority in c++
         */
        INFORMATION("Information", 0),
        WARNING("Warning", 1),
        SERIOUS("Serious", 2),
        CRITICAL("Critical", 3);

        private final String name;
        private final int rank;

        CppIssuePriorityEnum(String name, int rank) {
            this.name = name;
            this.rank = rank;
        }

        public static int getRankByPriority(String name) {

            if (INFORMATION.name.equals(name)) {
                return INFORMATION.rank;
            } else if (WARNING.name.equals(name)) {
                return WARNING.rank;
            } else if (SERIOUS.name.equals(name)) {
                return SERIOUS.rank;
            } else if (CRITICAL.name.equals(name)) {
                return CRITICAL.rank;
            }

            return 0;
        }

        public static String getPriorityByRank(int rank) {
            for (CppIssuePriorityEnum priority : CppIssuePriorityEnum.values()) {
                if (priority.getRank() == rank) {
                    return priority.name;
                }
            }
            return null;
        }
    }

    public static String getPriorityByToolAndRank(String tool, int priorityNum){
        String priority = "";
        if (ToolEnum.SONAR.getType().equals(tool)) {
            priority = Objects.requireNonNull(JavaIssuePriorityEnum.getPriorityEnumByRank(priorityNum)).getName();
        } else if (ToolEnum.ESLINT.getType().equals(tool)) {
            priority = Objects.requireNonNull(JavaScriptIssuePriorityEnum.getPriorityByRank(priorityNum));
        } else if (ToolEnum.TSCANCODE.getType().equals(tool)) {
            priority = Objects.requireNonNull(CppIssuePriorityEnum.getPriorityByRank(priorityNum));
        }
        return priority;
    }

}
