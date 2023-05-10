package cn.edu.fudan.issueservice.util;

import org.springframework.util.StringUtils;

import java.io.File;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * @author Beethoven
 */
public class StringsUtil {

    private static final Pattern P = Pattern.compile("[\r\n]");

    public static String removeBr(String str) {
        Matcher matcher = P.matcher(str);
        return matcher.replaceAll("");
    }

    public static void splitString(String[] queryName, String[] splitStrings, Map<String, Object> query) {
        for (int i = 0; i < splitStrings.length; i++) {
            if (!StringUtils.isEmpty(splitStrings[i])) {
                query.put(queryName[i], splitStringList(splitStrings[i]));
            } else {
                query.put(queryName[i], null);
            }
        }
    }

    public static List<String> splitStringList(String splitString) {
        if (StringUtils.isEmpty(splitString)) {
            return new ArrayList<>();
        }
        return Arrays.asList(splitString.split(","));
    }

    public static Set<String> splitString2Set(String splitString) {
        if (StringUtils.isEmpty(splitString)) {
            return new HashSet<>();
        }
        return new HashSet<>(Arrays.asList(splitString.split(",")));
    }

    public static String unionStringList(List<String> list) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < list.size(); i++) {
            if (i != 0) {
                result.append(",");
            }
            result.append(list.get(i));
        }
        return result.toString();
    }

    public static <T> List<T> objectToList(Object obj, Class<T> cla) {
        List<T> list = new ArrayList<T>();
        if (obj instanceof ArrayList<?>) {
            for (Object o : (List<?>) obj) {
                list.add(cla.cast(o));
            }
            return list;
        }
        return null;
    }

    public static String firstLine(String str) {
        if (str == null || str.trim().isEmpty()) {
            return "";
        }
        return str.split("\n")[0];
    }

    public static boolean equalsWithoutSign(String src, String target) {
        if ((src == null || src.trim().isEmpty()) || (target == null || target.trim().isEmpty())) {
            return true;
        }
        String srcWithoutSign = src.trim().replaceAll("[_-]", " ").toLowerCase(Locale.ROOT);
        String targetWithoutSing = target.trim().replaceAll("[_-]", " ").toLowerCase(Locale.ROOT);
        return srcWithoutSign.equals(targetWithoutSing);
    }

    public static List<String> parseParentCommits(String parentCommits) {
        if (StringUtils.isEmpty(parentCommits)) {
            return new ArrayList<>();
        }
        return Stream.of(parentCommits.split("[',\\[\\]]")).filter(s -> s.length() >= 8).map(String::trim)
                .collect(Collectors.toList());
    }

    public static void main(String[] args) {
        System.out.println(equalsWithoutSign("CODE_SMELL", "Code smell"));
        System.out.println(new File(System.getProperty("user.dir") + "/issue-service/src/test/dependency/repo").exists());
    }
}
