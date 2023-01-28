package cn.edu.fudan.issueservice.core.process.strategy;

/**
 * @author Jerry Zhang
 * create: 2022-12-05 11:18
 */
public class BlockVioInstanceMatcher extends BaseVioInstanceMatcher {
    public BlockVioInstanceMatcher() {
        super(0.85, 0.65, 0.4, 0.5);
    }
}
