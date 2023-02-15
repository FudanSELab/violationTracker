package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author Joshua
 * @description
 * @date 2022-12-29 17:50
 **/
@Repository
public interface IssueRepoScanListMapper {

    void insertRepoScanList(@Param("issueRepoScanList") List<RepoScan> repoScanList);

    List<RepoScan> getRepoScansByCondition(@Param("repoUuid") String repoUuid, @Param("statusList") List<String> statusList);

    void updateStatusByRepoUuid(@Param("repoUuid") String repoUuid, @Param("status") String status);

}
