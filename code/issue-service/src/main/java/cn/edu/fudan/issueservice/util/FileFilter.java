package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.issueservice.domain.enums.ToolEnum;

/**
 * description:
 *
 * @author fancying
 * create: 2020-01-06 14:08
 **/
public final class FileFilter {
    /**
     * JPMS 模块
     */
    private static final String JPMS = "module-info.java";

    public static boolean fileFilter(String tool, String path) {
        if (ToolEnum.SONAR.getType().endsWith(tool)) {
            return javaFilenameFilter(path);
        } else if (ToolEnum.ESLINT.getType().equals(tool)) {
            return jsFilenameFilter(path);
        } else {
            return cppFilenameFilter(path);
        }
    }

    public static boolean baseFilenameFilter(String path, String str) {
        return path.toLowerCase().contains("/test/") ||
                path.toLowerCase().contains("/tests/") ||
                path.toLowerCase().contains("/.mvn/") ||
                path.toLowerCase().contains("lib/") ||
                str.toLowerCase().startsWith("test");
    }

    private static String getFilename(String path) {
        String[] strs = path.split("/");
        return strs[strs.length - 1].toLowerCase();
    }

    /**
     * true: 过滤
     * false： 不过滤
     */
    public static boolean javaFilenameFilter(String path) {
        if (path == null || path.isEmpty()) {
            return true;
        }
        String str = getFilename(path);
        return baseFilenameFilter(path, str) ||
                !str.toLowerCase().endsWith(".java") ||
                str.toLowerCase().endsWith("test.java") ||
                str.toLowerCase().endsWith("tests.java") ||
                str.toLowerCase().endsWith("enum.java") ||
                path.contains(JPMS);
    }

    public static boolean jsFilenameFilter(String path) {
        String str = getFilename(path);
        return baseFilenameFilter(path, str) ||
                !str.endsWith(".js") ||
                path.toLowerCase().contains("node_modules/") ||
                path.toLowerCase().contains("target/") ||
                path.toLowerCase().contains("build/") ||
                path.toLowerCase().contains("dist/") ||
                path.toLowerCase().contains("src/assets/") ||
                str.endsWith("test.js") ||
                str.endsWith("tests.js") ||
                str.startsWith(".");

    }

    public static boolean cppFilenameFilter(String path) {
        String str = getFilename(path);
        return baseFilenameFilter(path, str) ||
                str.endsWith("test.cc") ||
                str.endsWith("test.cpp") ||
                str.endsWith("test.h") ||
                (!str.endsWith(".cpp") && !str.endsWith(".cc") && !str.endsWith(".h"));
    }
}
