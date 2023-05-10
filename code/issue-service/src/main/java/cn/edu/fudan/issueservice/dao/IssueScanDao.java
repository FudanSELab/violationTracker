package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.issueservice.domain.dbo.Commit;
import cn.edu.fudan.issueservice.domain.dbo.IssueScan;
import cn.edu.fudan.issueservice.mapper.IssueScanMapper;
import cn.edu.fudan.issueservice.util.StringsUtil;
import org.eclipse.jgit.revwalk.RevCommit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.stream.Collectors;

/**
 * @author beethoven
 */
@Repository
public class IssueScanDao {

    protected IssueScanMapper issueScanMapper;

    @Autowired
    public void setScanMapper(IssueScanMapper issueScanMapper) {
        this.issueScanMapper = issueScanMapper;
    }

    public void insertOneIssueScan(IssueScan scan) {
        issueScanMapper.insertOneScan(scan);
    }

    public void deleteIssueScanByRepoIdAndTool(String repoId, String tool) {
        issueScanMapper.deleteIssueScanByRepoIdAndTool(repoId, tool);
    }

    public List<IssueScan> getIssueScanByRepoIdAndStatusAndTool(String repoId, List<String> status, String tool) {
        return issueScanMapper.getIssueScanByRepoIdAndStatusAndTool(repoId, status, tool);
    }

    public IssueScan getLatestIssueScanByRepoIdAndTool(String repoId, String tool) {
        return issueScanMapper.getLatestIssueScanByRepoIdAndTool(repoId, tool);
    }

    public Set<String> getScannedCommitList(String repoUuid, String tool) {
        return new HashSet<>(issueScanMapper.getScannedCommitList(repoUuid, tool));
    }

    public Map<String, String> getScanStatusInRepo(String repoUuid) {
        return issueScanMapper.getScanStatusInRepo(repoUuid).stream()
                .collect(Collectors.toMap(TwoValue::getFirst, TwoValue::getSecond));
    }

    public Map<String, String> getScanFailedCommitList(String repoUuid) {
        return issueScanMapper.getScanFailedCommitList(repoUuid).stream()
                .collect(Collectors.toMap(TwoValue::getFirst, TwoValue::getSecond));
    }

    public List<Commit> getAllCommitsBetween(String repoUuid, String since, String until) {
        return issueScanMapper.getAllCommitsWithParents(repoUuid, since, until);
    }

    public List<String> getAllCommitParents(JGitHelper jGitHelper, String repoUuid, String commit) {
        List<Commit> commits = getAllCommitsBetween(repoUuid, null, null);
        Map<String, List<String>> commitMap = new HashMap<>();
        commitMap.put(commit, new ArrayList<>());
        commits.forEach(c -> commitMap.put(c.getCommitId(), StringsUtil.parseParentCommits(c.getParentCommits())));
        // 尽量不通过 jgit 获取 commit 信息，存在性能问题
        // 当前 commit 信息还未存储到数据库 issue_scan 表中，通过 jGit 获取当前 commit 的 parents 信息，
        RevCommit[] parentCommits = jGitHelper.getRevCommit(commit).getParents();
        for (RevCommit parentCommit : parentCommits) {
            commitMap.get(commit).add(parentCommit.getName());
        }
        List<String> parentCommitList = new ArrayList<>();
        Queue<String> parentCommitQueue = new LinkedList<>();
        parentCommitQueue.offer(commit);
        while (!parentCommitQueue.isEmpty()) {
            String indexCommit = parentCommitQueue.poll();
            parentCommitList.add(indexCommit);
            List<String> parents = commitMap.getOrDefault(indexCommit, new ArrayList<>());
            for (String parent : parents) {
                if (!parentCommitList.contains(parent) && !parentCommitQueue.contains(parent)) {
                    parentCommitQueue.offer(parent);
                }
            }
        }
        return parentCommitList;
    }
}
