package cn.edu.fudan.issueservice.domain.dbo;

import cn.edu.fudan.issueservice.domain.dto.RawIssueMatchResult;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

/**
 * fixme 修改RawIssue中不符合规范的field命名
 * scan_id detail 多余 重复 ？
 *
 * @author fancying
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RawIssue {

    private int id;
    /**
     * key:上一次本线程中产生的uuid value:第几个相似的
     * 由于更改了uuid生成的规则，导致同一location uuid的rawIssue可能不是同一时刻出现
     */
    private static ThreadLocal<HashMap<String, Integer>> generateUuidCaches = ThreadLocal.withInitial(HashMap::new);
    /**
     * 表示 status 是 default情况  在任何一个匹配中该rawIssue没有改变的情况
     * true: not change  false: change
     **/
    boolean notChange = false;
    /**
     * 多分支匹配的情况下记录是否有分支匹配上过
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
    /**
     * 开发者聚合后的唯一姓名
     */
    private String developerName;
    private String rawIssueHash;
    /**
     * 下面为 raw issue 的 匹配信息
     */
    private String status = RawIssueStatus.ADD.getType();
    private String issueId;
    private List<RawIssueMatchResult> rawIssueMatchResults = new ArrayList<>(0);
    private int matchResultDTOIndex = -1;
    /**
     * 根据 mapped 来决定最后是否映射上一个issue
     **/
    private boolean mapped = false;
    /**
     * 最后真正匹配上的RawIssue
     */
    private RawIssue mappedRawIssue = null;
    private double matchDegree;
    private List<RawIssueMatchInfo> matchInfos = new ArrayList<>(8);

    /**
     * location uuid + commitId
     * rawIssue uuid 用于生成第一个issue uuid
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
     * 用于区分rawIssue C++没有偏移量，所以信息应该就可能全
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
        rawIssueMatchResults = new ArrayList<>(0);
        matchResultDTOIndex = -1;
        mappedRawIssue = null;
        matchDegree = 0.0;
    }

    public void addRawIssueMappedResult(RawIssue rawIssue, double matchDegree) {
        mapped = true;
        rawIssueMatchResults.add(RawIssueMatchResult.newInstance(rawIssue, matchDegree));
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

    /**
     * 因为在bugMapping中被作为key，故不可以随意删除,且不可加入mapped
     */
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

    /**
     * 因为在bugMapping中被作为key，故不可以随意删除，且不可加入mapped
     */
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
