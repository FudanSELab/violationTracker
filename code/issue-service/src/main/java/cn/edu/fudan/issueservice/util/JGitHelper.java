package cn.edu.fudan.issueservice.util;

import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;

import java.io.Closeable;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * @author fancying
 * create: 2019-06-05 17:16
 **/
@SuppressWarnings("Duplicates")
@Slf4j
public class JGitHelper extends cn.edu.fudan.common.jgit.JGitHelper implements Closeable {

    public JGitHelper(String repoPath) {
        super(repoPath);
    }

    @Override
    @SneakyThrows
    public Date getCommitDateTime(String commit) {
        return new SimpleDateFormat(FORMAT).parse(getCommitTime(commit));
    }

    @Override
    public void close() throws IOException {
        repository.close();
    }

    @Override
    public boolean checkout(String commit) {
        boolean success = super.checkout(commit);
        if (!success) {
            log.error("JGit checkout {} failed!", commit);
            log.info("retry with Git checkout");
            return ShUtil.executeCommand("cd " + this.repoPath + " && rm -rf .git/index.lock* && git clean -fd && git reset --hard " +
                    "&& git checkout " + commit, 0);
        }
        return true;
    }
}
