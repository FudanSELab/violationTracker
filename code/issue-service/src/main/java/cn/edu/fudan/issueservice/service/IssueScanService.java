package cn.edu.fudan.issueservice.service;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.issueservice.domain.dto.ScanRequestDTO;

import java.util.List;
import java.util.Map;

/**
 * @author Beethoven
 */
public interface IssueScanService {

    /**
     * get scan status by repo uuid
     *
     * @param repoUuid repoUuid
     * @return
     */
    RepoScan getScanStatusByRepoUuid(String repoUuid) throws Exception;

    /**
     * @param repoId repoId
     * @return IssueRepo
     * @throws Exception Exception
     */
    List<RepoScan> getIssueReposByRepoUuid(String repoId);

    /**
     * get the commits that have scanned failed
     *
     * @param repoUuid
     * @return
     */
    Map<String, String> getScanFailedCommitList(String repoUuid);

    /**
     * Get the list of repos waiting to be scanned and store them in the issue repo
     *
     * @param scanRequestDTOList the list of repos waiting to be scanned
     */
    void handleScanList(List<ScanRequestDTO> scanRequestDTOList) throws Exception;

    /**
     * Carry out relevant processing before rescanning, including obtaining the
     * beginCommit and branch of the last scan, and then delete the relevant data of the database
     *
     * @param repoUuid repo
     * @param tool     tool
     * @return beginCommit、branch
     */
    RepoScan handleBeforeReScan(String repoUuid, String tool);

}
