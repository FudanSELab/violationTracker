package cn.edu.fudan.domain.dbo;

import lombok.Data;

/**
 * @author Beethoven
 */
@Data
public class IssueType {


    /**
     * severity sourceId(eg： sonarqube  java:S2204)
     */

    private String uuid;
    private String type;
    private String specificationSource;
    private String category;
    private String description;
    private String language;
    private String severity;
    private String status;
    private String scope;

}
