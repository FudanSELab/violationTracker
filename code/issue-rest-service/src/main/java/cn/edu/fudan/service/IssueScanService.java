package cn.edu.fudan.service;

import cn.edu.fudan.common.domain.po.scan.RepoScan;

import java.util.List;
import java.util.Map;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc
 * @date 2023/3/15 10:40
 */

public interface IssueScanService {
    List<RepoScan> getScanStatuses(String repoUuids, Integer page, Integer ps);


    Map<String, List<Map<String, String>>> getScanRepos();
}
