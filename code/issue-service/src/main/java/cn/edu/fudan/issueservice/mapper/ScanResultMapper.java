package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.issueservice.domain.dbo.Commit;
import cn.edu.fudan.issueservice.domain.dbo.ScanResult;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

/**
 * @author Beethoven
 */
@Repository
public interface ScanResultMapper {

    /**
     * insert one scanResult
     *
     * @param scanResult scanResult
     */
    void addOneScanResult(ScanResult scanResult);

    /**
     * delete scanResults
     *
     * @param repoId   repoUuid
     * @param category category
     */
    void deleteScanResultsByRepoIdAndCategory(@Param("repo_uuid") String repoId, @Param("category") String category);

    /**
     * get scanResults
     *
     * @param repoUuids repoUuids
     * @param since     since
     * @param until     until
     * @param category  category
     * @param developer developer
     * @return scanResult
     */
    List<Map<String, Object>> getRepoIssueCounts(@Param("repoUuids") List<String> repoUuids, @Param("since") String since, @Param("until") String until, @Param("category") String category, @Param("developer") String developer);

    /**
     * get the first date
     *
     * @param repoUuids repoUuids
     * @return firstDate
     */
    String findFirstDateByRepo(@Param("repoUuids") List<String> repoUuids);

    /**
     * insert scanResults
     *
     * @param scanResults scanResults
     */
    void addScanResults(@Param("scanResults") List<ScanResult> scanResults);

    void deleteScanResultsByRepoUuid(@Param("repoUuid") String repoUuid);

    /**
     * get the min and max scanned commit dates
     *
     * @param repoUuid
     * @param tool
     * @param isMin
     * @return
     */
    Timestamp getMinMaxScannedCommitDate(@Param("repoUuid") String repoUuid, @Param("tool") String tool, @Param("isMin") Boolean isMin);

    /**
     * get all commits that have scanned
     * @param repoUuid
     * @return
     */
    List<Commit> getScannedCommits(@Param("repoUuid") String repoUuid);

    /**
     * get all commits with parent commits that have scanned
     * @param repoUuid
     * @return
     */
    List<Commit> getScannedCommitsWithParents(@Param("repoUuid") String repoUuid);
}
