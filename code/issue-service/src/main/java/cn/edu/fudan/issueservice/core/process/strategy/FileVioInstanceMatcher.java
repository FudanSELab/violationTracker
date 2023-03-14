package cn.edu.fudan.issueservice.core.process.strategy;

import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.util.CosineUtil;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Set;

/**
 *
 * @author Jerry Zhang
 * create: 2022-12-05 11:12
 */
@Slf4j
public class FileVioInstanceMatcher extends BaseVioInstanceMatcher {
    public FileVioInstanceMatcher() {
        super(1, 0, 0.4, 0.5);
    }

    @Override
    public boolean match(RawIssue preVioInstance, RawIssue curVioInstance, Set<String> curParentName) {
        log.debug("match scope is FILE, issue type is {}", preVioInstance.getType());
        // If the class names are similar, the two raw issues are similar
        double matchDegree;
        List<Location> preLocations = preVioInstance.getLocations();
        List<Location> curLocations = curVioInstance.getLocations();
        // The number of locations must not be 0
        Location preLocation = preLocations.get(0);
        Location curLocation = curLocations.get(0);
        String preClassName = preLocation.getClassName();
        String curClassName = curLocation.getClassName();

        // two issue match one
        double detailScore = preVioInstance.getDetail().equals(curVioInstance.getDetail()) ? 0.1 : 0;
        double tokenSimilarityDegree = CosineUtil.cosineSimilarity(CosineUtil.lexer(preClassName, true),
                CosineUtil.lexer(curClassName, true));

        if (tokenSimilarityDegree > similarityLowerLimit) {
            matchDegree = calculateMatchDegree(preLocation, curLocation, tokenSimilarityDegree, curParentName);
            if (matchDegreeLimit.equals(matchDegree)) {
                return false;
            }
            preVioInstance.addRawIssueMappedResult(curVioInstance, matchDegree + detailScore);
            curVioInstance.addRawIssueMappedResult(preVioInstance, matchDegree + detailScore);
            return true;
        }
        return false;
    }
}
