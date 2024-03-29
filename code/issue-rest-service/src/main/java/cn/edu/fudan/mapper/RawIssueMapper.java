package cn.edu.fudan.mapper;

import cn.edu.fudan.domain.dbo.RawIssue;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * @author Beethoven
 */
@Repository
public interface RawIssueMapper {

    /**
     * insert rawIssues
     *
     * @param list rawIssue list
     */
    void insertRawIssueList(List<RawIssue> list);

    /**
     * delete rawIssues
     *
     * @param list rawIssue list
     */
    void deleteRawIssueByIds(@Param("list") List<String> list);

    /**
     * get rawIssues
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return rawIssue list
     */
    List<String> getRawIssueUuidsByRepoUuidAndTool(@Param("repo_uuid") String repoUuid, @Param("tool") String tool);

    /**
     * get the commit of the rawIssueUuid
     *
     * @param rawIssueUuid rawIssueUuid
     * @return commit
     */
    String getCommitByRawIssueUuid(String rawIssueUuid);

    /**
     * rawIssue
     *
     * @param issueUuid           issueUuid
     * @param preCommitsForParent preCommitsForParent
     * @return rawIssue
     */
    RawIssue getLastVersionRawIssue(String issueUuid, List<String> preCommitsForParent);


    /**
     * get rawIssues by uuids
     *
     * @param uuids uuids
     * @return rawIssue list
     */
    List<RawIssue> getRawIssuesByUuids(@Param("uuids") List<String> uuids);


    /**
     * get first version rawIssue uuids
     *
     * @param issueUuids issueUuids
     * @return rawIssue uuids
     */
    List<String> getFirstVersionRawIssueUuids(@Param("issueUuids") List<String> issueUuids);

    /**
     * get latest version rawIssue uuids
     *
     * @param issueUuids issueUuids
     * @return rawIssue uuids
     */
    List<String> getLatestVersionRawIssueUuids(@Param("issueUuids") List<String> issueUuids);

    /**
     * raw issue count
     *
     * @param repoUuid repoUuid
     * @param tool     tool
     * @return count
     */
    @Select("select count(*) from raw_issue where repo_uuid = #{repoUuid} and tool = #{tool}")
    int getRawIssueCount(String repoUuid, String tool);

    /**
     * get the max version of the issue
     *
     * @param issueUuid issueUuid
     * @return max version
     */
    @Select("select version from raw_issue where issue_uuid = #{issueUuid} order by version desc limit 1")
    int getMaxVersion(String issueUuid);

    /**
     * rawIssue
     *
     * @param rawIssueUuid rawIssueUuid
     * @return rawIssue
     */
    RawIssue getRawIssueByUuid(@Param("rawIssueUuid") String rawIssueUuid, @Param("repoUuid") String repoUuid);

    String getRawIssueDetail(@Param("issueUuid") String issueUuid);

    /**
     * get issue uuids by hashs
     *
     * @param rawIssueHashs rawIssueUuids
     * @return issue uuids
     */
    List<String> getIssueUuidsByRawIssueHashs(@Param("rawIssueHashs") List<String> rawIssueHashs, @Param("repoUuid") String repoUuid);

    String getIssueUuidByRawIssueHashAndParentCommits(@Param("repoUuid") String repoUuid, @Param("rawIssueHash") String rawIssueHash, @Param("parentCommits") List<String> parentCommits);

    String getRawIssueUuidByRawIssueHashAndParentCommits(@Param("repoUuid") String repoUuid, @Param("rawIssueHash") String rawIssueHash, @Param("parentCommits") List<String> parentCommits);

    String getIssueUuidsByRawIssueHash(@Param("rawIssueHash") String rawIssueHash, @Param("repoUuid") String repoUuid);

    /**
     * get the first raw issue
     *
     * @param issueUuids
     * @return rawIssue list
     */
    List<RawIssue> getFirstVersionIssues2RawIssueUuids(@Param("issueUuids") List<String> issueUuids);

    /**
     * get issue version and file path
     *
     * @param uuids
     * @return
     */
    List<Map<String, Object>> listSimpleRawIssueByRawIssueUuids(@Param("uuids") List<String> uuids);

    void deleteRawIssuesByRepoUuid(@Param("repoUuid") String repoUuid);

    List<RawIssue> getRawIssueUuidsByRawIssueHashAndParentCommits(@Param("repoUuid") String repoUuid, @Param("rawIssueHashes") List<String> hashes, @Param("parentCommits") List<String> allParentCommits);

    List<RawIssue> getRawIssuesByRepoUuidAndTool(String repoUuid, String tool);

    List<RawIssue> getRawIssueByRawIssueHash(@Param("repoUuid") String repoUuid, @Param("rawIssueHash") String rawIssueHash);
    List<RawIssue> getRawIssueByRawIssueHashList(@Param("repoUuid") String repoUuid, @Param("rawIssueHashList") List<String> rawIssueHashList);

    List<RawIssue> getRawIssueByIssueUuid(@Param("issueUuid") String issueUuid);
    List<RawIssue> getRawIssueByIssueUuidList(@Param("issueUuidList") List<String> issueUuidList);
}
