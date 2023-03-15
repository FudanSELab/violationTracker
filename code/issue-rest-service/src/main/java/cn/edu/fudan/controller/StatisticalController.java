package cn.edu.fudan.controller;

import cn.edu.fudan.dao.IssueDao;
import cn.edu.fudan.dao.RawIssueMatchInfoDao;
import cn.edu.fudan.domain.ResponseBean;
import cn.edu.fudan.domain.dbo.Issue;
import cn.edu.fudan.domain.dbo.RawIssueMatchInfo;
import cn.edu.fudan.util.StringsUtil;
import com.alibaba.fastjson.JSONObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author beethoven
 * @date 2022-04-07 18:01:54
 */
@RestController
public class StatisticalController {

    @Resource
    private IssueDao issueDao;
    @Resource
    private RawIssueMatchInfoDao rawIssueMatchInfoDao;

    @GetMapping("/solved-life/top10")
    public ResponseBean<List<Map.Entry<String, Double>>> getSolvedTop10(@RequestParam(name = "repo_uuids") String repoUuids,
                                                                        @RequestParam(name = "solve_way") String solveWay,
                                                                        @RequestParam(name = "limit") Integer limit,
                                                                        @RequestParam(name = "asc") Boolean asc) {
        List<String> repos = StringsUtil.splitStringList(repoUuids);
        List<Issue> list = issueDao.getIssuesByRepos(repos);
        List<Issue> res = new ArrayList<>();
        for (Issue issue : list) {
            RawIssueMatchInfo info = rawIssueMatchInfoDao.getMaxIdMatchInfoByIssueUuid(issue.getUuid());
            if (info == null)
                continue;
            if (info.getSolveWay().equals(solveWay)) {
                res.add(issue);
            }
        }

        Map<String, List<Issue>> map = new HashMap<>();
        for (Issue issue : res) {
            List<Issue> issues = map.getOrDefault(issue.getType(), new ArrayList<>());
            issues.add(issue);
            map.put(issue.getType(), issues);
        }

        map.entrySet().removeIf(entry -> entry.getValue().size() < limit);

        Map<String, Double> lifeMap = new HashMap<>();
        for (Map.Entry<String, List<Issue>> entry : map.entrySet()) {
            double sum = 0.0;
            for (Issue issue : entry.getValue()) {
                sum = sum + (issue.getSolveCommitDate().getTime() - issue.getStartCommitDate().getTime()) * 1.0 / 1000 / 60 / 60 / 24;
            }
            lifeMap.put(entry.getKey(), sum / entry.getValue().size());
        }

        List<Map.Entry<String, Double>> result = new ArrayList<>(lifeMap.entrySet());
        if (asc) {
            result.sort(Map.Entry.comparingByValue());
        } else {
            result.sort((o1, o2) -> o2.getValue().compareTo(o1.getValue()));
        }

        return new ResponseBean<>(200, "success", result.subList(0, Math.min(10, result.size())));
    }

    @GetMapping("/solve-way/types")
    public ResponseBean<List<Map.Entry<String, JSONObject>>> getSolvedWayByTypes(@RequestParam(name = "repo_uuids") String repoUuids,
                                                                                 @RequestParam Integer num) {
        List<String> repos = StringsUtil.splitStringList(repoUuids);
        List<Issue> issues = issueDao.getIssuesByRepos(repos);
        Map<String, List<Issue>> collect = issues.stream().collect(Collectors.groupingBy(Issue::getType));
        issues.removeIf(issue -> collect.get(issue.getType()).size() < num);

        Map<String, JSONObject> result = new HashMap<>();
        for (Issue issue : issues) {
            RawIssueMatchInfo info = rawIssueMatchInfoDao.getMaxIdMatchInfoByIssueUuid(issue.getUuid());
            if (info == null)
                continue;

            int x = "normal_solved".equals(info.getSolveWay()) ? 1 : 0;
            JSONObject jsonObject;
            if (result.containsKey(issue.getType())) {
                jsonObject = result.get(issue.getType());
                jsonObject.put("normalSolved", jsonObject.getIntValue("normalSolved") + x);
                jsonObject.put("deleteSolved", jsonObject.getIntValue("deleteSolved") + 1 - x);
                jsonObject.put("num", jsonObject.getIntValue("num") + 1);
            } else {
                jsonObject = new JSONObject();
                jsonObject.put("normalSolved", x);
                jsonObject.put("deleteSolved", 1 - x);
                jsonObject.put("num", 1);
            }
            result.put(issue.getType(), jsonObject);
        }

        for (Map.Entry<String, JSONObject> entry : result.entrySet()) {
            JSONObject value = entry.getValue();
            value.put("normalRate", value.getIntValue("normalSolved") * 1.0 / value.getIntValue("num"));
        }

        List<Map.Entry<String, JSONObject>> response = new ArrayList<>(result.entrySet());
        response.sort((o1, o2) -> (int) ((o1.getValue().getDouble("normalRate") - o2.getValue().getDouble("normalRate")) * 100000));
        return new ResponseBean<>(200, "success", response);
    }
}
