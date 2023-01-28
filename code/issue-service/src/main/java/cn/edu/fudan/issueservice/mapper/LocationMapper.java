package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.issueservice.domain.dbo.Location;
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
     * 获取locations
     *
     * @param rawIssueId rawIssueUuid
     * @return locations
     */
    List<Location> getLocations(@Param("uuid") String rawIssueId);

    /**
     * 通过repo_uuid 删除location
     *
     * @param repoUuid repo_uuid
     */
    void deleteLocationsByRepoUuid(@Param("repo_uuid") String repoUuid);

    /**
     * 获取locations
     *
     * @param uuid rawIssueUuid
     * @return locations
     */
    List<Map<String, Object>> getLocationsByRawIssueUuid(String uuid);

    /**
     * 获取某个方法的rawIssueUuids
     *
     * @param anchorName anchorName
     * @param filePath   filePath
     * @return 某个方法的rawIssueUuids
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
     * 根据rawIssues 获取locations
     * @param rawIssueUuids location 表中的 rawIssue_uuid
     * @return
     */
    List<Location> getLocationsByRawIssues(@Param("rawIssueUuids") List<String> rawIssueUuids);

    /**
     * 获取文件的rawIssueUuids
     *
     * @param repoUuid
     * @param filePath
     * @return
     */
    List<String> getRawIssueUuidsByFilePath(@Param("repoUuid") String repoUuid, @Param("filePath") String filePath);

    List<Location> getLocationsByRawIssueAndRepo(@Param("uuid")String rawIssueId, @Param("repoUuid")String repoUuid);

    int getLocationCount(String repoUuid);

}
