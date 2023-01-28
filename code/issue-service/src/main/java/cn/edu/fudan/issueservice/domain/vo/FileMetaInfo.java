package cn.edu.fudan.issueservice.domain.vo;

import lombok.*;

/**
 * @author Jerry Zhang
 * create: 2022-07-05 14:44
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetaInfo {
//    private String commitId;
    private String fileName;
    private String className;
//    private String methodName;
    private Integer trackerNum;
}
