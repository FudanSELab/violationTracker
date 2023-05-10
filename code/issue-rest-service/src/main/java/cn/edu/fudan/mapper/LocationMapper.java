package cn.edu.fudan.mapper;

import cn.edu.fudan.domain.dbo.Location;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/**
 * @author beethoven
 */
@Repository
public interface LocationMapper {

    /**
     * insert locations
     *
     * @param list locations
     */
    void insertLocationList(List<Location> list);

    /**
     * get locations by raw issue uuid
     *
     * @param rawIssueId rawIssueUuid
     * @return locations
     */
    List<Location> getLocations(@Param("uuid") String rawIssueId);

    /**
     * delete locations by repo uuid
     *
     * @param repoUuid repo_uuid
     */
    void deleteLocationsByRepoUuid(@Param("repo_uuid") String repoUuid);

    /**
     * get locations by raw issue uuid
     *
     * @param uuid rawIssueUuid
     * @return locations
     */
    List<Location> getLocationsByRawIssueUuid(String uuid);

    /**
     * get rawIssueUuids by anchor name
     *
     * @param anchorName anchorName
     * @param filePath   filePath
     * @return rawIssueUuids
     */
    List<String> getRawIssueUuidsByMethodName(String anchorName, String filePath);

    /**
     * get issue filter detail
     *
     * @param rawIssueUuids rawIssueUuids
     * @return issue filter detail
     */
    List<Map<String, Object>> getIssueFilterDetailList(@Param("rawIssueUuids") List<String> rawIssueUuids);

    /**
     * get locations by raw issue uuids
     *
     * @param rawIssueUuids rawIssue_uuid
     * @return
     */
    List<Location> getLocationsByRawIssues(@Param("rawIssueUuids") List<String> rawIssueUuids);

    /**
     * get rawIssueUuids of the file
     *
     * @param repoUuid
     * @param filePath
     * @return
     */
    List<String> getRawIssueUuidsByFilePath(@Param("repoUuid") String repoUuid, @Param("filePath") String filePath);

    List<Location> getLocationsByRawIssueAndRepo(@Param("uuid") String rawIssueId, @Param("repoUuid") String repoUuid);

    int getLocationCount(String repoUuid);

}
