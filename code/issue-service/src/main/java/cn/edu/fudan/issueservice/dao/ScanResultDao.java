package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.issueservice.domain.dbo.Commit;
import cn.edu.fudan.issueservice.domain.dbo.IssueTrackerNode;
import cn.edu.fudan.issueservice.domain.dbo.ScanResult;
import cn.edu.fudan.issueservice.mapper.ScanResultMapper;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import cn.edu.fudan.issueservice.util.StringsUtil;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.annotations.Param;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.*;

/**
 * @author WZY
 * @version 1.0
 **/
@Slf4j
@Repository
public class ScanResultDao {

    private final Logger logger = LoggerFactory.getLogger(ScanResultDao.class);
    private ScanResultMapper scanResultMapper;

    @Autowired
    public void setScanResultMapper(ScanResultMapper scanResultMapper) {
        this.scanResultMapper = scanResultMapper;
    }

    public void addOneScanResult(ScanResult scanResult) {
        scanResultMapper.addOneScanResult(scanResult);
    }

    public void addScanResults(List<ScanResult> scanResults) {
        scanResultMapper.addScanResults(scanResults);
    }

    public void deleteScanResultsByRepoIdAndCategory(String repoUuid, String category) {
        try {
            scanResultMapper.deleteScanResultsByRepoIdAndCategory(repoUuid, category);
        } catch (Exception e) {
            logger.error(e.getMessage());
        }
    }


    public List<Map<String, Object>> getRepoIssueCounts(List<String> repoUuids, String since, String until, String category, String developer) {
        try {
            return scanResultMapper.getRepoIssueCounts(repoUuids, since, until, category, developer);
        } catch (Exception e) {
            logger.error(e.getMessage());
            return new ArrayList<>();
        }
    }

    public String findFirstDateByRepo(List<String> repoUuids) {
        return scanResultMapper.findFirstDateByRepo(repoUuids);
    }

    public void deleteScanResultsByRepoUuid(String repoUuid) {
        scanResultMapper.deleteScanResultsByRepoUuid(repoUuid);
    }

    public Map<String, Object> getRangeCommitDateUTC(String repoUuid, String tool) {
        return scanResultMapper.getRangeCommitDateUTC(repoUuid, tool);
    }

    public Timestamp getMinMaxScannedCommitDate(String repoUuid, String tool, Boolean isMin) {
        return scanResultMapper.getMinMaxScannedCommitDate(repoUuid, tool, isMin);
    }

    /**
     * ????????????????????? commit?????????????????? commit
     * @param repoUuid
     * @return
     */
    public List<Commit> getScannedCommits(String repoUuid) {
        return scanResultMapper.getScannedCommits(repoUuid);
    }

}
