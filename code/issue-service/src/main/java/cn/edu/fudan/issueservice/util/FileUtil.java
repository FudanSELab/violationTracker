package cn.edu.fudan.issueservice.util;

import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * @author Beethoven
 */
@Slf4j
public class FileUtil {

    private static final String SRC = "src";

    private static final boolean IS_WINDOWS = System.getProperty("os.name").toLowerCase().contains("win");

    private static final String JSON_STR = ".json", CODE_SOURCE_ERROR_MESSAGE = "get code source failed ! file is ---> {}";

    public static String getEsLintReportAbsolutePath(String resultFileHome, String repoUuid, String commit) {
        return IS_WINDOWS ? resultFileHome + "\\eslint-report_" + repoUuid + "_" + commit + JSON_STR
                : resultFileHome + "/eslint-report_" + repoUuid + "_" + commit + JSON_STR;
    }

    public static String handleFileNameToRelativePath(String filePath) {
        String[] paths = filePath.split("duplicate_fdse");
        return paths[paths.length - 1].substring(paths[paths.length - 1].indexOf('/') + 1);
    }

    public static String getCode(String filePath, int line, int endLine) {
        File codeFile = new File(filePath);
        //code line limit
        if (line < 0 || endLine > getTotalLines(codeFile)) {
            log.error("code line error,begin line is {},endLine is {}, code total line is {} !", line, endLine, getTotalLines(codeFile));
        }
        //get code
        try (LineNumberReader reader = new LineNumberReader(new FileReader(codeFile))) {
            StringBuilder code = new StringBuilder();
            int index = line == 0 ? -1 : 0;
            while (true) {
                index++;
                String s = reader.readLine();
                if (index >= line && index <= endLine) {
                    code.append(s);
                } else if (index > endLine) {
                    break;
                }
            }
            return StringsUtil.removeBr(code.toString());
        } catch (IOException e) {
            log.error(CODE_SOURCE_ERROR_MESSAGE, filePath);
            return null;
        }
    }

    private static int getTotalLines(File file) {
        try (LineNumberReader reader = new LineNumberReader(new FileReader(file))) {
            String s = reader.readLine();
            int lines = 0;
            while (s != null) {
                lines++;
                s = reader.readLine();
            }
            return lines;
        } catch (IOException e) {
            log.error("get total line failed !");
            return 0;
        }
    }

    public static String getEsLintRunningLogAbsolutePath(String resultFileHome, String repoUuid, String commit) {
        return IS_WINDOWS ? resultFileHome + "\\eslint-running-" + repoUuid + "_" + commit + ".log"
                : resultFileHome + "/eslint-running-" + repoUuid + "_" + commit + ".log";
    }

    public static String findSrcDir(String repoPath) {
        File repo = new File(repoPath);
        File[] files = repo.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory() && containSrc(file.getAbsolutePath())) {
                    return file.getAbsolutePath();
                }
            }
        }
        return null;
    }

    private static boolean containSrc(String absolutePath) {
        return absolutePath.contains("/src");
    }

    public static void writeIntoFile(String filename, String content) {
        try (BufferedWriter out = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(filename, true)))) {
            out.write(content + "\n");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static String readFromJSONFile(String path) {
        BufferedReader reader = null;
        StringBuilder stringBuilder = new StringBuilder("");
        try (FileInputStream fileInputStream = new FileInputStream(path)) {
            InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream, StandardCharsets.UTF_8);
            reader = new BufferedReader(inputStreamReader);
            String tempString;
            while ((tempString = reader.readLine()) != null) {
                stringBuilder.append(tempString);
            }
            reader.close();
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return stringBuilder.toString();
    }

    public static void copyFile(String oldPath, String newPath) throws IOException {
        File resourceFile = new File(oldPath);
        File targetFile = new File(newPath);
        targetFile.getParentFile().mkdirs();
        byte[] buffer = new byte[2097152];
        int readByte;
        try (FileInputStream in = new FileInputStream(resourceFile)) {
            try (FileOutputStream out = new FileOutputStream(targetFile)) {
                while ((readByte = in.read(buffer)) != -1) {
                    out.write(buffer, 0, readByte);
                }
            }
        }
    }

    /**
     * When getting the waiting result,
     * in order to speed up the result and avoid less waiting, you need to get the number of java files
     * @param repoPath
     * @return
     */
    public static int getJavaFileNum(String repoPath){
        File queryFiles = new File(repoPath);
        int num = 0;
        if(queryFiles.isDirectory()){
            File[] files = queryFiles.listFiles();
            if(files == null){
                return num;
            }
            for (File file : files) {
                if(file.isDirectory()){
                    num += getJavaFileNum(file.getAbsolutePath());
                }
                if(file.isFile() && file.getName().endsWith(".java")){
                    num++;
                }
            }
        }else if(queryFiles.isFile() && queryFiles.getName().endsWith(".java")){
            num++;
        }
        return num;
    }

    public static List<String> getAllFiles(String repoPath, String tool){
        File file = new File(repoPath);
        List<String> fileNameList = new ArrayList<>();
        LinkedList<File> fileQueue = new LinkedList<>();
        fileQueue.addLast(file);
        while (!fileQueue.isEmpty()) {
            LinkedList<File> temp = new LinkedList<>();
            while (!fileQueue.isEmpty()) {
                final File file1 = fileQueue.pollFirst();
                final String absolutePath = file1.getAbsolutePath();
                if(file1.isFile() && !FileFilter.fileFilter(tool, absolutePath)){
                    fileNameList.add(absolutePath);
                } else if(file1.isDirectory() && file1.listFiles() != null){
                    temp.addAll(Arrays.asList(Objects.requireNonNull(file1.listFiles())));
                }
            }
            fileQueue.addAll(temp);
        }
        return fileNameList;
    }

    public static List<String> getJavaDirectories(String repoPath) {
        File file = new File(repoPath);
        Set<String> directories = new HashSet<>();
        LinkedList<File> fileQueue = new LinkedList<>();
        fileQueue.addLast(file);
        while (!fileQueue.isEmpty()) {
            LinkedList<File> temp = new LinkedList<>();
            while (!fileQueue.isEmpty()) {
                final File file1 = fileQueue.pollFirst();
                if(file1.isDirectory() && file1.listFiles() != null){
                    File[] fileList = Objects.requireNonNull(file1.listFiles());
                    boolean addBefore = false;
                    for (File tempFile : fileList) {
                        if(tempFile.isDirectory() && !FileFilter.baseFilenameFilter(tempFile.getAbsolutePath(),"") && tempFile.listFiles() != null) {
                            temp.add(tempFile);
                        } else if (!addBefore && tempFile.isFile() && !FileFilter.javaFilenameFilter(tempFile.getAbsolutePath())) {
                            directories.add(file1.getAbsolutePath());
                            addBefore = true;
                        }
                    }
                }
            }
            fileQueue.addAll(temp);
        }
        return new ArrayList<>(directories);
    }

    public static List<String> getJavaFiles(String repoPath) {
        File file = new File(repoPath);
        List<String> fileNameList = new ArrayList<>();
        if(!file.isDirectory() || file.listFiles() == null) {
            return fileNameList;
        }
        for (File listFile : Objects.requireNonNull(file.listFiles())) {
            final String absolutePath = listFile.getAbsolutePath();
            if(listFile.isFile() && !FileFilter.javaFilenameFilter(absolutePath)) {
                fileNameList.add(absolutePath);
            }
        }
        return fileNameList;
    }

}
