package cn.edu.fudan.issueservice.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * description: commit view
 *
 * @author fancying
 * create: 2020-08-18 17:17
 **/
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Commit implements Serializable {

    protected String commitId;
    protected String commitTime;
    protected String authorTime;
    protected String developer;
    protected String developerEmail;
    protected String message;
    protected String repoId;
    protected String uuid;
    protected Boolean scanned = true;
    protected String parentCommits;

}
