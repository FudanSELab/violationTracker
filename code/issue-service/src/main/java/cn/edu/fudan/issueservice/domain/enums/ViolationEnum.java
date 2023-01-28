package cn.edu.fudan.issueservice.domain.enums;

import lombok.Getter;

/**
 * @Description
 *
 * @Copyright DoughIt Studio - Powered By DoughIt
 * @author Jerry Zhang <https://github.com/doughit>
 * @date 2022-08-03 09:34
 */
@Getter
public enum ViolationEnum {
    CASE("case"),
    INSTANCE("instance");
    private final String type;
    ViolationEnum(String type) {
        this.type = type;
    }
}
