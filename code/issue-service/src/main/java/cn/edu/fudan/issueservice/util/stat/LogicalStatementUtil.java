package cn.edu.fudan.issueservice.util.stat;

import cn.edu.fudan.issueservice.domain.dbo.LogicalStatement;

import java.util.List;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc logical statements
 * @date 2022-09-26 16:12
 */
public class LogicalStatementUtil {

    /**
     * get one logical statement
     * @param filePath
     * @param beginLine start line number, starting with 1
     * @param endLine   end line number
     * @param offset    offset, starting with 1
     * @return LogicalStatement
     */
    public static LogicalStatement getLogicalStatement(String filePath, int beginLine, int endLine, int offset) {
        LogicalStatementRule logicalStatementRule = new LogicalStatementRule(filePath, beginLine, endLine, offset);
        return logicalStatementRule.getLogicalStatement(beginLine, offset);
    }

    /**
     * get logical statements
     *
     * @param filePath   file path
     * @param beginLines start line numbers, starting with 1
     * @param endLines   end line numbers
     * @param offsets    offsets, starting with 1
     * @return List<LogicalStatement>
     */
    public static List<LogicalStatement> getLogicalStatements(String filePath, List<Integer> beginLines, List<Integer> endLines, List<Integer> offsets) {
        LogicalStatementRule logicalStatementRule = new LogicalStatementRule(filePath, beginLines, endLines, offsets);
        return logicalStatementRule.getLogicalStatements();
    }
}
