package cn.edu.fudan.issueservice.core.matcher;

import cn.edu.fudan.issueservice.domain.dbo.Issue;
import cn.edu.fudan.issueservice.domain.dbo.IssueType;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.issueservice.domain.dto.MatcherData;
import cn.edu.fudan.issueservice.domain.dto.MatcherResult;
import cn.edu.fudan.issueservice.domain.enums.*;
import cn.edu.fudan.issueservice.util.DateTimeUtil;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @author beethoven
 * @author joshua
 * @date 2021-09-22 14:10:57
 */
@Slf4j
public class MergeMatcher extends BaseMatcher {

    private final Map<String, Map<String, RawIssue>> issueUuid2PreRawIssues = new HashMap<>();
    private final Map<String, Issue> issueUuid2SolvedIssue = new HashMap<>();
    private final Map<String, Issue> issueUuid2MappedIssue = new HashMap<>();
    private final Map<String, Issue> issueUuid2ReopenIssue = new HashMap<>();
    private final Map<String, RawIssue> preRawIssueMap = new HashMap<>();
    private final List<RawIssue> doubleAddCurRawIssue = new ArrayList<>();

    public MergeMatcher(MatcherData data) {
        this.tool = data.getTool();
        this.repoUuid = data.getRepoUuid();
        this.currentCommit = data.getCurrentCommit();
        this.analyzer = data.getAnalyzer();
        this.jGitHelper = data.getJGitHelper();
        this.currentRawIssues = data.getCurrentRawIssues();
        this.commitFileMap = data.getCommitFileMap();
        this.parentRawIssuesMap = data.getParentRawIssuesMap();
        this.preFile2CurFileMap = data.getPreFile2CurFileMap();
        this.curFile2PreFileMap = data.getCurFile2PreFileMap();
        this.matcherResult = new MatcherResult(data.getCurrentCommit());
    }

    @Override
    public void sumUpRawIssues(String parentCommit, List<RawIssue> preRawIssues, List<RawIssue> curRawIssues, Map<String, Issue> oldIssuesMap) {
        for (RawIssue preRawIssue : preRawIssues) {
            preRawIssueMap.put(preRawIssue.getUuid(), preRawIssue);
            String issueUuid = preRawIssue.getIssueId();
            // pre raw issue ????????????, ???????????????, ????????? parent ??????????????? sum up all
            if (!preRawIssue.isMapped()) {
                Map<String, RawIssue> rawIssues = issueUuid2PreRawIssues.getOrDefault(issueUuid, new HashMap<>(8));
                rawIssues.put(parentCommit, preRawIssue);
                issueUuid2PreRawIssues.put(issueUuid, rawIssues);
                issueUuid2SolvedIssue.put(issueUuid, oldIssuesMap.get(issueUuid));
            } else {
                issueUuid2MappedIssue.put(issueUuid, oldIssuesMap.get(issueUuid));
            }
        }
    }

    @Override
    protected void cleanUpRawIssueMatchInfo(List<RawIssue> curRawIssues, List<RawIssue> preRawIssues, String preCommit, boolean isFirst) {
        // ?????? current raw issues ???????????????
        curRawIssues.stream().filter(RawIssue::isMapped).forEach(curRawIssue -> curRawIssue.setOnceMapped(true));
        curRawIssues.stream().filter(RawIssue::isMapped).forEach(RawIssue::resetMappedInfo);

        //todo
        // pre raw issues ????????????, ???????????? raw issue match info
        for (RawIssue preRawIssue : preRawIssues) {
            if (!preRawIssue.isMapped()) {
                List<RawIssueMatchInfo> rawIssueMatchInfos = preRawIssue.getMatchInfos();
                RawIssueMatchInfo matchInfo = RawIssueMatchInfo.builder()
                        .curRawIssueUuid(RawIssueMatchInfo.EMPTY)
                        .curCommitId(currentCommit)
                        .preCommitId(preCommit)
                        .preRawIssueUuid(preRawIssue.getUuid())
                        .status(RawIssueStatus.ADD.getType())
                        .repoUuid(repoUuid)
                        .issueUuid(preRawIssue.getIssueId())
                        .build();
                rawIssueMatchInfos.add(matchInfo);
            }
        }
    }

    /**
     * ?????? merge ??????????????? match info ??????
     * ??????????????? https://fancying.yuque.com/fdnozp/manual/xsi1mx
     */
    @Override
    protected void sumUpAll() {
        // ?????? issue ????????? commit ?????????, ????????? merge ??????
        for (RawIssue currentRawIssue : currentRawIssues) {
            switch (MatchInfoSituationEnum.getInstance(currentRawIssue)) {
                case ADD_CHANGED:
                    handleMatchInfoAddAndChanged(currentRawIssue);
                    break;
                case CHANGED_CHANGED:
                    handleMatchInfoDoubleChanged(currentRawIssue);
                    break;
                case ADD_ADD:
                    doubleAddCurRawIssue.add(currentRawIssue);
                    break;
                case ADD_DEFAULT:
                    handleMatchInfoAddAndDefault(currentRawIssue);
                    break;
                default:
            }
        }

        handleMatchInfoDoubleAdd(doubleAddCurRawIssue);

        // ?????? issue ????????? commit ????????????, ????????? merge ??????
        handleDifferentSituationSolvedMatchInfo();

        // ?????? issue ?????????, ????????? match info result
        updateIssueStatus();

        // ???????????????????????? raw issue
        updateDefaultRawIssues();

        log.info("commit {} sum up finish", currentCommit);
    }

    private void handleMatchInfoAddAndDefault(RawIssue currentRawIssue) {
        //????????????parent?????????????????????
        List<RawIssueMatchInfo> matchInfos = currentRawIssue.getMatchInfos();
        String issueUuid = null;
        for (RawIssueMatchInfo matchInfo : matchInfos) {
            if(matchInfo.getStatus().equals(RawIssueStatus.ADD.getType())){
                String parentCommit = null;
                for (String s : parentRawIssuesMap.keySet()) {
                    if(!s.equals(matchInfo.getPreCommitId())){
                        parentCommit = s;
                        break;
                    }
                }
                List<String> preCommitsForParent = jGitHelper.getAllCommitParents(parentCommit);
                issueUuid = rawIssueDao.getIssueUuidByRawIssueHashAndParentCommits(repoUuid, currentRawIssue.getRawIssueHash(), preCommitsForParent);
                if(issueUuid == null){
                    return;
                }
                currentRawIssue.setIssueId(issueUuid);
                currentRawIssue.setOnceMapped(true);
                issueUuid2MappedIssue.put(issueUuid, issueDao.getIssuesByUuid(List.of(issueUuid)).get(0));
            }
        }
        test(issueUuid, matchInfos);
    }

    private void test(String issueUuid, List<RawIssueMatchInfo> matchInfos){
        for (RawIssueMatchInfo matchInfo : matchInfos) {
            if (matchInfo.getStatus().equals(RawIssueStatus.ADD.getType())) {
                String addParentCommit = matchInfo.getPreCommitId();
                if(issueUuid != null && rawIssueMatchInfoDao.checkParentCommitHasIssue(issueUuid, jGitHelper.getAllCommitParents(addParentCommit), repoUuid)){
                    //??????4
                    matchInfo.setStatus(RawIssueStatus.MERGE_REOPEN.getType());
                    matchInfo.setPreRawIssueUuid(rawIssueDao.getLastVersionRawIssues(jGitHelper.getAllCommitParents(addParentCommit),List.of(issueUuid)).get(0).getUuid());
                    issueUuid2ReopenIssue.put(issueUuid, issueDao.getIssuesByUuid(List.of(issueUuid)).get(0));
                } else {
                    //??????8
                    matchInfo.setStatus(RawIssueStatus.MERGE_NEW.getType());
                }
                matchInfo.setIssueUuid(issueUuid);
            }
        }
    }



    private void updateDefaultRawIssues() {
        for (RawIssue currentRawIssue : currentRawIssues) {
            List<RawIssueMatchInfo> matchInfos = currentRawIssue.getMatchInfos();
            for (RawIssueMatchInfo matchInfo : matchInfos) {
                RawIssue preRawIssue = preRawIssueMap.get(matchInfo.getPreRawIssueUuid());
                if (preRawIssue != null && RawIssue.isSameLocation(currentRawIssue, preRawIssue)) {
                    matchInfo.setStatus(RawIssueStatus.DEFAULT.getType());
                }
            }
        }
    }

    private void handleMatchInfoAddAndChanged(RawIssue currentRawIssue) {
        //???????????????????????? ???????????????4???8
        List<RawIssueMatchInfo> matchInfos = currentRawIssue.getMatchInfos();
        String issueUuid = null;
        for (RawIssueMatchInfo matchInfo : matchInfos) {
            if(matchInfo.getStatus().equals(RawIssueStatus.CHANGED.getType())){
                issueUuid = matchInfo.getIssueUuid();
            }
        }
        for (RawIssueMatchInfo matchInfo : matchInfos) {
            if (matchInfo.getStatus().equals(RawIssueStatus.ADD.getType())) {
                String addParentCommit = matchInfo.getPreCommitId();
                if(issueUuid != null && rawIssueMatchInfoDao.checkParentCommitHasIssue(issueUuid, jGitHelper.getAllCommitParents(addParentCommit), repoUuid)){
                    //??????4
                    matchInfo.setStatus(RawIssueStatus.MERGE_REOPEN.getType());
                    matchInfo.setPreRawIssueUuid(rawIssueDao.getLastVersionRawIssues(jGitHelper.getAllCommitParents(addParentCommit),List.of(issueUuid)).get(0).getUuid());
                } else {
                    //??????8
                    matchInfo.setStatus(RawIssueStatus.MERGE_NEW.getType());
                }
                matchInfo.setIssueUuid(issueUuid);
            }
        }
    }

    private void handleMatchInfoDoubleChanged(RawIssue currentRawIssue) {
        List<RawIssueMatchInfo> matchInfos = currentRawIssue.getMatchInfos();
        RawIssueMatchInfo rawIssueMatchInfo1 = matchInfos.get(0);
        RawIssueMatchInfo rawIssueMatchInfo2 = matchInfos.get(1);
        String issueUuid1 = rawIssueMatchInfo1.getIssueUuid();
        String issueUuid2 = rawIssueMatchInfo2.getIssueUuid();
        if(!issueUuid1.equals(issueUuid2)){
            if(rawIssueMatchInfo1.getMatchDegree() > rawIssueMatchInfo2.getMatchDegree()){
                updateMatchInfosStatus(rawIssueMatchInfo2);
            }else if(rawIssueMatchInfo1.getMatchDegree() < rawIssueMatchInfo2.getMatchDegree()){
                updateMatchInfosStatus(rawIssueMatchInfo1);
            }else {
                //?????????????????????????????????????????????
                if(issueDao.getIssuesByUuid(List.of(issueUuid1)).get(0).getStartCommitDate()
                        .compareTo(issueDao.getIssuesByUuid(List.of(issueUuid2)).get(0).getStartCommitDate()) < 0){
                    updateMatchInfosStatus(rawIssueMatchInfo2);
                }else {
                    updateMatchInfosStatus(rawIssueMatchInfo1);
                }
            }
        }
    }

    private void updateMatchInfosStatus(RawIssueMatchInfo rawIssueMatchInfo){
        rawIssueMatchInfo.setStatus(RawIssueStatus.MERGE_CHANGED.getType());
        issueUuid2SolvedIssue.put(rawIssueMatchInfo.getIssueUuid(), issueDao.getIssuesByUuidAndRepoUuid(List.of(rawIssueMatchInfo.getIssueUuid()),repoUuid).get(0));
        Issue issue = issueUuid2MappedIssue.get(rawIssueMatchInfo.getIssueUuid());
        issue.setStatus("Merged");
        issueUuid2MappedIssue.put(rawIssueMatchInfo.getIssueUuid(),issue);
    }

    private void handleMatchInfoDoubleAdd(List<RawIssue> currentRawIssues) {
        if(currentRawIssues.isEmpty()){
            return;
        }
        Set<RawIssue> preRawIssuesSet = new HashSet<>();
        List<String> parentCommits = new ArrayList<>(parentRawIssuesMap.keySet());
        currentRawIssues.forEach(rawIssue -> rawIssue.getMatchInfos().clear());
        for (String parentCommit : parentCommits) {
            List<String> preCommitsForParent = jGitHelper.getAllCommitParents(parentCommit);
            preCommitsForParent.remove(parentCommit);
            List<RawIssue> preRawIssueList = matchNewIssuesWithParentIssues(currentRawIssues.stream().
                    filter(rawIssue -> !rawIssue.isOnceMapped()).collect(Collectors.toList()), curFile2PreFileMap.get(parentCommit),
                    preCommitsForParent, repoUuid, analyzer, jGitHelper.getRepoPath());
            preRawIssuesSet.addAll(preRawIssueList);
            // ??? current raw issues ?????? raw issue match info,???????????????????????????????????????ADD
            currentRawIssues.stream().filter(rawIssue -> !rawIssue.isMapped())
                    .forEach(curRawIssue -> curRawIssue.getMatchInfos().add(curRawIssue.generateRawIssueMatchInfo(parentCommit)));
            // ?????? current raw issues ???????????????
            currentRawIssues.stream().filter(RawIssue::isMapped).forEach(curRawIssue -> curRawIssue.setOnceMapped(true));
            currentRawIssues.stream().filter(RawIssue::isMapped).forEach(RawIssue::resetMappedInfo);
            List<RawIssue> parentRawIssues = parentRawIssuesMap.getOrDefault(parentCommit, new ArrayList<>());
            parentRawIssues.addAll(preRawIssueList);
            parentRawIssuesMap.put(parentCommit,parentRawIssues);
        }
        Map<String, Issue> uuid2Issue = issueDao.getIssuesByUuidAndRepoUuid(preRawIssuesSet.stream().map(RawIssue::getIssueId)
                .distinct().collect(Collectors.toList()),repoUuid).stream().collect(Collectors.toMap(Issue::getUuid, Function.identity(),(v1,v2)-> v2));
        issueUuid2MappedIssue.putAll(uuid2Issue);
        issueUuid2ReopenIssue.putAll(uuid2Issue);
        //?????? 5
        for (RawIssue currentRawIssue : currentRawIssues) {
            if(currentRawIssue.isOnceMapped()){
                List<RawIssueMatchInfo> matchInfos = currentRawIssue.getMatchInfos();
                for (RawIssueMatchInfo matchInfo : matchInfos) {
                    if(matchInfo.getStatus().equals(RawIssueStatus.CHANGED.getType())){
                        matchInfos.get(0).setPreCommitId(parentCommits.get(0));
                        matchInfos.get(1).setPreCommitId(parentCommits.get(1));
                        matchInfos.forEach(info -> info.setIssueUuid(matchInfo.getIssueUuid()));
                        matchInfos.forEach(info -> info.setPreRawIssueUuid(matchInfo.getPreRawIssueUuid()));
                        matchInfos.forEach(info -> info.setStatus(RawIssueStatus.REOPEN.getType()));
                        break;
                    }
                }
            }
        }

    }

    private void handleDifferentSituationSolvedMatchInfo() {

        for (Map.Entry<String, Map<String, RawIssue>> entry : issueUuid2PreRawIssues.entrySet()) {
            Map<String, RawIssue> rawIssues = entry.getValue();
            if (rawIssues.size() == 1) {
                // ?????? 2 6 ??????????????????
                resetMatchInfoStatus(rawIssues, RawIssueStatus.MERGE_SOLVE.getType());
            } else {
                // ?????? 1
                resetMatchInfoStatus(rawIssues, RawIssueStatus.SOLVED.getType());
            }
        }
    }

    private void resetMatchInfoStatus(Map<String, RawIssue> rawIssues, String type) {
        for (Map.Entry<String, RawIssue> rawIssueEntry : rawIssues.entrySet()) {
            List<RawIssueMatchInfo> matchInfos = rawIssueEntry.getValue().getMatchInfos();
            for (RawIssueMatchInfo matchInfo : matchInfos) {
                matchInfo.setIssueUuid(rawIssueEntry.getValue().getIssueId());
                matchInfo.setStatus(type);
            }
        }
    }

    private void updateIssueStatus() {
        Map<String, Issue> newIssues = matcherResult.getNewIssues();
        Map<String, Issue> mappedIssues = matcherResult.getMappedIssues();
        Map<String, Issue> solvedIssue = matcherResult.getSolvedIssue();
        Map<String, Issue> reopenIssues = matcherResult.getReopenIssues();
        Date curCommitDate = DateTimeUtil.localToUtc(jGitHelper.getCommitTime(currentCommit));

        // ?????? new issues
        for (RawIssue currentRawIssue : currentRawIssues) {
            if (!currentRawIssue.isOnceMapped()) {
                Issue issue = generateOneIssue(currentRawIssue);
                newIssues.put(issue.getUuid(), issue);
            }
        }

        // ?????? mapped issues
        for (Issue issue : issueUuid2MappedIssue.values()) {
            //merged issue ??????????????????????????????solvedIssue??????????????? ???????????????????????????rawIssue??????
            if ("Merged".equals(issue.getStatus())){
                mappedIssues.put(issue.getUuid(), issue);
                continue;
            }
            issue.setStatus(IssueStatusEnum.OPEN.getName());
            issue.setEndCommit(currentCommit);
            issue.setEndCommitDate(curCommitDate);
            mappedIssues.put(issue.getUuid(), issue);
        }

        Set<String> solvedIssuesFromRepo = issueDao.getSolvedIssueUuidsByRepoUuid(repoUuid);
        Set<String> solvedMergeIssues = new HashSet<>();
        for (Map.Entry<String, List<RawIssue>> entry : parentRawIssuesMap.entrySet()) {
            for (RawIssue rawIssue : entry.getValue()) {
                rawIssue.getMatchInfos().stream().filter(rawIssueMatchInfo -> RawIssueStatus.MERGE_SOLVE.getType().equals(rawIssueMatchInfo.getStatus()))
                        .forEach(t -> solvedMergeIssues.add(rawIssue.getIssueId()));
            }
        }
        int ignoreMergeSolvedIssueNum = (int) solvedMergeIssues.stream().filter(solvedIssuesFromRepo::contains).count();
        matcherResult.setIgnoreSolvedMergeIssueNum(ignoreMergeSolvedIssueNum);

        // ?????? solved issues
        for (Issue issue : issueUuid2SolvedIssue.values()) {
            issue.setStatus(IssueStatusEnum.SOLVED.getName());
            solvedIssue.put(issue.getUuid(), issue);
        }

        //?????? reopen issues
        for (Issue issue : issueUuid2ReopenIssue.values()) {
            reopenIssues.put(issue.getUuid(), issue);
        }

        // ?????? match result ??? parent rawIssues
        matcherResult.setParentRawIssuesResult(parentRawIssuesMap);
    }

    @Override
    protected Issue generateOneIssue(RawIssue rawIssue) {
        Issue issue = Issue.valueOf(rawIssue);
        IssueType issueType = issueTypeMap.get(rawIssue.getType());
        issue.setIssueCategory(issueType == null ? IssuePriorityEnums.getIssueCategory(rawIssue.getTool(), rawIssue.getPriority()) : issueType.getCategory());
        rawIssue.setIssueId(issue.getUuid());
        rawIssue.getMatchInfos().forEach(rawIssueMatchInfo -> rawIssueMatchInfo.setIssueUuid(issue.getUuid()));
        return issue;
    }

}
