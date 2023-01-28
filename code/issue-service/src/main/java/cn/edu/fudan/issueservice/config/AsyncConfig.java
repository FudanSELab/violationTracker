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
     * 最多支持多少个库的并行扫描
     */
    @Bean("taskExecutor")
    public TaskExecutor repoScanTaskExecutor() {
        return createOne();
    }

    /**
     * 最多支持多少个库的并行扫描
     * 这个线程池用来监管  库 准备commit的状态
     */
    @Bean("prepare-resource")
    public TaskExecutor prepareResourceTaskExecutor() {
        return createOne();
    }

    /**
     * 最多支持多少个commit并行准备资源 每个repo是3个commit并行
     */
    @Bean("produce-resource")
    public TaskExecutor produceResourceTaskExecutor() {
        ThreadPoolTaskExecutor executor = createOne();
        executor.setMaxPoolSize(maxPoolSize * 3);
        executor.setCorePoolSize(corePoolSize * 3);

        return executor;
    }

    /**
     * 最多支持多少个库的同时删除
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
