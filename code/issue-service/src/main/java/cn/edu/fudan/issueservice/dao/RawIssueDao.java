package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.mapper.RawIssueMapper;
import cn.edu.fudan.issueservice.mapper.RawIssueMatchInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author WZY
 * @version 1.0
 **/
@Repository
public class RawIssueDao {

    private RawIssueMapper rawIssueMapper;

    private LocationDao locationDao;

    private RawIssueMatchInfoMapper rawIssueMatchInfoMapper;

    public void insertRawIssueList(List<RawIssue> list) {
        if (list.isEmpty()) {
            return;
        }
        rawIssueMapper.insertRawIssueList(list);
    }

    public void deleteRawIssueByIds(List<String> rawIssueIds) {
        if (rawIssueIds == null || rawIssueIds.isEmpty()) {
            return;
        }
        rawIssueMapper.deleteRawIssueByIds(rawIssueIds);
    }

    public List<String> getRawIssueUuidsByRepoIdAndTool(String repoId, String tool) {
        return rawIssueMapper.getRawIssueUuidsByRepoUuidAndTool(repoId, tool);
    }

    public String getCommitByRawIssueUuid(String rawIssueUuid) {
        return rawIssueMapper.getCommitByRawIssueUuid(rawIssueUuid);
    }

    public List<RawIssue> getLastVersionRawIssues(List<String> preCommitsForParent, List<String> issueUuids) {
        if (preCommitsForParent.isEmpty() || issueUuids.isEmpty()) {
            return new ArrayList<>();
        }
        List<RawIssue> rawIssues = new ArrayList<>();
        for (String issueUuid : issueUuids) {
            RawIssue lastVersionRawIssue = rawIssueMapper.getLastVersionRawIssue(issueUuid, preCommitsForParent);
            if(lastVersionRawIssue != null){
                rawIssues.add(lastVersionRawIssue);
            }
        }
        rawIssues.forEach(rawIssue -> rawIssue.setVersion(rawIssueMapper.getMaxVersion(rawIssue.getIssueId())));
        return rawIssues;
    }

    public List<RawIssue> getLastVersionRawIssuesWithLocation(List<String> preCommitsForParent, List<String> issueUuids) {
        List<RawIssue> rawIssues = getLastVersionRawIssues(preCommitsForParent, issueUuids);
        setLocationInRawIssues(rawIssues);
        return rawIssues;
    }



    public List<RawIssue> getRawIssueWithLocationByUuids(List<String> rawIssueUuids) {
        if (rawIssueUuids.isEmpty()) {
            return Collections.emptyList();
        }
        List<RawIssue> rawIssues = rawIssueMapper.getRawIssuesByUuids(rawIssueUuids);
        if (rawIssues == null) {
            return Collections.emptyList();
        }
        setLocationInRawIssues(rawIssues);
        return rawIssues;
    }

    private void setLocationInRawIssues(List<RawIssue> rawIssues) {
        Map<String, List<Location>> locationMap = locationDao.getLocationsByRawIssues(rawIssues.stream()
                .map(RawIssue::getUuid)
                .collect(Collectors.toList()))
                .parallelStream().collect(Collectors
                        .groupingBy(Location::getRawIssueUuid));

        rawIssues.forEach(r -> r.setLocations(locationMap.get(r.getUuid())));
    }



    public List<String> getFirstVersionRawIssueUuids(List<String> issueUuids) {
        if(issueUuids.isEmpty()){
            return new ArrayList<>();
        }
        List<String> firstVersionRawIssueUuids = rawIssueMapper.getFirstVersionRawIssueUuids(issueUuids);
        return firstVersionRawIssueUuids == null?new ArrayList<>():firstVersionRawIssueUuids;
    }

    public List<RawIssue> getFirstVersionIssues2RawIssueUuids(List<String> issueUuids) {
        if (issueUuids.isEmpty()) {
            return new ArrayList<>();
        }
        List<RawIssue> issue2RawIssue = rawIssueMapper.getFirstVersionIssues2RawIssueUuids(issueUuids);
        return issue2RawIssue == null ? new ArrayList<>() : issue2RawIssue;
    }

    public List<String> getLatestVersionRawIssueUuids(List<String> issueUuids) {
        return rawIssueMapper.getLatestVersionRawIssueUuids(issueUuids);
    }

    public RawIssue getRawIssueByUuid(String rawIssueUuid, String repoUuid) {
        return rawIssueMapper.getRawIssueByUuid(rawIssueUuid,repoUuid);
    }

    public RawIssue getRawIssueIncludingLocations(String rawIssueUuid, String repoUuid) {
        RawIssue rawIssue = rawIssueMapper.getRawIssueByUuid(rawIssueUuid,repoUuid);
        if (rawIssue != null) {
            rawIssue.setLocations(locationDao.getLocations(rawIssue.getUuid()));
        }
        return rawIssue;
    }


    public String getRawIssueDetailByIssueUuid(String issueUuid) {
        return rawIssueMapper.getRawIssueDetail(issueUuid);
    }

    public Set<String> getIssueUuidsByRawIssueHashs(List<String> list, String repoUuid) {
        if (list.isEmpty())
            return new HashSet<>();
        return new HashSet<>(rawIssueMapper.getIssueUuidsByRawIssueHashs(list,repoUuid));
    }

    public String getIssueUuidsByRawIssueHash(String rawIssueHash, String repoUuid) {
        return rawIssueMapper.getIssueUuidsByRawIssueHash(rawIssueHash, repoUuid);
    }

    public List<Map<String, Object>> listSimpleRawIssueByRawIssueUuids(List<String> uuids) {
        if (uuids.isEmpty()) {
            return new ArrayList<>();
        }
        List<Map<String, Object>> rawIssues = rawIssueMapper.listSimpleRawIssueByRawIssueUuids(uuids);
        return rawIssues == null ? new ArrayList<>() : rawIssues;
    }

    public String getIssueUuidByRawIssueHashAndParentCommits(String repoUuid, String rawIssueHash, List<String> parentCommits){
        if(parentCommits == null || parentCommits.isEmpty()){
            return null;
        }
        return rawIssueMapper.getIssueUuidByRawIssueHashAndParentCommits(repoUuid,rawIssueHash, parentCommits);
    }

    public void deleteRawIssuesByRepoUuid(String repoUuid){
        rawIssueMapper.deleteRawIssuesByRepoUuid(repoUuid);
    }


    public List<RawIssue> getRawIssuesByRawIssueHashes(String repoUuid, List<String> hashes) {
        List<RawIssue> rawIssueList = rawIssueMapper.getRawIssueUuidsByRawIssueHashAndParentCommits(repoUuid,hashes,new ArrayList<>());
        return rawIssueList == null ? new ArrayList<>() : rawIssueList;
    }

    public List<RawIssue> getRawIssueUuidsByRawIssueHashAndParentCommits(String repoUuid, List<String> hashes, List<String> allParentCommits) {
        if (hashes == null || allParentCommits == null || hashes.isEmpty() || allParentCommits.isEmpty()) {
            return new ArrayList<>();
        }
        List<RawIssue> rawIssueList = rawIssueMapper.getRawIssueUuidsByRawIssueHashAndParentCommits(repoUuid,hashes,allParentCommits);
        return rawIssueList == null ? new ArrayList<>() : rawIssueList;
    }

    public List<RawIssue> getRawIssuesByRepoIdAndTool(String repoUuid, String tool) {
        return rawIssueMapper.getRawIssuesByRepoUuidAndTool(repoUuid, tool);
    }

    public int getRawIssueCount(String repoUuid, String tool) {
        return rawIssueMapper.getRawIssueCount(repoUuid, tool);
    }

    @Autowired
    public void setLocationDao(LocationDao locationDao) {
        this.locationDao = locationDao;
    }

    @Autowired
    public void setRawIssueMapper(RawIssueMapper rawIssueMapper) {
        this.rawIssueMapper = rawIssueMapper;
    }

    @Autowired
    public void setRawIssueMatchInfoMapper(RawIssueMatchInfoMapper rawIssueMatchInfoMapper) {
        this.rawIssueMatchInfoMapper = rawIssueMatchInfoMapper;
    }
}
