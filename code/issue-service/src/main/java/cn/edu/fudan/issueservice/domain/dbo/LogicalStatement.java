package cn.edu.fudan.issueservice.domain.dbo;

import com.github.javaparser.ast.Node;
import lombok.*;

import java.util.Objects;

/**
 * @author Jerry Zhang
 * create: 2022-06-24 17:28
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LogicalStatement {
    private String filePath;
    private Integer beginLine;
    private Integer endLine;
    private Integer offset;
    private Node node;
    private String content;
    private Boolean hit;
    private String packageName;
    private String className;
    private String anchorName;
    private Integer anchorLine;
    private Integer anchorOffset;
    private Boolean isBlock;

    public void setAnchorLine(Integer anchorLine) {
        this.anchorLine = anchorLine;
        this.anchorOffset = this.beginLine - anchorLine;
    }

    public void setAnchorOffset(Integer anchorOffset) {
        this.anchorOffset = anchorOffset;
        this.anchorLine = this.beginLine - anchorOffset;
    }

    @Override
    public int hashCode() {
        int result = 17;
        result = 31 * result + filePath.hashCode();
        result = 31 * result + beginLine.hashCode();
        result = 31 * result + offset.hashCode();
        return result;
    }

    @Override
    public boolean equals(Object statement) {
        if (statement instanceof LogicalStatement) {
            return Objects.equals(((LogicalStatement) statement).filePath, this.filePath) &&
                    Objects.equals(((LogicalStatement) statement).beginLine, this.beginLine) &&
                    Objects.equals(((LogicalStatement) statement).offset, this.offset);
        }
        return false;
    }
}
