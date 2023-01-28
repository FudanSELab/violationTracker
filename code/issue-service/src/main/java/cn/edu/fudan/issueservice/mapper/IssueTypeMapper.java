package cn.edu.fudan.issueservice.mapper;

import cn.edu.fudan.issueservice.domain.dbo.IssueType;
import cn.edu.fudan.issueservice.domain.dbo.IssueTypeJSON;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author Beethoven
 */
@Repository
public interface IssueTypeMapper {

    /**
     * 获取issueType
     *
     * @param type type
     * @return issueType
     */
    IssueType getIssueTypeByTypeName(@Param("type") String type);

    void insertIssueTypes(@Param("issueTypes") List<IssueTypeJSON> issueTypes);

    List<IssueTypeJSON> getIssueTypeJsons();

    /**
     * 根据 tool 获取 issue types
     * @param tool
     * @return
     */
    List<IssueType> getIssueTypesByTool(@Param("tool") String tool);
}
