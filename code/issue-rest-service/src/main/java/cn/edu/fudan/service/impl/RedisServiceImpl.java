package cn.edu.fudan.service.impl;

import cn.edu.fudan.common.domain.po.scan.RepoScan;
import cn.edu.fudan.common.util.DateTimeUtil;
import cn.edu.fudan.dao.IssueRepoDao;
import cn.edu.fudan.service.IssueMeasureInfoService;
import cn.edu.fudan.service.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * @author PJH
 */
@Service
public class RedisServiceImpl implements RedisService {

    private final String since = DateTimeUtil.getIssueTendencyBeginDate(7);
    private final String until = DateTimeUtil.getLastSunday();
    private IssueMeasureInfoService issueMeasureInfoService;
    private RedisTemplate<Object, Object> redisTemplate;
    @Autowired
    private IssueRepoDao issueRepoDao;

    @Scheduled(cron = "0 0 1 * * ?")
    @Override
    public void refreshRedis() {
        Set<Object> keys = redisTemplate.keys("*living-issue-tendency*");
        if (keys != null) {
            keys.forEach(key -> redisTemplate.delete(key));
        }
        addRedisById("");
        List<RepoScan> repoScans = issueRepoDao.getAllRepos();
        for (RepoScan repo : repoScans) {
            addRedisById(repo.getRepoUuid());
        }
    }

    @Override
    public void addNewRedis(Object key, Object value) {
        Boolean hasKey = redisTemplate.hasKey(key);
        if (hasKey != null && hasKey) {
            redisTemplate.delete(key);
        }
        redisTemplate.opsForValue().set(key, value);
    }


    private void addRedisById(String projectIds) {
        String showDetail = "false";
        List<String> intervals = Arrays.asList("week", "day", "year", "month");
        for (String interval : intervals) {
            Object results = issueMeasureInfoService.getLivingIssueTendency(since, until, projectIds, interval, showDetail);
            String keyOfRedis = "living-issue-tendency?" + "since:" + since + "until:" + until + "projectIds:" + projectIds + "detail:" + showDetail;
            redisTemplate.opsForValue().set(keyOfRedis, results, 24, TimeUnit.HOURS);
        }
    }

    @Override
    public Object getValueFromRedis(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    @Autowired
    public void setRedisTemplate(RedisTemplate<Object, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Autowired
    public void setIssueMeasureInfoService(IssueMeasureInfoService issueMeasureInfoService) {
        this.issueMeasureInfoService = issueMeasureInfoService;
    }

}
