package cn.edu.fudan.issueservice.domain.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author beethoven
 * @date 2021-07-01 15:47:20
 */
@Data
@NoArgsConstructor
public class XmlError {

    private String file;
    private int line;
    private String id;
    private String subId;
    private String severity;
    private String msg;
    private String funcInfo;

}
