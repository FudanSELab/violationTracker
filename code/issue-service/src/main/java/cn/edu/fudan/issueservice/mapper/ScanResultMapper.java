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
     * 插入scanResult
     *
     * @param scanResult scanResult
     */
    void addOneScanResult(ScanResult scanResult);

    /**
     * 删除scanResult
     *
     * @param repoId   repoUuid
     * @param category category
     */
    void deleteScanResultsByRepoIdAndCategory(@Param("repo_uuid") String repoId, @Param("category") String category);

    /**
     * 获取scanResult
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
     * 获取firstDate
     *
     * @param repoUuids repoUuids
     * @return firstDate
     */
    String findFirstDateByRepo(@Param("repoUuids") List<String> repoUuids);

    /**
     * 插入scanResult
     *
     * @param scanResults scanResults
     */
    void addScanResults(@Param("scanResults") List<ScanResult> scanResults);

    void deleteScanResultsByRepoUuid(@Param("repoUuid") String repoUuid);

    /**
     * 获取扫描的起止commit日期
     *
     * @param repoUuid
     * @param tool
     * @param isMin
     * @return
     */
    Timestamp getMinMaxScannedCommitDate(@Param("repoUuid") String repoUuid, @Param("tool") String tool, @Param("isMin") Boolean isMin);

    /**
     * 获取所有扫描的 commit 信息
     * @param repoUuid
     * @return
     */
    List<Commit> getScannedCommits(@Param("repoUuid") String repoUuid);

    /**
     * 包含 parent_commit 信息
     * @param repoUuid
     * @return
     */
    List<Commit> getScannedCommitsWithParents(@Param("repoUuid") String repoUuid);
}
