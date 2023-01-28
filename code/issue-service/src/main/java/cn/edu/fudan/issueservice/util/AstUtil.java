package cn.edu.fudan.issueservice.util;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Beethoven
 */
public class AstUtil {

    public static String getCode(int startLine, int endLine, String filePath) {
        StringBuilder code = new StringBuilder();
        String s = "";
        int line = 1;
        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(filePath))) {
            while ((s = bufferedReader.readLine()) != null) {
                if (line >= startLine && line <= endLine) {
                    code.append(s);
                    code.append("\n");
                }
                line++;
                if (line > endLine) {
                    break;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return code.toString();
    }

    public static List<String> getCodeList(List<Integer> startLines, List<Integer> endLines, String filePath) {
        List<String> codes = new ArrayList<>();
        final int size = startLines.size();
        StringBuilder code;
        String s = "";
        int line = 1;
        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(filePath))) {
            for (int i = 0; i < size; i++) {
                final Integer startLine = startLines.get(i);
                final Integer endLine = endLines.get(i);
                code = new StringBuilder();
                while ((s = bufferedReader.readLine()) != null) {
                    if (line >= startLine && line <= endLine) {
                        code.append(s);
                        code.append("\n");
                    }
                    line++;
                    if (line > endLine) {
                        break;
                    }
                }
                codes.add(code.toString());
            }
        } catch (IOException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
        return codes;
    }

    public static int getCodeLines(String filePath) {
        int result = 0;
        try (BufferedReader bufferedReader = new BufferedReader(new FileReader(filePath))) {
            while (bufferedReader.readLine() != null) {
                result++;
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return result;
    }
}
