package cn.edu.fudan;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc REST service
 * @date 2023/3/14 14:40
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
@MapperScan("cn.edu.fudan.mapper")
@EnableTransactionManagement
@EnableAsync(proxyTargetClass = true)
@EnableScheduling
@EnableCaching(proxyTargetClass = true)
@EnableSwagger2
public class IssueRestServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(IssueRestServiceApplication.class, args);
    }

}