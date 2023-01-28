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
     * 临时方法  得到所有没归类的 SolvedRecord
     *
     * @param repoUuid repo_uuid
     * @param type     解决的类型
     * @return list
     */
    List<SolvedRecord> getAllByRepoUuidAndType(@Param("repo_uuid") String repoUuid, @Param("type") String type);

    /**
     * 批量更新
     *
     * @param solvedRecords 待更新列表
     */
    void batchUpdateStatus(@Param("solvedRecords") List<SolvedRecord> solvedRecords);


    /**
     * 批量插入解决的问题记录
     *
     * @param solvedRecords 待插入列表
     */
    void batchInsert(@Param("solvedRecords") List<SolvedRecord> solvedRecords);

    /**
     * @param issueUuid
     * @description:
     * @return:
     * @author:keyon
     * @time:2021/11/18 8:29 下午
     */

    String getTypeByIssueId(@Param("issue_uuid") String issueUuid);

}

