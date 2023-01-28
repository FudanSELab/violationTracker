package cn.edu.fudan.issueservice.domain.dbo;

import cn.edu.fudan.issueservice.domain.dto.LocationMatchResult;
import cn.edu.fudan.issueservice.util.CosineUtil;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * fixme 修改不符合规范的field命名 已修改
 *
 * @author fancying
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Location {

    /**
     * location表主键是id，uuid为非唯一索引
     * uuid生成策略 文件名、startLine、endLine、startToken、endToken、repoUuid
     * uuid 用于生成rawIssueUuid、benchmark数据校验
     */
    private String uuid;
    private int startLine;
    private int endLine;
    @Deprecated
    private String bugLines;
    private int startToken;
    private int endToken;
    private String filePath;
    private String className;
    /**
     * 如果缺陷存在于方法内或方法签名上，则返回方法签名
     * 如果缺陷存在于成员变量，则返回成员变量名
     * 如果缺陷存在于（内部）类或静态代码块，则返回（内部）类名
     * 如果缺陷存在于类声明语句外，如 import、package 语句，则返回空
     */
    private String anchorName;
    private String rawIssueUuid;
    /**
     * 选取startLine endLine startToken endToken 指定的逻辑行代码
     */
    private String code;

    private String repoUuid;

    /**
     * location 起始位置相对于 所在方法或者属性起始位置的偏移量
     */
    private int offset = 0;

    private List<LocationMatchResult> locationMatchResults = new ArrayList<>(0);
    private boolean matched = false;
    private int matchedIndex = -1;

    private List<Byte> tokens = null;

    /**
     * 扫描时采用的路径，仅便于解析，不入库
     */
    private String sonarRelativeFilePath;

//    public static List<Location> valueOf(JSONArray locations) {
//        List<Location> locationList = new ArrayList<>();
//        for (int i = 0; i < locations.size(); i++) {
//            JSONObject tempLocation = locations.getJSONObject(i);
//            Location location = new Location();
//            location.setUuid(UUID.randomUUID().toString());
//            location.setBugLines(tempLocation.getString("bug_lines"));
//            location.setCode(tempLocation.getString("code"));
//            location.setStartLine(tempLocation.getIntValue("start_line"));
//            location.setEndLine(tempLocation.getIntValue("end_line"));
//            location.setMethodName(tempLocation.getString("method_name"));
//            locationList.add(location);
//        }
//        return locationList;
//    }

    public static String generateLocationUUID(String repoUuid, String filePath, int startLine, int endLine, int startToken, int endToken) {
        return generateLocationUUID(repoUuid, filePath, startLine, endLine, startToken, endToken, false);
    }

    /**
     * wholeProcessTest 模式去掉 repo uuid，便于根据 uuid 查找测试库与基准库之间的对应关系
     * @param repoUuid
     * @param filePath
     * @param startLine
     * @param endLine
     * @param startToken
     * @param endToken
     * @param wholeProcessTest
     * @return
     */
    public static String generateLocationUUID(String repoUuid, String filePath, int startLine, int endLine, int startToken, int endToken, boolean wholeProcessTest) {
        String locationString = (wholeProcessTest ? "" : repoUuid + "_") +
                filePath + "_" +
                startLine + "_" +
                endLine + "_" +
                startToken + "_" +
                endToken;
        return UUID.nameUUIDFromBytes(locationString.getBytes()).toString();
    }

    public String generateLocationUUID() {
        String locationString = repoUuid + "_" +
                filePath + "_" +
                startLine + "_" +
                endLine + "_" +
                startToken + "_" +
                endToken;
        return UUID.nameUUIDFromBytes(locationString.getBytes()).toString();
    }

    public String generateLocationUUIDDebug() {
        String locationString = repoUuid + "_" +
                filePath + "_" +
                startLine + "_" +
                endLine;
        return UUID.nameUUIDFromBytes(locationString.getBytes()).toString();
    }

    public List<Byte> getTokens() {
        if (tokens == null) {

//            tokens = CosineUtil.lexer(CosineUtil.removeComment(code), true);
            // 去掉注释的token对于匹配准确性影响不大，只在特定条件下改变，提高了准确性，并且避免了正则表达式匹配过程中可能产生的栈溢出问题
            tokens = CosineUtil.lexer(code, true);
        }
        return tokens;
    }

    public boolean isSame(Location location) {
        if (StringUtils.isEmpty(anchorName) || StringUtils.isEmpty(code) ||
                StringUtils.isEmpty(location.getAnchorName()) || StringUtils.isEmpty(location.getCode())) {
            return false;
        }

        return anchorName.equals(location.getAnchorName()) && code.equals(location.getCode());
    }

    @Override
    public int hashCode() {
        return super.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if (!(obj instanceof Location)) {
            return false;
        }
        Location location = (Location) obj;
        if (this.className != null && location.className != null
                && this.anchorName != null && location.anchorName != null) {
            if (bugLines == null && location.bugLines == null) {
                return location.className.equals(className) &&
                        location.anchorName.equals(anchorName) &&
                        location.filePath.equals(filePath);
            } else if (bugLines != null && location.bugLines != null) {

                return location.className.equals(className) &&
                        location.anchorName.equals(anchorName) &&
                        location.filePath.equals(filePath) &&
                        bugLines.split(",").length == location.bugLines.split(",").length;

            }

        }
        return false;
    }

    public void setMappedLocation(Location location2, double matchDegree) {
        matched = true;
        locationMatchResults.add(LocationMatchResult.newInstance(location2, matchDegree));
    }
}
