package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.issueservice.domain.dto.AnalysisIssue;
import cn.edu.fudan.issueservice.mapper.RawIssueMatchInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.*;

/**
 * @author beethoven
 * @date 2021-01-19 16:04:34
 */
@Repository
public class RawIssueMatchInfoDao {

    private RawIssueMatchInfoMapper rawIssueMatchInfoMapper;

    @Autowired
    public void setRawIssueMatchInfoMapper(RawIssueMatchInfoMapper rawIssueMatchInfoMapper) {
        this.rawIssueMatchInfoMapper = rawIssueMatchInfoMapper;
    }

    public void insertRawIssueMatchInfoList(List<RawIssueMatchInfo> rawIssueMatchInfos) {
        if (rawIssueMatchInfos.isEmpty()) {
            return;
        }
        rawIssueMatchInfoMapper.insertRawIssueMatchInfoList(rawIssueMatchInfos);
    }

    public void deleteRawIssueMatchInfo(List<String> partOfRawIssueIds) {
        rawIssueMatchInfoMapper.deleteRawIssueMatchInfo(partOfRawIssueIds);
    }

    public List<Map<String, String>> getMatchInfoByIssueUuid(String issueUuid) {
        return rawIssueMatchInfoMapper.getMatchInfoByIssueUuid(issueUuid);
    }

    public List<String> getIssueUuidsByCommits(List<String> parentCommits) {
        return rawIssueMatchInfoMapper.getIssueByPreCommits(parentCommits);
    }

    @Deprecated
    public List<String> getMatchInfoByIssueUuidAndCommitsAndRepo(String issueUuid, List<String> parentCommits, String repoUuid) {
        return rawIssueMatchInfoMapper.getMatchInfoByIssueUuidAndCommitsAndRepo(issueUuid, parentCommits, repoUuid);
    }

    public boolean checkParentCommitHasIssue(String issueUuid, List<String> parentCommits, String repoUuid) {
        final List<RawIssueMatchInfo> matchInfosByIssueUuidAndRepo = rawIssueMatchInfoMapper.getByIssueUuidAndRepoUuid(issueUuid, repoUuid);
        if (matchInfosByIssueUuidAndRepo == null || matchInfosByIssueUuidAndRepo.isEmpty()) {
            return false;
        }
        return matchInfosByIssueUuidAndRepo.stream().anyMatch(rawIssueMatchInfo -> parentCommits.contains(rawIssueMatchInfo.getCurCommitId()));
    }


    public List<RawIssueMatchInfo> getMatchInfosByStatusAndCommits(String status, List<String> commitList) {
        return rawIssueMatchInfoMapper.getMatchInfosByStatusAndCommits(status, commitList);
    }

    public Map<String, List<RawIssueMatchInfo>> getRawIssueMathInfoByIssueAndCommit(String issueUuid, List<String> commits, String repoUuid) {
        Map<String, List<RawIssueMatchInfo>> map = new HashMap<>();
        commits.forEach(commit -> map.put(commit, rawIssueMatchInfoMapper.getRawIssueMathInfoByIssueAndCommit(issueUuid, commit, repoUuid)));
        return map;
    }

    public List<RawIssueMatchInfo> getMatchInfoByCurRawIssueAndCommit(String rawIssueUuid, String commit) {
        return rawIssueMatchInfoMapper.getMatchInfoByCurRawIssueAndCommit(rawIssueUuid, commit);
    }

    public List<RawIssueMatchInfo> getMatchInfoByRepoUuidAndCommit(String repoUuid, String commit) {
        List<RawIssueMatchInfo> rawIssueMatchInfos = rawIssueMatchInfoMapper.getMatchInfoByRepoUuidAndCommit(repoUuid, commit);
        return rawIssueMatchInfos == null ? new ArrayList<>() : rawIssueMatchInfos;
    }


    public Map<String, List<String>> getDuplicateCurRawIssueToIssues(String repoUuid, String commit) {
        Map<String, List<String>> rawIssueToIssues = new HashMap<>();
        List<String> rawIssues = rawIssueMatchInfoMapper.getDuplicateCurRawIssue(repoUuid, commit);
        for (String rawIssue : rawIssues) {
            List<String> issueUuids = rawIssueMatchInfoMapper.getDuplicateCurRawIssueToIssues(rawIssue);
            if (!issueUuids.isEmpty() && (!issueUuids.get(0).equals(issueUuids.get(1)))) {
                rawIssueToIssues.put(rawIssue, issueUuids);
            }
        }
        return rawIssueToIssues;
    }


    public RawIssueMatchInfo getMaxIdMatchInfoByIssueUuid(String uuid) {
        RawIssueMatchInfo info = rawIssueMatchInfoMapper.getMaxIdMatchInfoByIssueUuid(uuid, "solved");
        if (info == null) {
            return rawIssueMatchInfoMapper.getMaxIdMatchInfoByIssueUuid(uuid, "solved merge");
        }
        return info;
    }

    public Set<String> getCurCommitsByIssueUuid(String issueUuid) {
        return new HashSet<>(rawIssueMatchInfoMapper.getCurCommitsByIssueUuid(issueUuid));
    }

    public List<RawIssueMatchInfo> listRawIssueMatchInfoByRepoAndTime(String repoUuid, String rawIssueCommitTime, String issueUuid) {
        return rawIssueMatchInfoMapper.listRawIssueMatchInfoByRepoAndTime(repoUuid, rawIssueCommitTime, issueUuid);
    }

    public List<Map<String, String>> listMatchInfoByIssueUuids(List<String> issueUuids) {
        return rawIssueMatchInfoMapper.listMatchInfoByIssueUuids(issueUuids);
    }


    public void deleteMatchInfosByRepoUuid(String repoUuid) {
        rawIssueMatchInfoMapper.deleteRawIssueMatchInfoByRepoUuid(repoUuid);
    }

    public List<AnalysisIssue> getAnalysisIssueInfo(String repoUuid, List<String> commits, String status) {
        return rawIssueMatchInfoMapper.getAnalysisIssueInfo(repoUuid, commits, status);
    }

    public int getMatchInfoCount(String repoUuid) {
        return rawIssueMatchInfoMapper.getMatchInfoCount(repoUuid);
    }
}
