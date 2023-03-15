package cn.edu.fudan.dao;

import cn.edu.fudan.domain.dbo.IssueType;
import cn.edu.fudan.domain.dbo.IssueTypeJSON;
import cn.edu.fudan.mapper.IssueTypeMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * @author beethoven
 */
@Repository
public class IssueTypeDao {

    private IssueTypeMapper issueTypeMapper;

    @Autowired
    public void setIssueMapper(IssueTypeMapper issueTypeMapper) {
        this.issueTypeMapper = issueTypeMapper;
    }

    public IssueType getIssueTypeByTypeName(String type) {
        return issueTypeMapper.getIssueTypeByTypeName(type);
    }

    public void insertIssueTypes(List<IssueTypeJSON> issueTypes) {
        issueTypeMapper.insertIssueTypes(issueTypes);
    }

    public List<IssueTypeJSON> getIssueTypeJsons() {
        return issueTypeMapper.getIssueTypeJsons();
    }

    public List<IssueType> getIssueTypes(String tool){
        return issueTypeMapper.getIssueTypesByTool(tool);}
}
