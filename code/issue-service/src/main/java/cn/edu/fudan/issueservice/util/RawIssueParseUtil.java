package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.issueservice.domain.dbo.RawIssue;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author Joshua
 * @description
 * @date 2022-08-04 15:38
 **/
public class RawIssueParseUtil {

    public static List<RawIssue> json2RawIssues(JSONObject jsonObject){
        List<RawIssue> rawIssues = new ArrayList<>();
        JSONObject jsonResult = jsonObject.getJSONObject("result");
        if (jsonResult != null) {
            for (Object value : jsonResult.values()) {
                String s = JSON.toJSONString(value);
                rawIssues.addAll(JSON.parseArray(s, RawIssue.class));
            }
        }
        return rawIssues;
    }

    public static JSONObject rawIssues2JSON(List<RawIssue> rawIssues){
        Map<String, List<RawIssue>> commitToRawIssues = rawIssues.stream().collect(Collectors.groupingBy(RawIssue::getCommitId));
        JSONObject jsonObject = JSON.parseObject(JSON.toJSONString(commitToRawIssues));
        JSONObject result = new JSONObject();
        result.put("result",jsonObject);
        return result;
    }


}
