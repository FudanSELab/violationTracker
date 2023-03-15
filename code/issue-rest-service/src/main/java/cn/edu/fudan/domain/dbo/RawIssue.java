package cn.edu.fudan.domain.dbo;

import cn.edu.fudan.domain.enums.RawIssueStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

/**
 * fixme Modify the non-compliant field naming in RawIssue, such as scan_id and detail
 *
 * @author fancying
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RawIssue {

    private int id;
    /**
     * key: the last UUID generated in this thread, value: count
     */
    private static ThreadLocal<HashMap<String, Integer>> generateUuidCaches = ThreadLocal.withInitial(HashMap::new);
    /**
     * status=default
     * true: not change  false: change
     **/
    boolean notChange = false;
    /**
     * Multi-branch cases
     **/
    boolean onceMapped = false;
    private String uuid;
    private String type;
    private String tool;
    private String detail;
    private String fileName;
    private String scanId;
    private String commitId;
    private String message;
    private String repoUuid;
    private int codeLines;
    private Date commitTime;
    private List<Location> locations;
    private int version = 1;
    private int priority;
    private String developerName;
    private String rawIssueHash;
    private String status = RawIssueStatus.ADD.getType();
    private String issueId;
    private int matchResultDTOIndex = -1;
    /**
     * Whether it maps to an issue
     **/
    private boolean mapped = false;
    /**
     * The rawIssue that it really matches
     */
    private RawIssue mappedRawIssue = null;
    private double matchDegree;
    private List<RawIssueMatchInfo> matchInfos = new ArrayList<>(8);

    /**
     * location uuid + commitId
     * rawIssue uuid => first issue uuid
     */
    public static String generateRawIssueUUID(RawIssue rawIssue) {
        HashMap<String, Integer> latestUuids = generateUuidCaches.get();
        List<String> locationBugLines = rawIssue.getLocations().stream()
                .map(Location::getUuid).sorted().collect(Collectors.toList());
        StringBuilder locationStringBuilder = new StringBuilder();
        locationBugLines.forEach(location -> locationStringBuilder.append(location).append("_"));
        String stringBuilder = locationStringBuilder +
                rawIssue.getCommitId();
        String uuid = UUID.nameUUIDFromBytes(stringBuilder.getBytes()).toString();
        if (!latestUuids.containsKey(uuid)) {
            latestUuids.put(uuid, 1);
            return uuid;
        }
        int duplicateNum = latestUuids.get(uuid);
        stringBuilder += duplicateNum;
        latestUuids.put(uuid, duplicateNum + 1);
        uuid = UUID.nameUUIDFromBytes(stringBuilder.getBytes()).toString();
        return uuid;
    }

    /**
     * location uuid + type
     */
    public static String generateRawIssueHash(RawIssue rawIssue) {
        List<String> locationBugLines = rawIssue.getLocations().stream()
                .map(Location::getUuid).sorted().collect(Collectors.toList());
        StringBuilder locationStringBuilder = new StringBuilder();
        locationBugLines.forEach(location -> locationStringBuilder.append(location).append("_"));
        String stringBuilder = locationStringBuilder +
                rawIssue.getType();
        return UUID.nameUUIDFromBytes(stringBuilder.getBytes()).toString();
    }

    public static boolean isSameLocation(RawIssue rawIssue1, RawIssue rawIssue2) {
        List<Location> locations1 = rawIssue1.getLocations();
        List<Location> locations2 = rawIssue2.getLocations();
        if (!rawIssue1.getFileName().equals(rawIssue2.getFileName()) || locations1.size() != locations2.size()) {
            return false;
        }

        locations1.sort((o1, o2) -> o1.getStartLine() != o2.getStartLine() ?
                o1.getStartLine() - o2.getStartLine() : o1.getEndLine() - o2.getEndLine());
        locations2.sort((o1, o2) -> o1.getStartLine() != o2.getStartLine() ?
                o1.getStartLine() - o2.getStartLine() : o1.getEndLine() - o2.getEndLine());

        for (int i = 0; i < locations1.size(); i++) {
            Location location1 = locations1.get(i);
            Location location2 = locations2.get(i);
            if (location1.getOffset() != location2.getOffset() ||
                    !methodEquals(location1.getAnchorName(), location2.getAnchorName()) ||
                    !location1.getCode().equals(location2.getCode())) {
                return false;
            }
        }
        return true;
    }

    private static boolean methodEquals(String methodName1, String methodName2) {
        if (methodName1 == null && methodName2 == null) {
            return true;
        } else if (methodName1 == null) {
            return false;
        } else if (methodName2 == null) {
            return false;
        } else {
            return methodName1.equals(methodName2);
        }
    }

    public void resetMappedInfo() {
        mapped = false;
        status = RawIssueStatus.ADD.getType();
        matchResultDTOIndex = -1;
        mappedRawIssue = null;
        matchDegree = 0.0;
    }

    public void addRawIssueMappedResult(RawIssue rawIssue, double matchDegree) {
        mapped = true;
    }

    public RawIssueMatchInfo generateRawIssueMatchInfo(String preCommitId) {
        String preRawIssueUuid = RawIssueMatchInfo.EMPTY;
        preCommitId = preCommitId == null ? RawIssueMatchInfo.EMPTY : preCommitId;
        if (mapped) {
            preRawIssueUuid = mappedRawIssue.getUuid();
        }

        return RawIssueMatchInfo.builder()
                .curRawIssueUuid(uuid)
                .curCommitId(commitId)
                .preRawIssueUuid(preRawIssueUuid)
                .preCommitId(preCommitId)
                .status(status)
                .issueUuid(issueId)
                .matchDegree(matchDegree)
                .repoUuid(repoUuid)
                .build();
    }

    @Override
    public String toString() {
        return "{uuid=" + uuid + ",type=" + type + ",tool=" + tool + ",detail=" + detail + "}";
    }

    @Override
    public int hashCode() {
        int result = 17;
        result = 31 * result + uuid.hashCode();
        result = 31 * result + type.hashCode();
        result = 31 * result + detail.hashCode();
        result = 31 * result + scanId.hashCode();
        result = 31 * result + commitId.hashCode();
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if (!(obj instanceof RawIssue)) {
            return false;
        }

        return this.getUuid().equals(((RawIssue) obj).getUuid());
    }

    @Data
    @AllArgsConstructor
    static class LatestUuid {
        String uuid;
        int duplicateNum;
    }

    public static void cleanUpRawIssueUuidCacheAfterOneCommitScan() {
        generateUuidCaches.get().clear();
    }

}
