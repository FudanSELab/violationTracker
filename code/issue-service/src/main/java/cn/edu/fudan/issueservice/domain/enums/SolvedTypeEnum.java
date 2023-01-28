package cn.edu.fudan.issueservice.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * @description:
 * @author: keyon
 * @time: 2021/11/21 8:29 下午
 */
@Getter
@AllArgsConstructor
public enum SolvedTypeEnum {
    DELETED("deleted"),
    UNKNOWN("unknown"),
    FILE_PATH_NULL("file_path_null");

    public final String type;

    public static String getSolvedType(List<String> list) {
        if (list.contains(DELETED.getType())) {
            return "deleted";
        } else {
            return "not deleted";
        }

    }


}
