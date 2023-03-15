package cn.edu.fudan.domain.vo;

import lombok.Builder;
import lombok.Data;

/**
 * @author beethoven
 * @date 2021-05-12 15:40:18
 */
@Data
@Builder
public class DeveloperLivingIssueVO {

    private String developerName;
    private Long num;
    private Level level;

    public static Level getLevel(int level) {
        for (Level value : Level.values()) {
            if (value.type == level) {
                return value;
            }
        }
        return null;
    }

    public enum Level {
        /**
         * level
         */
        WORST(1),
        WORSE(2),
        NORMAL(3),
        BETTER(4),
        BEST(5);

        private final int type;

        Level(int type) {
            this.type = type;
        }
    }
}
