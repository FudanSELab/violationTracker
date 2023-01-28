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
     * raw issue 匹配上之后 如果不是在同一个方法中 还需要考虑 是否存在含有相同名字的方法
     * <p>
     */
    boolean match(RawIssue preVioInstance, RawIssue curVioInstance, Set<String> curParentName);


    void matchTwoLocation(Location location1, Location location2, Set<String> curParentName);
}
