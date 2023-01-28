package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.common.jgit.JGitHelper;
import lombok.SneakyThrows;
import org.springframework.stereotype.Component;

/**
 * @author beethoven
 * @date 2021-08-12 12:27:58
 */
@Component
public class DeveloperUniqueNameUtil {


    /**
     * fixme 从人员服务统一获取
     */
    @SneakyThrows
    public static String getDeveloperUniqueName(String repoPath, String commit, String repoUuid) {
        JGitHelper jGitInvoker =  JGitHelper.getInstance(repoPath);
        String developerUniqueName = jGitInvoker.getAuthorName(commit);
        jGitInvoker.close();
        return developerUniqueName;
    }

}
