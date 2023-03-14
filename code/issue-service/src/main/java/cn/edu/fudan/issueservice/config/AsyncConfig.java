package cn.edu.fudan.issueservice.config;

import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * @author fancying
 * @author beethoven
 * @author pjh
 */
@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig {


    @Value("${parallelScanRepoSize:3}")
    private int parallelScanRepoSize;

    @Value("${repoQueueCapacity:30}")
    private int repoQueueCapacity;

    @Value("${corePoolSize:3}")
    private int corePoolSize;

    @Value("${maxPoolSize:5}")
    private int maxPoolSize;

    @Value("${maxPoolSize:600}")
    private int keepAliveSeconds;

    @Value("${threadNamePrefix:async-task-thread-pool-}")
    private String threadNamePrefix;

    /**
     * Maximum number of parallel scans supported for multiple repositories.
     */
    @Bean("taskExecutor")
    public TaskExecutor repoScanTaskExecutor() {
        return createOne();
    }

    /**
     * Use this thread pool to monitor the commit readiness status of the code repository.
     */
    @Bean("prepare-resource")
    public TaskExecutor prepareResourceTaskExecutor() {
        return createOne();
    }

    /**
     * Maximum number of parallel commit resources supported for preparation.
     * The default number of parallel resources per repo is 3.
     */
    @Bean("produce-resource")
    public TaskExecutor produceResourceTaskExecutor() {
        ThreadPoolTaskExecutor executor = createOne();
        executor.setMaxPoolSize(maxPoolSize * 3);
        executor.setCorePoolSize(corePoolSize * 3);

        return executor;
    }

    /**
     * Maximum number of code repositories supported for simultaneous deletion.
     */
    @Bean("delete-issue")
    public TaskExecutor deleteIssueTaskExecutor() {
        return createOne();
    }

    private ThreadPoolTaskExecutor createOne() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(repoQueueCapacity);
        executor.setKeepAliveSeconds(keepAliveSeconds);
        executor.setThreadNamePrefix(threadNamePrefix);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.initialize();
        return executor;
    }

}
