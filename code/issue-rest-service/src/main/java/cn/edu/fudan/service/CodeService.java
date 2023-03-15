package cn.edu.fudan.service;

import org.eclipse.jgit.api.errors.GitAPIException;

import java.util.HashMap;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc Code management
 * @date 2023/3/3 14:48
 */

public interface CodeService {
    HashMap<String, String> getFileContent(String repoUuid, String commitId, String filePath, int start, int end) throws NullPointerException, GitAPIException;

}
