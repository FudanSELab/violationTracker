package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.issueservice.core.solved.SolvedRecord;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * description:
 *
 * @author fancying
 * create: 2021/10/25
 **/
@Repository
public interface SolvedRecordMapper {

    /**
     *
     * @param repoUuid repo_uuid
     * @param type     solve way
     * @return list
     */
    List<SolvedRecord> getAllByRepoUuidAndType(@Param("repo_uuid") String repoUuid, @Param("type") String type);

    /**
     * update records
     *
     * @param solvedRecords records
     */
    void batchUpdateStatus(@Param("solvedRecords") List<SolvedRecord> solvedRecords);


    /**
     * insert records
     *
     * @param solvedRecords 待插入列表
     */
    void batchInsert(@Param("solvedRecords") List<SolvedRecord> solvedRecords);

    /**
     * @param issueUuid
     * @description:
     * @return:
     * @author:keyon
     */

    String getTypeByIssueId(@Param("issue_uuid") String issueUuid);

}

