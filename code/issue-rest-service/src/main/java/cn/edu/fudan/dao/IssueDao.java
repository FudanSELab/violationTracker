package cn.edu.fudan.dao;

import cn.edu.fudan.domain.dbo.Issue;
import cn.edu.fudan.domain.dbo.IssueWithLocationItem;
import cn.edu.fudan.domain.enums.IssueTypeStatusEnum;
import cn.edu.fudan.mapper.IssueMapper;
import com.alibaba.fastjson.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.*;

/**
 * @author beethoven
 * @author joshua
 */
@Repository
public class IssueDao {

    private IssueMapper issueMapper;

    @Autowired
    public void setIssueMapper(IssueMapper issueMapper) {
        this.issueMapper = issueMapper;
    }

    public void deleteIssueByRepoIdAndTool(String repoId, String tool) {
        issueMapper.deleteIssueByRepoUuidAndTool(repoId, tool);
    }

    public List<String> getRepoWithIssues(String developer) {
        return issueMapper.getRepoWithIssues(developer);
    }

    public List<String> getExistIssueTypes(String tool) {
        return issueMapper.getExistIssueTypes(tool);
    }

    public void updateOneIssuePriority(String issueId, int priority) {
        issueMapper.updateOneIssuePriority(issueId, priority);
    }

    public List<Issue> getIssuesByUuid(List<String> issueIds) {
        if (issueIds == null || issueIds.isEmpty()) {
            return new ArrayList<>();
        }
        return issueMapper.getIssuesByIds(issueIds);
    }

    public List<Issue> getIssuesByUuidAndRepoUuid(List<String> issueIds, String repoUuid) {
        if (issueIds == null || issueIds.isEmpty()) {
            return new ArrayList<>();
        }
        return issueMapper.getIssuesByIdsAndRepo(issueIds, repoUuid);
    }

    public void updateOneIssueStatus(String issueId, String status, String manualStatus) {
        issueMapper.updateOneIssueStatus(issueId, status, manualStatus);
    }

    public List<Issue> getNotSolvedIssueAllListByToolAndRepoId(List<String> repoUuids, String tool) {
        return issueMapper.getNotSolvedIssueAllListByToolAndRepoUuid(repoUuids, tool);
    }

    public int getIssueFilterListCount(Map<String, Object> query) {
        return issueMapper.getIssueFilterListCount(query);
    }

    public int getSolvedIssueFilterListCount(Map<String, Object> query) {
        return issueMapper.getSolvedIssueFilterListCount(query);
    }

    public void updateIssueManualStatus(String repoUuid, String issueUuid, String manualStatus, String issueType, String tool, String currentTime) {
        issueMapper.updateIssueManualStatus(repoUuid, issueUuid, manualStatus, issueType, tool, currentTime);
    }

    public List<Integer> getSelfIntroduceSelfSolvedIssueInfo(Map<String, Object> query) {
        return issueMapper.getSelfIntroduceSelfSolvedIssueInfo(query);
    }

    public List<Integer> getOtherIntroduceSelfSolvedIssueInfo(Map<String, Object> query) {
        return issueMapper.getOtherIntroduceSelfSolvedIssueInfo(query);
    }

    public List<Integer> getSelfIntroduceLivingIssueInfo(Map<String, Object> query) {
        return issueMapper.getSelfIntroduceLivingIssueInfo(query);
    }

    public List<Integer> getSelfIntroduceOtherSolvedIssueInfo(Map<String, Object> query) {
        return issueMapper.getSelfIntroduceOtherSolvedIssueInfo(query);
    }

    public List<JSONObject> getSelfIntroduceSelfSolvedIssueDetail(Map<String, Object> query) {
        return issueMapper.getSelfIntroduceSelfSolvedIssueDetail(query);
    }

    public List<JSONObject> getOtherIntroduceSelfSolvedIssueDetail(Map<String, Object> query) {
        return issueMapper.getOtherIntroduceSelfSolvedIssueDetail(query);
    }

    public List<JSONObject> getSelfIntroduceLivingIssueDetail(Map<String, Object> query) {
        return issueMapper.getSelfIntroduceLivingIssueDetail(query);
    }

    public List<JSONObject> getSelfIntroduceOtherSolvedIssueDetail(Map<String, Object> query) {
        return issueMapper.getSelfIntroduceOtherSolvedIssueDetail(query);
    }

    public List<String> getIssueIntroducers(List<String> repoUuids) {
        return issueMapper.getIssueIntroducers(repoUuids);
    }

    public int getRemainingIssueCount(String repoUuid) {
        return issueMapper.getRemainingIssueCount(repoUuid);
    }

    public List<JSONObject> getSelfIntroduceLivingIssueCount(Map<String, Object> query) {
        return issueMapper.getSelfIntroduceLivingIssueCount(query);
    }

    public List<Issue> getIssueCountByIntroducerAndTool(String developer) {
        return issueMapper.getIssueCountByIntroducerAndTool(developer);
    }

    public int getIssueCountByStatusAndRepoUuid(String status, String repoUuid) {
        return issueMapper.getIssueCountByStatusAndRepoUuid(status, repoUuid);
    }

    public List<Map<String, Object>> getIssuesOverview(Map<String, Object> query) {
        return issueMapper.getIssuesOverview(query);
    }

    public List<Map<String, Object>> getIssueCountByCategoryAndType(Map<String, Object> query) {
        return issueMapper.getIssueCountByCategoryAndType(query);
    }

    public Map<String, Object> getLivingIssueTendency(String until, String projectId, String showDetail) {
        String date = until.split(" ")[0];
        Map<String, Object> map = issueMapper.getLivingIssueTendency(until, projectId);
        map.put("date", date);
        if (Boolean.TRUE.toString().equals(showDetail)) {
            List<Map<String, Object>> detail = issueMapper.getLivingIssueTendencyDetail(until, projectId);
            map.put("detail", detail);
        }
        return map;
    }
    public Map<String, Object> getLivingIssueTendencyInIssueService(String until, String tool, String showDetail) {
        String date = until.split(" ")[0];
        Map<String, Object> map = issueMapper.getLivingIssueTendencyInIssueService(until, tool);
        map.put("date", date);
        if (Boolean.TRUE.toString().equals(showDetail)) {
            List<Map<String, Object>> detail = issueMapper.getLivingIssueTendencyDetailInIssueService(until, tool);
            map.put("detail", detail);
        }
        return map;
    }

    public List<Map<String, Object>> getIssueFilterList(Map<String, Object> query) {
        return issueMapper.getIssueFilterList(query);
    }

    public List<Map<String, Object>> getSolvedIssueFilterList(Map<String, Object> query) {
        return issueMapper.getSolvedIssueFilterList(query);
    }

    public Set<String> getIssuesByFilesToolAndRepo(List<String> preFiles, String repoId, String toolName) {
        if (preFiles.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(issueMapper.getIssuesByFilesToolAndRepo(preFiles, repoId, toolName));
    }

    public void updateIssuesForIgnore(List<String> ignoreFiles, String repoUuid) {
        if (ignoreFiles.isEmpty()) {
            return;
        }
        issueMapper.updateIssuesForIgnore(ignoreFiles, repoUuid);
    }

    public List<Map<String, Object>> getDeveloperListLivingIssue(String since, String until, String repoUuid, List<String> developers) {
        return issueMapper.getDeveloperListLivingIssue(since, until, repoUuid, developers);
    }

    public Set<String> getSolvedIssueUuidsByRepoUuid(String repoUuid) {
        return issueMapper.getSolvedIssueUuidsByRepoUuid(repoUuid);
    }

    public Date getLatestIntroduceTime(String developer) {
        return issueMapper.getLatestIntroduceTime(developer);
    }

    public int getOpenIssueCount(String repoUuid) {
        return issueMapper.getOpenIssueCount(repoUuid);
    }

    public void updateOneIssueAfterMerged(String issueId, String status, String solveCommit, String solver, Date solveCommitDate) {
        issueMapper.updateOneIssueAfterMerged(issueId, status, solveCommit, solver, solveCommitDate);
    }

    public List<Issue> getIssuesByRepos(List<String> repos) {
        return issueMapper.getIssuesByRepos(repos);
    }

    public List<Issue> getIssuesByRepo(String repo) {
        return issueMapper.getIssuesByRepo(repo);
    }

    public List<String> getSolvedIssuesByTypesAndFile(String repoUuid, List<String> issueTypes, String file) {
        if (issueTypes == null || issueTypes.isEmpty()) {
            return new ArrayList<>();
        }
        return issueMapper.getSolvedIssuesByTypeAndFile(repoUuid, issueTypes, file);
    }


    public void deleteIssuesByRepoUuid(String repoUuid) {
        issueMapper.deleteIssueByRepoUuid(repoUuid);
    }


    public List<Map<String, Object>> getDeveloperImportIssue(Map<String, Object> query) {
        return issueMapper.getDeveloperImportIssue(query);
    }

    public List<Map<String, Object>> getDeveloperSolvedIssue(Map<String, Object> query) {
        return issueMapper.getDeveloperSolvedIssue(query);
    }

    public List<Map<String, Object>> getSelfSolve(Map<String, Object> query) {
        return issueMapper.getSelfSolve(query);
    }

    public List<Map<String, Object>> getOtherSolveSelfIntroduce(Map<String, Object> query) {
        return issueMapper.getOtherSolveSelfIntroduce(query);
    }

    public List<Map<String, Object>> getDeveloperImportIssueByCommit(Map<String, Object> query) {
        return issueMapper.getDeveloperImportIssueByCommit(query);
    }

    public List<Map<String, Object>> getDeveloperSolveIssueByCommit(Map<String, Object> query) {
        return issueMapper.getDeveloperSolveIssueByCommit(query);
    }

    public List<String> getIssueTypes(String repoUuid, String tool, String developer) {
        return issueMapper.getIssueTypes(repoUuid, tool, developer);
    }

    public List<String> getIssueUuidsByRepoUuid(String repoUuid, String tool) {
        return issueMapper.getIssueUuidsByRepoUuid(repoUuid, tool);
    }

    public List<Map<String, String>> getIssueTypesInUuids(String repoUuid, String tool, List<String> issueUuids) {
        return issueMapper.getIssueTypesInUuids(repoUuid, tool, issueUuids);
    }

    public int getIssueCount(String repoUuid, String tool) {
        return issueMapper.getIssueCount(repoUuid, tool);
    }


    public List<String> getIssueUuidsByIssueTypeStatus(List<String> repoUuids, String tool, IssueTypeStatusEnum issueTypeStatusEnum) {
        return issueMapper.getIssueUuidsByIssueTypeStatus(repoUuids, tool, issueTypeStatusEnum.getStatus());
    }

    public List<IssueWithLocationItem> getIssuesByConditions(String repoUuid, String commitId, String filePath) {
        return issueMapper.getIssuesByConditions(repoUuid, commitId, filePath);
    }

}
