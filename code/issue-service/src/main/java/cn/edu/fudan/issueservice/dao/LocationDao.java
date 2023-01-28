package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.mapper.LocationMapper;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * @author WZY
 * @version 1.0
 **/
@Repository
public class LocationDao {

    private LocationMapper locationMapper;

    @Autowired
    public void setLocationMapper(LocationMapper locationMapper) {
        this.locationMapper = locationMapper;
    }

    public void insertLocationList(List<Location> locations) {
        if (locations.isEmpty()) {
            return;
        }
        locationMapper.insertLocationList(locations);
    }

    public void deleteLocationsByRepoUuid(@NonNull String repoUuid) {
        locationMapper.deleteLocationsByRepoUuid(repoUuid);
    }


    public List<Location> getLocations(String rawIssueId) {
        return locationMapper.getLocations(rawIssueId);
    }

    public List<Location> getLocationsByRawIssueAndRepo(String rawIssueId, String repoUuid) {
        return locationMapper.getLocationsByRawIssueAndRepo(rawIssueId, repoUuid);
    }

    public List<Location> getLocationsByRawIssues(List<String> rawIssueUuids){
        if(rawIssueUuids == null || rawIssueUuids.isEmpty()){
            return new ArrayList<>();
        }
        return locationMapper.getLocationsByRawIssues(rawIssueUuids);
    }

    public List<Map<String, Object>> getLocationsByRawIssueUuid(String uuid) {
        return locationMapper.getLocationsByRawIssueUuid(uuid);
    }

    public List<String> getRawIssueUuidsByMethodName(String methodName, String filePath) {
        return locationMapper.getRawIssueUuidsByMethodName(methodName, filePath);
    }

    public List<String> getRawIssueUuidsByFilePath(String repoUuid, String filePath) {
        return locationMapper.getRawIssueUuidsByFilePath(repoUuid,filePath);
    }

    public int getLocationCount(String repoUuid) {
        return locationMapper.getLocationCount(repoUuid);
    }
}
