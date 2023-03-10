package cn.edu.fudan.issueservice.service;

import cn.edu.fudan.common.domain.po.scan.RepoScan;

import java.util.List;
import java.util.Map;

/**
 * @author Beethoven
 */
public interface IssueScanService {

    /**
     * 获取扫描状态
     * @param repoUuid repoUuid
     * @return
     */
    RepoScan getScanStatusByRepoUuid(String repoUuid) throws Exception;

    /**
     *
     * @param repoId   repoUuid
     * @return IssueRepo
     */
    List<RepoScan> getIssueReposByRepoUuid(String repoId);


    /**
     * 获取扫描失败的commit list
     *
     * @param repoUuid
     * @return
     */
    Map<String, String> getScanFailedCommitList(String repoUuid);

    /**
     *  Carry out relevant processing before rescanning, including obtaining the
     *  beginCommit and branch of the last scan, and then delete the relevant data of the database
     * @param repoUuid repo
     * @param tool tool
     * @return beginCommit、branch
     */
    RepoScan handleBeforeReScan(String repoUuid, String tool);

}
