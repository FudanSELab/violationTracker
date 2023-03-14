package cn.edu.fudan.issueservice.core.process.strategy;

import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;

import java.util.Set;

/**
 *
 * @author Jerry Zhang
 * create: 2022-12-05 11:09
 */
public interface MatcherStrategy {
    /**
     * After two raw issues are matched
     * If they are not in the same method, we also need to consider whether there are two methods with the same name
     * <p>
     */
    boolean match(RawIssue preVioInstance, RawIssue curVioInstance, Set<String> curParentName);


    void matchTwoLocation(Location location1, Location location2, Set<String> curParentName);
}
