package cn.edu.fudan.domain.dbo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 *
 * @author Jerry Zhang
 * create: 2022-06-24 15:40
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommitEdge implements Serializable {
    private String target;
    private String source;
    private String type;
    private String changeRelation;
    private Boolean comparable;
}
