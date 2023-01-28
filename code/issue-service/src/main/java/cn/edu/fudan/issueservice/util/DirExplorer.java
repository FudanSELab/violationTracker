package cn.edu.fudan.issueservice.util;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;
import java.util.stream.Collectors;

/**
 * description: 遍历得到所有的文件
 *
 * @author fancying
 * create: 2019-05-24 11:52
 **/
public class DirExplorer {

    static final String EMPTY = "";
    static final String SEPARATOR = System.getProperty("os.name").toLowerCase().contains("win") ? "\\" : "/";
    static final String SUFFIX_JAVA = ".java";
    static final String SUFFIX_CLASS = ".class";
    private final static String TARGET_STR = "target";
    private final Filter filter;
    private final FileHandler fileHandler;

    public DirExplorer(Filter filter, FileHandler fileHandler) {
        this.filter = filter;
        this.fileHandler = fileHandler;
    }

    public static void deleteRedundantTarget(String repoPath) {

        if (deleteExtraFile(repoPath)) {
            return;
        }

        new DirExplorer((level, path, file) ->
        {
            if (file.getAbsolutePath().endsWith(TARGET_STR)) {
                String filePath = file.getAbsolutePath();
                String pomPath = filePath.substring(0, filePath.indexOf(TARGET_STR)) + "pom.xml";
                String srcPath = filePath.substring(0, filePath.indexOf(TARGET_STR)) + "src";
                File pomFile = new File(pomPath);
                File srcFile = new File(srcPath);
                return !pomFile.exists() || !srcFile.exists();
            }
            return false;
        },
                (level, path, file) -> {
                    deleteAllByPath(file);
                    file.delete();
                }).exploreDir(new File(repoPath));
    }

    private static void deleteAllByPath(File rootFilePath) {
        File[] needToDeleteFiles = rootFilePath.listFiles();
        if (needToDeleteFiles == null) {
            return;
        }
        for (File needToDeleteFile : needToDeleteFiles) {
            if (needToDeleteFile.isDirectory()) {
                deleteAllByPath(needToDeleteFile);
            }
            try {
                Files.delete(needToDeleteFile.toPath());
            } catch (IOException e) {
                System.out.println("Delete temp directory or file failed." + e.getMessage());
            }
        }
    }

    /**
     * 找到指定路径下具有某一后缀的所有文件
     */
    public static List<String> findSuffixFiles(String dir, String suffix) {
        File dirFile = new File(dir);

        List<String> pathList = new ArrayList<>();
        new DirExplorer((level, path, file) -> (file.isFile() && path.endsWith(suffix)),
                (level, path, file) -> pathList.add(file.getAbsolutePath())).explore(dirFile);

        return pathList;
    }

    /**
     * 删除多余的 class文件
     */
    public static boolean deleteExtraFile(String dir) {
        String compileDir = "/target/classes/";


        List<String> javaFiles = findSuffixFiles(dir, SUFFIX_JAVA);
        Map<String, String> jName2path = javaFiles.stream().collect(Collectors.toMap(
                javaFile -> javaFile.substring(javaFile.lastIndexOf(SEPARATOR) + 1).replace(SUFFIX_JAVA, EMPTY),
                javaFile -> javaFile,
                (k1, k2) -> k2));

        List<String> classFiles = findSuffixFiles(dir, SUFFIX_CLASS);
        Map<String, String> cName2path = classFiles.stream().collect(Collectors.toMap(
                classFile -> classFile.substring(classFile.lastIndexOf(SEPARATOR) + 1).replace(SUFFIX_CLASS, EMPTY),
                classFile -> classFile,
                (k1, k2) -> k2));


        Set<String> jSet = jName2path.keySet();
        boolean deleteSuccess = true;
        for (String c : cName2path.keySet()) {
            // 判断是否是同名文件
            if (jSet.contains(c)) {
                String cPath = cName2path.get(c).
                        replace(dir, EMPTY).
                        replace(compileDir, EMPTY).
                        replace(SUFFIX_CLASS, EMPTY);
                if (jName2path.get(c).contains(cPath)) {
                    continue;
                }
            }
            deleteSuccess &= new File(cName2path.get(c)).delete();
        }
        return deleteSuccess;
    }

    public void explore(File root) {
        explore(0, "", root);
    }

    private void explore(int level, String path, File file) {
        if (file.isDirectory() && file.listFiles() != null && Objects.requireNonNull(file.listFiles()).length > 0) {
            for (File child : Objects.requireNonNull(file.listFiles())) {
                explore(level + 1, path + "/" + child.getName(), child);
            }
        } else {
            if (filter.filter(level, path, file)) {
                fileHandler.handle(level, path, file);
            }
        }
    }

    public void exploreDir(File root) {
        exploreDir(0, "", root);
    }

    private void exploreDir(int level, String path, File file) {
        if (file.isDirectory()) {
            if (filter.filter(level, path, file)) {
                fileHandler.handle(level, path, file);
            }
            if (file.listFiles() != null) {
                for (File child : Objects.requireNonNull(file.listFiles())) {
                    exploreDir(level + 1, path + "/" + child.getName(), child);
                }
            }
        }
    }

    public interface Filter {
        boolean filter(int level, String path, File file);
    }

    public interface FileHandler {
        void handle(int level, String path, File file);
    }

///    public static void main(String[] args) {
//        ///    String dir = "E:\\Lab\\t-repo\\code-scan";
//        ///    System.out.println(deleteExtraFile(dir));
//    }
}
