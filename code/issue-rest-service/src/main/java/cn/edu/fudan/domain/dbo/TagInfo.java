package cn.edu.fudan.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * @author Joshua
 * @description
 * @date 2022-08-12 14:24
 **/
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagInfo {

    private String repoUuid;
    private List<String> fileList;

    public static TagInfo createTagInfo(String repoUuid, List<String> fileList){

        return TagInfo.builder()
                .repoUuid(repoUuid)
                .fileList(new ArrayList<>(fileList))
                .build();
    }

}
