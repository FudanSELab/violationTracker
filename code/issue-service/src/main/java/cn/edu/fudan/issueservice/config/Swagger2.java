package cn.edu.fudan.issueservice.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.SimpleUrlHandlerMapping;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.web.servlet.resource.ResourceHttpRequestHandler;
import org.springframework.web.util.UrlPathHelper;
import springfox.documentation.annotations.ApiIgnore;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.ParameterBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.schema.ModelRef;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.Contact;
import springfox.documentation.service.Parameter;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.DocumentationCache;
import springfox.documentation.spring.web.json.Json;
import springfox.documentation.spring.web.json.JsonSerializer;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger.web.ApiResourceController;
import springfox.documentation.swagger.web.SecurityConfiguration;
import springfox.documentation.swagger.web.SwaggerResource;
import springfox.documentation.swagger.web.UiConfiguration;
import springfox.documentation.swagger2.annotations.EnableSwagger2;
import springfox.documentation.swagger2.mappers.ServiceModelToSwagger2Mapper;
import springfox.documentation.swagger2.web.Swagger2Controller;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import java.util.*;

/**
 * @author codeWisdom
 */
@Configuration
@EnableSwagger2
public class Swagger2 {

    private static final String DEFAULT_PATH = "/issue-swagger";
    private static final String CONTROLLER_PACKAGE = "cn.edu.fudan.issueservice.controller";
    private static final String TITLE = "code wisdom Issue-service Api";
    private static final String DOC_DES = "code wisdom Issue-service api doc";
    private static final String VISIT_URL = "http://10.176.34.85:8005/";
    private static final String EMAIL = "zjf@fudan.edu.cn";

    @Value("${defaultUserToken}")
    private String userToken;

    /**
     * Configure the core configuration for swagger2, Docket.
     */
    @Bean
    public Docket createRestApi() {

        // Add Header
        ParameterBuilder ticketPar = new ParameterBuilder();
        List<Parameter> pars = new ArrayList<>();
        ticketPar.name("token").description("Http headers token")
                .modelRef(new ModelRef("string")).parameterType("header")
                // The ticket parameter in the header is optional and can also be passed as empty.
                .defaultValue(userToken).required(false).build();
        pars.add(ticketPar.build());

        // Specify the api type as swagger2.
        return new Docket(DocumentationType.SWAGGER_2)
                // Define the information for the api document.
                .apiInfo(apiInfo())
                .select()
                // Specify the controller package.
                .apis(RequestHandlerSelectors.basePackage(CONTROLLER_PACKAGE))
                // Specify all controllers.
                .paths(PathSelectors.any())
                .build()
                .globalOperationParameters(pars);
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                // Document page title.
                .title(TITLE)
                // Contact information.
                .contact(new Contact("CODE WISDOM",
                        "http://10.176.34.85:8888/",
                        EMAIL))
                // Description
                .description(DOC_DES)
                // Version
                .version("1.0.1")
                // HTTP URL
                .termsOfServiceUrl(VISIT_URL)
                .build();
    }


    /**
     * Swagger UI
     *
     * @param servletContext
     * @param order
     * @return
     * @throws Exception
     */
    @Bean
    public SimpleUrlHandlerMapping swaggerUrlHandlerMapping(ServletContext servletContext,
                                                            @Value("${swagger.mapping.order:10}") int order) throws Exception {
        SimpleUrlHandlerMapping urlHandlerMapping = new SimpleUrlHandlerMapping();
        Map<String, ResourceHttpRequestHandler> urlMap = new HashMap<>(4);
        {
            PathResourceResolver pathResourceResolver = new PathResourceResolver();
            pathResourceResolver.setAllowedLocations(new ClassPathResource("META-INF/resources/webjars/"));
            pathResourceResolver.setUrlPathHelper(new UrlPathHelper());

            ResourceHttpRequestHandler resourceHttpRequestHandler = new ResourceHttpRequestHandler();

            resourceHttpRequestHandler.setLocations(Collections.singletonList(new ClassPathResource("META-INF/resources/webjars/")));
            resourceHttpRequestHandler.setResourceResolvers(Collections.singletonList(pathResourceResolver));
            resourceHttpRequestHandler.setServletContext(servletContext);
            resourceHttpRequestHandler.afterPropertiesSet();
            //设置新的路径
            urlMap.put(DEFAULT_PATH + "/webjars/**", resourceHttpRequestHandler);
        }
        {
            PathResourceResolver pathResourceResolver = new PathResourceResolver();
            pathResourceResolver.setAllowedLocations(new ClassPathResource("META-INF/resources/"));
            pathResourceResolver.setUrlPathHelper(new UrlPathHelper());

            ResourceHttpRequestHandler resourceHttpRequestHandler = new ResourceHttpRequestHandler();
            resourceHttpRequestHandler.setLocations(Collections.singletonList(new ClassPathResource("META-INF/resources/")));
            resourceHttpRequestHandler.setResourceResolvers(Collections.singletonList(pathResourceResolver));
            resourceHttpRequestHandler.setServletContext(servletContext);
            resourceHttpRequestHandler.afterPropertiesSet();
            // Set a new path.
            urlMap.put(DEFAULT_PATH + "/**", resourceHttpRequestHandler);
        }
        urlHandlerMapping.setUrlMap(urlMap);
        // Adjust the sorting of DispatcherServlet about SimpleUrlHandlerMapping.
        urlHandlerMapping.setOrder(order);
        return urlHandlerMapping;
    }

    /**
     * Swagger UI Gate
     */
    @Controller
    @ApiIgnore
    @RequestMapping(DEFAULT_PATH)
    public static class SwaggerResourceController implements InitializingBean {

        private ApiResourceController apiResourceController;
        private Environment environment;
        private DocumentationCache documentationCache;
        private ServiceModelToSwagger2Mapper mapper;
        private JsonSerializer jsonSerializer;

        private Swagger2Controller swagger2Controller;

        public SwaggerResourceController(ApiResourceController apiResourceController, Environment environment, DocumentationCache documentationCache, ServiceModelToSwagger2Mapper mapper, JsonSerializer jsonSerializer) {
            this.apiResourceController = apiResourceController;
            this.environment = environment;
            this.documentationCache = documentationCache;
            this.mapper = mapper;
            this.jsonSerializer = jsonSerializer;
        }

        @Override
        public void afterPropertiesSet() {
            swagger2Controller = new Swagger2Controller(environment, documentationCache, mapper, jsonSerializer);
        }

        /**
         * Homepage
         *
         * @return
         */
        @RequestMapping
        public ModelAndView index() {
            return new ModelAndView("redirect:" + DEFAULT_PATH + "/swagger-ui.html");
        }

        @RequestMapping("/swagger-resources/configuration/security")
        @ResponseBody
        public ResponseEntity<SecurityConfiguration> securityConfiguration() {
            return apiResourceController.securityConfiguration();
        }

        @RequestMapping("/swagger-resources/configuration/ui")
        @ResponseBody
        public ResponseEntity<UiConfiguration> uiConfiguration() {
            return apiResourceController.uiConfiguration();
        }

        @RequestMapping("/swagger-resources")
        @ResponseBody
        public ResponseEntity<List<SwaggerResource>> swaggerResources() {
            return apiResourceController.swaggerResources();
        }

        @RequestMapping(value = "/v2/api-docs", method = RequestMethod.GET, produces = {"application/json", "application/hal+json"})
        @ResponseBody
        public ResponseEntity<Json> getDocumentation(
                @RequestParam(value = "group", required = false) String swaggerGroup,
                HttpServletRequest servletRequest) {
            return swagger2Controller.getDocumentation(swaggerGroup, servletRequest);
        }
    }

}
