package cn.edu.fudan.issueservice.core.solved;

import cn.edu.fudan.common.jgit.DiffFile;
import cn.edu.fudan.common.jgit.JGitHelper;
import cn.edu.fudan.common.util.pojo.TwoValue;
import cn.edu.fudan.issueservice.component.SonarRest;
import cn.edu.fudan.issueservice.dao.RawIssueDao;
import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.issueservice.domain.enums.RawIssueStatus;
import cn.edu.fudan.issueservice.domain.enums.SolveWayEnum;
import cn.edu.fudan.issueservice.mapper.RawIssueMatchInfoMapper;
import cn.edu.fudan.issueservice.util.JavaAstParserUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * description: 判断缺陷修复的类型
 *
 * @author fancying create: 2021/10/25
 */
@Slf4j
@Component
public class IssueSolved {

    private static final boolean IS_WINDOWS =
            System.getProperty("os.name").toLowerCase().contains("win");

    private static RawIssueMatchInfoMapper rawIssueMatchInfoMapper;
    private static RawIssueDao rawIssueDao;
    private static SonarRest rest;

    /**
     * eg: /c/A 以 / 结尾
     */
    @Value("${diff.file.dir.prefix}")
    public String fileDirPrefix;

    /**
     * @param repoPath         eg: E:\\Lab\\t-repo\\forTest
     * @param relativeFilePath eg: measure-service/JGitHelper.java
     * @return true path eh: E:\\Lab\\t-repo\\forTest\\measure-service\\JGitHelper.java
     */
    public static String convertToPath(String repoPath, String relativeFilePath) {
        return IS_WINDOWS
                ? repoPath + "\\" + relativeFilePath.replace("/", "\\")
                : repoPath + "/" + relativeFilePath;
    }

    public void updateSolvedWay(List<String> repoUuids) {

        for (String repoUuid : repoUuids) {
//           String repoPath = "E:\\repository\\t-repo\\cim";

            String repoPath = rest.getCodeServiceRepo(repoUuid);

            updateSolvedWay(repoUuid, repoPath, true);

//      rest.freeRepo(repoUuid, repoPath);
            log.info("update repo {} done", repoUuid);
        }

        log.info("all done");
    }

    /**
     * @param needNotNullSolveWay true 需要 SolveWay 不为 null 的情况  false 只需要SolveWay为null的情况
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateSolvedWay(String repoUuid, String repoPath, boolean needNotNullSolveWay) {
        List<RawIssueMatchInfo> rawIssueMatchInfos = needNotNullSolveWay ?
                rawIssueMatchInfoMapper.getMatchInfoByRepoUuidAndStatuses(repoUuid, Arrays.asList(RawIssueStatus.SOLVED.getType(), RawIssueStatus.MERGE_SOLVE.getType()))
                : rawIssueMatchInfoMapper.getMatchInfoByRepoUuidAndStatusesWithNullSolvedWay(repoUuid, Arrays.asList(RawIssueStatus.SOLVED.getType(), RawIssueStatus.MERGE_SOLVE.getType()));

        if (rawIssueMatchInfos == null || rawIssueMatchInfos.isEmpty()) {
            log.info("nothing to be update {}", repoUuid);
            return;
        }

        // 更新matchInfo表
        // 没完成一次 commit 就进行更新
        // 根据rawIssueUuid 以及 commit id 进行更新
        rawIssueMatchInfoMapper.batchUpdateSolveWay(
                judgeSolvedType(rawIssueMatchInfos, repoPath)
        );
        log.info("update repo {} done", repoUuid);

    }

    /**
     * @param rawIssueMatchInfos r
     * @param repoPath           绝对路径 不以 / 结尾 如 /home/A
     * @return TwoValue first rawIssueMatchInfoId second
     */
    public List<TwoValue<Integer, String>> judgeSolvedType(List<RawIssueMatchInfo> rawIssueMatchInfos, String repoPath) {

        List<TwoValue<Integer, String>> result = new ArrayList<>(rawIssueMatchInfos.size());

        log.info("start repo {}", repoPath);
        JGitHelper jGitHelper = JGitHelper.getInstance(repoPath);


        // 根据commit来区分
        // key TwoValue first preCommitId second curCommitId
        Map<TwoValue<String, String>, List<RawIssueMatchInfo>> rawIssueMatchInfoMap =
                rawIssueMatchInfos.parallelStream()
                        .collect(
                                Collectors.groupingBy(r -> new TwoValue<>(r.getPreCommitId(), r.getCurCommitId())));

        // 遍历每一次有过关闭缺陷的匹配
        for (Map.Entry<TwoValue<String, String>, List<RawIssueMatchInfo>> onePairCommits :
                rawIssueMatchInfoMap.entrySet()) {

            // key preRawIssueUuid  value  id
            Map<String, Integer> preRawIssueUuid2id = onePairCommits.getValue()
                    .stream().collect(Collectors
                            .toMap(RawIssueMatchInfo::getPreRawIssueUuid,
                                    RawIssueMatchInfo::getId));

            // 用于更新的map first RawIssueMatchInfoId two solve_way
            List<TwoValue<Integer, String>> updateSolveList = new ArrayList<>(onePairCommits.getValue().size());

            String preCommit = onePairCommits.getKey().getFirst();
            String cruCommit = onePairCommits.getKey().getSecond();

            // 1 准备文件资源
            DiffFile diffFile = jGitHelper.getDiffFilePair(preCommit, cruCommit);
            Map<String, String> changeFiles = diffFile.getChangeFiles();
            jGitHelper.checkout(preCommit);
            // kay relativeFilePath value absoluteFilePath
            Map<String, String> preAbsoluteFilePathCache = copyFilesToTargetDir(fileDirPrefix + preCommit, repoPath, new ArrayList<>(changeFiles.keySet()));

            jGitHelper.checkout(cruCommit);
            // kay relativeFilePath value absoluteFilePath
            Map<String, String> cruAbsoluteFilePathCache = copyFilesToTargetDir(fileDirPrefix + cruCommit, repoPath, new ArrayList<>(changeFiles.values()));

            // 2 拿到preFile 与 关闭的缺陷列表 的对应关系
            List<RawIssueMatchInfo> onePairOfRawIssueMatchInfo = onePairCommits.getValue();
            // key preRelativeFilePath
            // value  preClosedRawIssues in file
            Map<String, List<RawIssue>> preFile2RawIssue =
                    rawIssueDao
                            .getRawIssueWithLocationByUuids(
                                    onePairOfRawIssueMatchInfo.stream()
                                            .map(RawIssueMatchInfo::getPreRawIssueUuid)
                                            .collect(Collectors.toList())
                            ).parallelStream()
                            .collect(Collectors.groupingBy(RawIssue::getFileName));

            for (Map.Entry<String, List<RawIssue>> entry : preFile2RawIssue.entrySet()) {
                String preAbsoluteFilePath = preAbsoluteFilePathCache.getOrDefault(entry.getKey(), null);
                String cruAbsoluteFilePath = cruAbsoluteFilePathCache.getOrDefault(changeFiles.get(entry.getKey()), null);
                try {
                    // key rawIssueUuid value SolveWayEnum
                    for (Map.Entry<String, SolveWayEnum> e :
                            checkHowToSolved(preAbsoluteFilePath, cruAbsoluteFilePath, entry.getValue())
                                    .entrySet()) {
                        updateSolveList.add(new TwoValue<>(preRawIssueUuid2id.get(e.getKey()), e.getValue().lowercase));
                    }
                } catch (IOException e) {
                    log.error(e.getMessage());
                }
            }
            result.addAll(updateSolveList);
        }
        return result;
    }

    /**
     * @param fileDirPrefix     不以 / 结尾
     * @param repoPath          实际的路径 不以 / 结尾
     * @param relativeFilePaths 文件的相对路径
     * @return kay relativeFilePath value absoluteFilePath
     */
    private Map<String, String> copyFilesToTargetDir(String fileDirPrefix, String repoPath, List<String> relativeFilePaths) {
        Map<String, String> result = new LinkedHashMap<>(relativeFilePaths.size(), 1);
        for (String relativePath : relativeFilePaths) {
            String targetDirAbsoluteFilePath = convertToPath(fileDirPrefix, relativePath);
            result.put(relativePath, targetDirAbsoluteFilePath);
            // 创建文件
            File emptyFile = new File(targetDirAbsoluteFilePath);
            File parentFile = emptyFile.getParentFile();


            try {
                if (!emptyFile.exists()) {
                    if (!parentFile.exists()) {
                        parentFile.mkdirs();
                    }
                    FileUtils.copyFileToDirectory(new File(convertToPath(repoPath, relativePath)), parentFile);
                }

            } catch (IOException e) {
                log.error("file copy fail {}", relativePath);
            }
        }
        return result;
    }

    /**
     * @param preAbsoluteFilePath 前一个版本文件A的绝对路径
     * @param curAbsoluteFilePath 后一个版本文件A的绝对路径,如果文件A不存在：为null 或者为空 那么这些缺陷都为 SolveWayEnum.FILE_DELETE
     * @param preClosedRawIssues  文件A的上一个版本的文件A1中存在的缺陷，但在A中不存在的缺陷
     * @return key rawIssueUuid value SolveWayEnum
     */
    public Map<String, SolveWayEnum> checkHowToSolved(
            String preAbsoluteFilePath, String curAbsoluteFilePath, List<RawIssue> preClosedRawIssues)
            throws IOException {
        Map<String, SolveWayEnum> solveWayEnumMap = new HashMap<>(preClosedRawIssues.size() << 2);
        if (StringUtils.isEmpty(curAbsoluteFilePath)) {
            return preClosedRawIssues.stream()
                    .collect(Collectors.toMap(RawIssue::getUuid, solvedWay -> SolveWayEnum.FILE_DELETE, (k1, k2) -> k2));
        }

        // 解析文件获取所有的 anchorNode 名字 包括 类名，方法签名，属性名
        List<String> anchorNodeIdentifier = JavaAstParserUtil.getAllMethodsInFile(curAbsoluteFilePath);
        anchorNodeIdentifier.addAll(JavaAstParserUtil.getAllFieldsInFile(curAbsoluteFilePath));
        anchorNodeIdentifier.addAll(JavaAstParserUtil.getAllClassNamesInFile(curAbsoluteFilePath));

        // 识别 diff 内容
        DiffLines diffLines = DiffLines.analyzeDiffLines(preAbsoluteFilePath, curAbsoluteFilePath);
        List<Integer> deleteLineList = diffLines.getDeleteLines();
        List<Integer> preChangeLineList = diffLines.getPreChangeLines();

        for (RawIssue preRawIssue : preClosedRawIssues) {
            List<Location> locations = preRawIssue.getLocations();
            int delAnchorTotal = 0;
            int delLocationTotal = 0;
            boolean lineChanged = false;

            for (Location location : locations) {
                // anchor node delete
                if (!anchorNodeIdentifier.contains(location.getAnchorName())) {
                    delAnchorTotal++;
                    continue;
                }
                // anchor node exist  but code delete
                int startLine = location.getStartLine();
                int endLine = location.getEndLine();
                int deleteLines = 0;

                for (int cursor = startLine; cursor <= endLine; cursor++) {
                    deleteLines += deleteLineList.contains(cursor) ? 1 : 0;

                    lineChanged = lineChanged || preChangeLineList.contains(cursor);
                }

                if (deleteLines * 2 > endLine - startLine + 1) {
                    delLocationTotal++;
                }
            }

            if (delAnchorTotal * 2 > locations.size()) {
                solveWayEnumMap.put(preRawIssue.getUuid(), SolveWayEnum.ANCHOR_DELETE);
                continue;
            }

            if (delLocationTotal >= locations.size()) {
                solveWayEnumMap.put(preRawIssue.getUuid(), SolveWayEnum.CODE_DELETE);
                continue;
            }

            // todo 数据流和控制流分析 后确定   SolveWayEnum.CODE_RELATED_CHANGE
            solveWayEnumMap.put(
                    preRawIssue.getUuid(),
                    lineChanged ? SolveWayEnum.CODE_CHANGE : SolveWayEnum.CODE_UNRELATED_CHANGE);
        }

        return solveWayEnumMap;
    }

    @Autowired
    public void setRawIssueMatchInfoMapper(RawIssueMatchInfoMapper rawIssueMatchInfoMapper) {
        IssueSolved.rawIssueMatchInfoMapper = rawIssueMatchInfoMapper;
    }

    @Autowired
    public void setRawIssueMapper(RawIssueDao rawIssueDao) {
        IssueSolved.rawIssueDao = rawIssueDao;
    }

    @Autowired
    public void setRest(SonarRest rest) {
        IssueSolved.rest = rest;
    }
}
