package cn.edu.fudan.issueservice.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IssueTypeJSON {
    private String uuid;
    private String key;
    private String category;
    private String lang;
    private String type;
    private String specificationSource;
    private String description;
    private String severity;
}
