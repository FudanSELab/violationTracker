package cn.edu.fudan.domain.vo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * @author beethoven
 * @date 2021-03-19 00:31:20
 */
@Data
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class IssueFilterSidebarVO {

    private String language;
    private List<IssueFilterSidebar> categories;

    @Data
    @Builder
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    public static class IssueFilterSidebar {
        private Long total;
        private String name;
        private List<IssueSideBarInfo> types;
    }

    @Builder
    @Data
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    public static class IssueSideBarInfo {
        private String type;
        private Long count;

        public static IssueSideBarInfo getSidebarInfo(long count, String type) {
            return IssueSideBarInfo.builder()
                    .count(count)
                    .type(type)
                    .build();
        }
    }

}
