package cn.edu.fudan.issueservice.util.stat;

import cn.edu.fudan.issueservice.domain.dbo.LogicalStatement;

import java.util.List;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc 逻辑行
 * @date 2022-09-26 16:12
 */
public class LogicalStatementUtil {

    /**
     * @param filePath
     * @param beginLine 起始行号，从1开始
     * @param endLine   结束行号
     * @param offset    偏移量，从1开始
     * @return
     */
    public static LogicalStatement getLogicalStatement(String filePath, int beginLine, int endLine, int offset) {
        LogicalStatementRule logicalStatementRule = new LogicalStatementRule(filePath, beginLine, endLine, offset);
        return logicalStatementRule.getLogicalStatement(beginLine, offset);
    }

    /**
     * 获取逻辑语句
     *
     * @param filePath   文件路径
     * @param beginLines 起始行号s
     * @param endLines   结束行号s
     * @param offsets    位置偏移量
     * @return List<逻辑语句>
     */
    public static List<LogicalStatement> getLogicalStatements(String filePath, List<Integer> beginLines, List<Integer> endLines, List<Integer> offsets) {
        LogicalStatementRule logicalStatementRule = new LogicalStatementRule(filePath, beginLines, endLines, offsets);
        return logicalStatementRule.getLogicalStatements();
    }
}
