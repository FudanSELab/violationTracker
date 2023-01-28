package cn.edu.fudan.issueservice.core.process.strategy;

import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.domain.dto.LocationMatchResult;
import cn.edu.fudan.issueservice.util.CosineUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * @author Jerry Zhang
 * create: 2022-12-05 15:53
 */
@Slf4j
public abstract class BaseVioInstanceMatcher implements MatcherStrategy {
    protected final double similarityLowerLimit;
    protected final double similarityLocationLimit;
    protected final Double matchDegreeLimit;
    protected final Double moderateMatchDegree;

    BaseVioInstanceMatcher(double similarityLowerLimit, double similarityLocationLimit, double matchDegreeLimit, double moderateMatchDegree) {
        this.similarityLowerLimit = similarityLowerLimit;
        this.similarityLocationLimit = similarityLocationLimit;
        this.matchDegreeLimit = matchDegreeLimit;
        this.moderateMatchDegree = moderateMatchDegree;
    }

    @Override
    public boolean match(RawIssue preVioInstance, RawIssue curVioInstance, Set<String> curParentName) {
        log.debug("default scope, issue type is {}", preVioInstance.getType());
        double matchDegree = 0.0;
        List<Location> preLocations = preVioInstance.getLocations();
        List<Location> curLocations = curVioInstance.getLocations();

        int max = Math.max(preLocations.size(), curLocations.size());
        int min = Math.min(preLocations.size(), curLocations.size());
        // locations 的个数不一样 快速判断是不是同一个 raw issue  先设置一半
        // location 的个数必不为0
        if (max >= min + min) {
            return false;
        }

        // 区别测试用例 two issue match one
        double detailScore = preVioInstance.getDetail().equals(curVioInstance.getDetail()) ? 0.1 : 0;

        // 单个location的匹配情况  只有在一个location的情况下 考虑方法重载的情况
        // TODO: 2021/1/5 单个location不在同一个方法内不能匹配上 除非方法是changeSignature （这里应该与追溯方法的匹配阈值一致）
        //  在前面有编译失败的情况下 有两个相似度高的方法情况下可能会匹配不准确
        if (max == 1) {
            Location preLocation = preLocations.get(0);
            Location curLocation = curLocations.get(0);
            String code1 = preLocation.getCode();
            String code2 = curLocation.getCode();

            boolean isSame = (StringUtils.isEmpty(code1) && StringUtils.isEmpty(code2)) || preLocation.isSame(curLocation);
            if (isSame) {
                matchDegree = calculateMatchDegree(preLocation, curLocation, 1.00, curParentName);
                if (matchDegreeLimit.equals(matchDegree)) {
                    return false;
                }
                preVioInstance.addRawIssueMappedResult(curVioInstance, matchDegree + detailScore);
                curVioInstance.addRawIssueMappedResult(preVioInstance, matchDegree + detailScore);
                return true;
            }

            double tokenSimilarityDegree = CosineUtil.cosineSimilarity(preLocation.getTokens(), curLocation.getTokens());
            if (tokenSimilarityDegree > similarityLowerLimit) {
                matchDegree = calculateMatchDegree(preLocation, curLocation, tokenSimilarityDegree, curParentName);
                if (matchDegreeLimit.equals(matchDegree)) {
                    return false;
                }
                preVioInstance.addRawIssueMappedResult(curVioInstance, matchDegree + detailScore);
                curVioInstance.addRawIssueMappedResult(preVioInstance, matchDegree + detailScore);
                preLocation.setMappedLocation(curLocation, matchDegree);
                curLocation.setMappedLocation(preLocation, matchDegree);
                return true;
            }
            return false;
        }

        preLocations.forEach(l1 -> curLocations.forEach(l2 -> matchTwoLocation(l1, l2, curParentName)));

        //  匹配完成后计算 匹配到的location个数
        Set<Location> mappedLocations = new HashSet<>(8);

        int mappedNum = 0;
        double score;
        for (Location location : preLocations) {
            if (location.isMatched()) {
                mappedNum++;
            }
            score = 0.0;
            for (LocationMatchResult r : location.getLocationMatchResults()) {
                mappedLocations.add(r.getLocation());
                score = score < r.getMatchingDegree() ? r.getMatchingDegree() : score;
            }
            matchDegree += score;
        }

        // 必须 75% 的location相同才认为是同一个raw issue
        min = Math.min(mappedNum, mappedLocations.size());
        double overlap = (double) min / max;
        if (overlap >= similarityLocationLimit) {
            matchDegree = matchDegree / mappedNum;
            preVioInstance.addRawIssueMappedResult(curVioInstance, matchDegree + detailScore);
            curVioInstance.addRawIssueMappedResult(preVioInstance, matchDegree + detailScore);
            return true;
        }

        return false;
    }

    protected double calculateMatchDegree(Location location1, Location location2, double tokenSimilarity, Set<String> curParentName) {
        String methodName1 = location1.getAnchorName();
        String methodName2 = location2.getAnchorName();
        boolean method1Empty = StringUtils.isEmpty(methodName1);

        int minOffset = Math.min(location1.getOffset(), location2.getOffset());
        int maxOffset = Math.max(location1.getOffset(), location2.getOffset());
        double result = 0.7 * tokenSimilarity + (maxOffset == 0 ? 0 : 0.1 * minOffset / maxOffset);
        if (!method1Empty && methodName1.equals(methodName2)) {
            result = 0.2 + result;
        } else if (!method1Empty) {
            // 给予一个较小的值 方法名不相同的情况下 边界值是 0.7 + 0.1 = 0.8
            // fixme 方法名不同的情况下是否能匹配上 待定
            if (curParentName == null) {
                result = moderateMatchDegree;
            } else if (curParentName.contains(methodName1)) {
                result = matchDegreeLimit;
            }
        }

        return result;
    }

    @Override
    public void matchTwoLocation(Location location1, Location location2, Set<String> curParentName) {
        double tokenSimilarityDegree = 0;
        String code1 = location1.getCode();
        String code2 = location2.getCode();

        boolean isCode1Empty = StringUtils.isEmpty(code1);
        boolean isCode2Empty = StringUtils.isEmpty(code2);

        if (!isCode1Empty && !isCode2Empty) {
            tokenSimilarityDegree = code1.equals(code2) ? 1 : CosineUtil.cosineSimilarity(location1.getTokens(), location2.getTokens());
        } else if (isCode1Empty && isCode2Empty) {
            tokenSimilarityDegree = 1;
        }

        if (tokenSimilarityDegree >= similarityLowerLimit) {
            double matchDegree = calculateMatchDegree(location1, location2, tokenSimilarityDegree, curParentName);
            location1.setMappedLocation(location2, matchDegree);
            location2.setMappedLocation(location1, matchDegree);
        }
    }
}
