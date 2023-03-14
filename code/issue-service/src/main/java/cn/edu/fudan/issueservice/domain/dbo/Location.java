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
     * The primary key of the location table is id, and the uuid is a non-unique index
     * The uuid generation strategy includes file name, startLine, endLine, startToken, endToken, and repoUuid
     * The uuid is used to generate rawIssueUuid and benchmark data validation
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
     * If the violation exists within the method or on the method signature, the method signature is returned
     * If the violation exists in a member variable, the member variable name is returned
     * If the violation exists in an (inner) class or static code block, the (inner) class name is returned
     * If the violation exists outside the class declaration statement, such as import, package statements, null is returned
     */
    private String anchorName;
    private String rawIssueUuid;
    /**
     * Select the logical line code specified by startLine, endLine, startToken and endToken
     */
    private String code;

    private String repoUuid;

    /**
     * It is the offset of the location start position relative to the method or property start position
     */
    private int offset = 0;

    private List<LocationMatchResult> locationMatchResults = new ArrayList<>(0);
    private boolean matched = false;
    private int matchedIndex = -1;

    private List<Byte> tokens = null;

    /**
     * It is the path used during scanning, which is only convenient for parsing and does not enter the warehouse
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
     * The repo uuid is removed in wholeProcessTest mode,
     * making it easier to find the correspondence between the test library and the benchmark library based on the uuid
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
