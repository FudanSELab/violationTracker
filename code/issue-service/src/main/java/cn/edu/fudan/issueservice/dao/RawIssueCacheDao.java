package cn.edu.fudan.issueservice.dao;

import cn.edu.fudan.issueservice.domain.dbo.RawIssueCache;
import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import cn.edu.fudan.issueservice.util.RawIssueParseUtil;
import com.alibaba.fastjson.JSONObject;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.bson.BsonSerializationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.CriteriaDefinition;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 *
 * Cache the parsed rawIssue
 *
 * @author beethoven
 * @author PJH
 */
@Repository
@Slf4j
public class RawIssueCacheDao {

    private static final String COLLECTION_NAME = "raw_issue_cache";
    private MongoTemplate mongoTemplate;

    @Autowired
    public void setMongoTemplate(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Transactional(rollbackFor = Exception.class)
    public void insertIssueAnalyzer(RawIssueCache rawIssueCache) {
        String repoUuid = rawIssueCache.getRepoUuid();
        String commitId = rawIssueCache.getCommitId();
        String tool = rawIssueCache.getTool();
        if (!cached(repoUuid, commitId, tool)) {
            // Since mongoDB has a limit of 16MB for a single document,
            // when the number of violations exceeds 1000, we need to split them
            log.info("start insert analyzer");
            if(insertIssueAnalyzerPartition(rawIssueCache, 1000, 0) != -1){
                log.info("repoUuid:{},commitId:{} issueAnalyzer insert success!", repoUuid, commitId);
            } else {
                log.error("repoUuid:{},commitId:{} issueAnalyzer insert failed!", repoUuid, commitId);
            }
        }
    }

    private int insertIssueAnalyzerPartition(RawIssueCache rawIssueCache, int partitionNum, int beginSharding){
        String repoUuid = rawIssueCache.getRepoUuid();
        String commitId = rawIssueCache.getCommitId();
        String tool = rawIssueCache.getTool();
        List<RawIssue> rawIssueList = rawIssueCache.getRawIssueList();
        if(partitionNum == 0){
            log.info("repoUuid:{},commitId:{},partitionNum:{},beginSharding:{} partitionNum is less than 0", repoUuid, commitId, partitionNum, beginSharding);
            return -1;
        }
        log.info("repoUuid:{},commitId:{},partitionNum:{},beginSharding:{} begin partition", repoUuid, commitId, partitionNum, beginSharding);
        int insertedNumInPartition = 0;
        if(rawIssueList.isEmpty()){
            rawIssueCache.setSharding(0);
            mongoTemplate.insert(rawIssueCache, COLLECTION_NAME);
            return 0;
        }
        List<List<RawIssue>> rawIssuesOfPartition = Lists.partition(rawIssueList, partitionNum);
        for (int i = 0; i < rawIssuesOfPartition.size(); i++) {
            final List<RawIssue> tempRawIssueList = rawIssuesOfPartition.get(i);
            RawIssueCache temp = RawIssueCache.init(repoUuid,commitId,tool);
            temp.setInvokeResult(RawIssueCache.InvokeResult.SUCCESS.getStatus());
            temp.setRawIssueNum(tempRawIssueList.size());
            temp.setAnalyzeResult(RawIssueParseUtil.rawIssues2JSON(tempRawIssueList));
            temp.setSharding(i + beginSharding + insertedNumInPartition);
            temp.setRawIssueList(tempRawIssueList);
            temp.setIsTotalScan(rawIssueCache.getIsTotalScan());
            try {
                mongoTemplate.insert(temp, COLLECTION_NAME);
            } catch (BsonSerializationException e){
                log.info("repoUuid:{},commitId:{},partitionNum:{},beginSharding:{} over 16MB, begin next partition", repoUuid, commitId, partitionNum, beginSharding);
                int insertNum = insertIssueAnalyzerPartition(temp, partitionNum/2, i + beginSharding);
                if(insertNum < 0){
                    // insert failed
                    return -1;
                }
                // -1 => Remove the original sharding
                insertedNumInPartition += (insertNum - 1);
            } catch (Exception e){
                log.error("insert issueAnalyzer failed" + e.getMessage());
                return -1;
            }
        }
        insertedNumInPartition += rawIssuesOfPartition.size();
        return insertedNumInPartition;
    }

    public JSONObject getAnalyzeResultByRepoUuidCommitIdTool(String repoUuid, String commitId, String tool) {
        Query query = Query.query(createCriteria(repoUuid, commitId, tool));
        List<RawIssueCache> rawIssueCaches = mongoTemplate.find(query, RawIssueCache.class, COLLECTION_NAME);
        if (!rawIssueCaches.isEmpty()) {
            List<RawIssue> rawIssueList = new ArrayList<>();
            rawIssueCaches.forEach(issueAnalyzer -> {
                if(issueAnalyzer.getInvokeResult() == 1){
                    rawIssueList.addAll(RawIssueParseUtil.json2RawIssues(issueAnalyzer.getAnalyzeResult()));
                }
            });
            return RawIssueParseUtil.rawIssues2JSON(rawIssueList);
        }
        return null;
    }

    public List<RawIssueCache> getAnalyzerListByRepoUuidCommitIdTool(String repoUuid, String commitId, String tool) {
        Query query = Query.query(createCriteria(repoUuid, commitId, tool));
        return mongoTemplate.find(query, RawIssueCache.class, COLLECTION_NAME);
    }

    public int getCacheCount(String repoUuid, String toolName){
        return (int) mongoTemplate.count(Query.query(createRepoCriteria(repoUuid, toolName)), RawIssueCache.class, COLLECTION_NAME);
    }
    @Transactional(rollbackFor = Exception.class)
    public boolean deleteRepo(String repoUuid, String toolName) {
        try {
            mongoTemplate.remove(Query.query(createRepoCriteria(repoUuid, toolName)), RawIssueCache.class, COLLECTION_NAME);
            return true;
        } catch (Exception e) {
            log.error("delete cache repo:{} tool:{} failed",repoUuid, toolName);
            return false;
        }
    }

    public boolean cached(String repoUuid, String commit, String toolName) {
//        return issueAnalyzerMapper.cached(repoUuid, commit, toolName) > 0;
        return mongoTemplate.count(Query.query(createCriteriaForCached(repoUuid, commit, toolName)), RawIssueCache.class, COLLECTION_NAME) > 0;
    }

    public Criteria createCriteriaForCached(String repoUuid, String commitId, String toolName) {
        return Criteria.where("repoUuid").is(repoUuid)
                .and("commitId").is(commitId)
                .and("tool").is(toolName)
                .and("invokeResult").is(1);
    }

    public Criteria createCriteria(String repoUuid, String commitId, String toolName) {
        return Criteria.where("repoUuid").is(repoUuid)
                .and("commitId").is(commitId)
                .and("tool").is(toolName);
    }

    private CriteriaDefinition createRepoCriteria(String repoUuid, String toolName) {
        if (toolName != null) {
            return Criteria.where("repoUuid").is(repoUuid)
                    .and("tool").is(toolName);
        }
        return Criteria.where("repoUuid").is(repoUuid);
    }

    public Integer getOneCommitTotalIssueNum(String repoUuid, String commitId, String toolName) {
//        return issueAnalyzerMapper.getOneCommitTotalIssueNum(repoUuid, commitId);
        Query query = new Query();
        query.fields().include("rawIssueNum");
        query.addCriteria(createCriteria(repoUuid, commitId, toolName));
        return mongoTemplate.find(query, RawIssueCache.class, COLLECTION_NAME).stream().map(RawIssueCache::getRawIssueNum).reduce(Integer::sum).orElse(0);
    }

    public void updateTotalIssueNum(String repoUuid, String commitId, String tool, int num) {
//        issueAnalyzerMapper.updateTotalIssueNum(repoUuid, commitId, num);
        Update update = Update.update("rawIssueNum", num);
        Query query = Query.query(createCriteria(repoUuid, commitId, tool));
        mongoTemplate.updateFirst(query, update, RawIssueCache.class, COLLECTION_NAME);
    }

    public Integer getInvokeResult(String repoUuid, String commitId, String toolName) {
        Query query = new Query();
        query.fields().include("invokeResult");
        query.addCriteria(createCriteria(repoUuid, commitId, toolName));
        return Objects.requireNonNull(mongoTemplate.findOne(query, RawIssueCache.class, COLLECTION_NAME)).getInvokeResult();
//        return issueAnalyzerMapper.getInvokeResult(repoUuid, commitId, toolName);
    }

    public Integer getIsTotalScan(String repoUuid, String commitId, String toolName) {
        Query query = new Query();
        query.fields().include("isTotalScan");
        query.addCriteria(createCriteria(repoUuid, commitId, toolName));
        return Objects.requireNonNull(mongoTemplate.findOne(query, RawIssueCache.class, COLLECTION_NAME)).getIsTotalScan();
    }

}
