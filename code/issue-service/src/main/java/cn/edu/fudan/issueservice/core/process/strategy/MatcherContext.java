package cn.edu.fudan.issueservice.core.process.strategy;

import cn.edu.fudan.issueservice.domain.dbo.IssueType;
import cn.edu.fudan.issueservice.domain.dbo.Location;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;

import java.util.Set;

/**
 *
 * @author Jerry Zhang
 * create: 2022-12-05 11:15
 */
public class MatcherContext {
    private final MatcherStrategy matcherStrategy;

    public MatcherContext(MatcherStrategy matcherStrategy) {
        this.matcherStrategy = matcherStrategy;
    }

    public boolean match(RawIssue preVioInstance, RawIssue curVioInstance, Set<String> curParentName) {
        return matcherStrategy.match(preVioInstance, curVioInstance, curParentName);
    }


    public void matchTwoLocation(Location location1, Location location2, Set<String> curParentName) {
       matcherStrategy.matchTwoLocation(location1, location2, curParentName);
    }

    public static MatcherContext getInstance(IssueType type) {
        if (type==null){
            return new MatcherContext(new BlockVioInstanceMatcher());
        }
        switch (type.getScope()) {
            case "FILE":
                return new MatcherContext(new FileVioInstanceMatcher());
            case "METHOD":
                return new MatcherContext(new MethodVioInstanceMatcher());
            default:
                return new MatcherContext(new BlockVioInstanceMatcher());
        }
    }
}
