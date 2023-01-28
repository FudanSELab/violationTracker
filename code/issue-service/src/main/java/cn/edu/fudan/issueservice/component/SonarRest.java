package cn.edu.fudan.issueservice.component;

import cn.edu.fudan.common.component.BaseRepoRestManager;
import cn.edu.fudan.common.config.RestTemplateConfig;
import cn.edu.fudan.common.enums.ServiceEnum;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import javax.xml.bind.DatatypeConverter;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author fancying
 * @author zjf
 * @author heyue
 * @author WZY
 * @version 1.0
 **/
@Component
@Slf4j
@Import(RestTemplateConfig.class)
public class SonarRest extends BaseRepoRestManager {

    private static final String REPO_NAME = "repoName";

    @Value("${sonar.login:admin}")
    public String sonarLogin;
    @Value("${sonar.password:admin}")
    public String sonarPassword;



    @Value("${sonar.service.path}")
    private String sonarServicePath;

    private boolean initSonarAuth = false;
    private HttpEntity<HttpHeaders> sonarAuthHeader;


    public SonarRest(RestTemplate restTemplate) {
        super(restTemplate, "", "", ServiceEnum.ISSUE);
    }


    static Map<String, String> repoUuid2Path = new ConcurrentHashMap(36);

    public static void cacheRepoPath(String repoUuid, String repoPath) {
        repoUuid2Path.put(repoUuid, repoPath);
    }


    @Override
    public String getCodeServiceRepo(String repoId) {
        return repoUuid2Path.get(repoId);
    }


    private void initSonarAuthorization() {
        HttpHeaders headers = new HttpHeaders();
        String encoding = DatatypeConverter.printBase64Binary((sonarLogin + ":" + sonarPassword).getBytes(StandardCharsets.UTF_8));
        headers.add("Authorization", "Basic " + encoding);
        this.sonarAuthHeader = new HttpEntity<>(headers);
        initSonarAuth = true;
    }

    public JSONArray getSonarIssueDirectories(String componentKeys) {
        if (!initSonarAuth) {
            initSonarAuthorization();
        }
        String url = sonarServicePath + "/api/issues/search?componentKeys={componentKeys}&ps=1&p=1&facets=directories";
        Map<String, String> map = new HashMap<>();
        map.put("componentKeys", componentKeys);
        try {
            ResponseEntity<JSONObject> entity = restTemplate.exchange(url, HttpMethod.POST, sonarAuthHeader, JSONObject.class, map);
            JSONObject sonarResult = JSONObject.parseObject(Objects.requireNonNull(entity.getBody()).toString());
            JSONArray facets = sonarResult.getJSONArray("facets");
            for (Object o1 : facets) {
                if ("directories".equals(((JSONObject) o1).getString("property"))) {
                    return ((JSONObject) o1).getJSONArray("values");
                }
            }
            return null;
        } catch (RuntimeException e) {
            log.error("repo name : {}  ----> request sonar api failed getSonarIssueDirectories", componentKeys);
            return null;
        }
    }

    public JSONObject getSonarIssueFileUuidsInDirectory(String componentKey, String directory) {
        if (!initSonarAuth) {
            initSonarAuthorization();
        }
        String url = sonarServicePath + "/api/issues/search?componentKeys={componentKeys}&directories={directories}&ps=1&p=1&facets=files";
        Map<String, String> map = new HashMap<>();
        map.put("componentKeys", componentKey);
        map.put("directories", directory);
        try {
            ResponseEntity<JSONObject> entity = restTemplate.exchange(url, HttpMethod.POST, sonarAuthHeader, JSONObject.class, map);
            return JSON.parseObject(Objects.requireNonNull(entity.getBody()).toString());
        } catch (RuntimeException e) {
            log.error("repo name : {}, directory: {}  ----> request sonar api failed getSonarIssueFileUuidsInDirectory", componentKey, directory);
            return null;
        }
    }


    public JSONObject getSonarSecurityHotspot(String hotspot) {
        if (!initSonarAuth) {
            initSonarAuthorization();
        }
        String url = sonarServicePath + "/api/hotspots/show?hotspot={hotspot}";
        Map<String, String> map = new HashMap<>();
        map.put("hotspot", hotspot);
        try {
            ResponseEntity<JSONObject> entity = restTemplate.exchange(url, HttpMethod.GET, sonarAuthHeader, JSONObject.class, map);
            return JSON.parseObject(Objects.requireNonNull(entity.getBody()).toString());
        } catch (RuntimeException e) {
            log.error("repo name : {}  ----> request sonar api failed getSonarSecurityHotspot", hotspot);
            return null;
        }
    }

    public JSONObject getSonarSecurityHotspotList(String repoName, int pageSize, int page) {

        if (!initSonarAuth) {
            initSonarAuthorization();
        }
        StringBuilder urlBuilder = new StringBuilder(sonarServicePath + "/api/hotspots/search?projectKey={repoName}");
        Map<String, String> map = new HashMap<>(4);
        map.put(REPO_NAME, repoName);
        if (page > 0) {
            urlBuilder.append("&p={p}");
            map.put("p", String.valueOf(page));
        }
        if (pageSize > 0) {
            urlBuilder.append("&ps={ps}");
            map.put("ps", String.valueOf(pageSize));
        }
        try {
            ResponseEntity<JSONObject> entity = restTemplate.exchange(urlBuilder.toString(), HttpMethod.GET, sonarAuthHeader, JSONObject.class, map);
            return JSON.parseObject(Objects.requireNonNull(entity.getBody()).toString());
        } catch (RuntimeException e) {
            log.error("repo name : {}  ----> request sonar api failed getSonarSecurityHotspotList", repoName);
            return null;
        }

    }

    public JSONObject getSonarIssueResults(String componentKey, String directories, String fileUuids, String type, int pageSize, boolean resolved, int page) {
        log.debug("get sonar result, key: {}, dir: {}, file: {}, type: {}", componentKey, directories, fileUuids, type);
        if (!initSonarAuth) {
            initSonarAuthorization();
        }

        Map<String, String> map = new HashMap<>(16);
        StringBuilder urlBuilder = new StringBuilder();
        urlBuilder.append(sonarServicePath).append("/api/issues/search?componentKeys={componentKeys}&additionalFields={additionalFields}&s={s}&resolved={resolved}");
        map.put("additionalFields", "_all");
        map.put("s", "FILE_LINE");
        map.put("componentKeys", componentKey);
        map.put("resolved", String.valueOf(resolved));
        if (!StringUtils.isEmpty(directories)) {
            urlBuilder.append("&directories={directories}");
            map.put("directories", directories);
        }
        if (!StringUtils.isEmpty(fileUuids)) {
            urlBuilder.append("&files={files}");
            map.put("files", fileUuids);
        }
        if (type != null) {
            String[] types = type.split(",");
            StringBuilder stringBuilder = new StringBuilder();
            for (String typeSb : types) {
                if ("CODE_SMELL".equals(typeSb) || "BUG".equals(typeSb) || "VULNERABILITY".equals(typeSb) || "SECURITY_HOTSPOT".equals(typeSb)) {
                    stringBuilder.append(typeSb).append(",");
                }
            }
            if (!stringBuilder.toString().isEmpty()) {
                urlBuilder.append("&types={types}");
                String requestTypes = stringBuilder.substring(0, stringBuilder.toString().length() - 1);
                map.put("types", requestTypes);
            } else {
                log.error("this request type --> {} is not available in sonar api", type);
                return null;
            }
        }

        if (page > 0) {
            urlBuilder.append("&p={p}");
            map.put("p", String.valueOf(page));
        }
        if (pageSize > 0) {
            urlBuilder.append("&ps={ps}");
            map.put("ps", String.valueOf(pageSize));
        }

        String url = urlBuilder.toString();

        try {
            ResponseEntity<JSONObject> entity = restTemplate.exchange(url, HttpMethod.GET, sonarAuthHeader, JSONObject.class, map);
            return JSONObject.parseObject(Objects.requireNonNull(entity.getBody()).toString());
        } catch (RuntimeException e) {
            log.error("repo name : {}  ----> request sonar api failed getSonarIssueResults", componentKey);
            log.debug("error page is {}", page);
            return null;
        }
    }

    public JSONObject getRuleInfo(String ruleKey, String actives, String organizationKey) {

        if (!initSonarAuth) {
            initSonarAuthorization();
        }

        Map<String, String> map = new HashMap<>(64);

        String baseRequestUrl = sonarServicePath + "/api/rules/show";
        if (ruleKey == null) {
            log.error("ruleKey is missing");
            return null;
        } else {
            map.put("key", ruleKey);
        }
        if (actives != null) {
            map.put("actives", actives);
        }
        if (organizationKey != null) {
            map.put("organization", organizationKey);
        }

        try {
            return restTemplate.exchange(baseRequestUrl + "?key=" + ruleKey, HttpMethod.GET, sonarAuthHeader, JSONObject.class).getBody();
        } catch (Exception e) {
            log.error("ruleKey : {}  ----> request sonar  rule information api failed", ruleKey);
            return null;
        }

    }

    public JSONObject getSonarAnalysisTime(String projectName) {

        if (!initSonarAuth) {
            initSonarAuthorization();
        }

        JSONObject error = new JSONObject();
        error.put("errors", "Component key " + projectName + " not found");

        try {
            String urlPath = sonarServicePath + "/api/components/show?component=" + projectName;
            log.debug(urlPath);
            return restTemplate.exchange(urlPath, HttpMethod.GET, sonarAuthHeader, JSONObject.class).getBody();
        } catch (Exception e) {
            log.error(e.getMessage());
            log.error("projectName: {} ---> request sonar api failed 获取最新版本时间API 失败", projectName);
        }

        return error;
    }


}
