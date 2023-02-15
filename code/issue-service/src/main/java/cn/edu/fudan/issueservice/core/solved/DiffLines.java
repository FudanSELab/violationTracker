package cn.edu.fudan.issueservice.core.solved;

import difflib.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.*;

/**
 * description:
 *
 * @author fancying create at 10/5/2022
 **/
@Getter
@Setter
@Slf4j
@AllArgsConstructor
public class DiffLines {
    List<Integer> newLines;
    List<Integer> deleteLines;

    List<Integer> preChangeLines;
    List<Integer> cruChangeLines;

    /**
     * 可暂时不填
     */
    Map<List<Integer>, List<Integer>> changeLineMap;

    public static DiffLines analyzeDiffLines(String preAbsoluteFilePath, String curAbsoluteFilePath) throws IOException {
        List<Integer> newLines = new ArrayList<>();
        List<Integer> deleteLines = new ArrayList<>();
        List<Integer> preChangeLines = new ArrayList<>();
        List<Integer> curChangeLines = new ArrayList<>();
        Map<List<Integer>, List<Integer>> changeLineMap = new HashMap<>(32);

        // 从第 0行 开始读取 第1行识别为第0行
        List<String> original = FileUtils.readLines(new File(preAbsoluteFilePath), String.valueOf(Charset.defaultCharset()));
        List<String> revised = FileUtils.readLines(new File(curAbsoluteFilePath), String.valueOf(Charset.defaultCharset()));

        Patch<String> patch = DiffUtils.diff(original, revised);

        for (Delta<String> delta : patch.getDeltas()) {
            int preBeginLine = delta.getOriginal().getPosition() + 1;
            int curBeginLine = delta.getRevised().getPosition() + 1;

            if (Delta.TYPE.CHANGE.equals(delta.getType())) {
                List<Integer> pre = new ArrayList<>();
                List<Integer> cur = new ArrayList<>();
                for (int i = 0; i < delta.getOriginal().getLines().size(); i++) {
                    preChangeLines.add(preBeginLine + i);
                    pre.add(curBeginLine + i);
                }
                for (int i = 0; i < delta.getRevised().getLines().size(); i++) {
                    curChangeLines.add(curBeginLine + i);
                    cur.add(curBeginLine + i);
                }
                changeLineMap.put(pre, cur);
                continue;
            }

            if (Delta.TYPE.INSERT.equals(delta.getType())) {
                for (int i = 0; i < delta.getRevised().getLines().size(); i++) {
                    newLines.add(curBeginLine + i);
                }
                continue;
            }

            if (Delta.TYPE.DELETE.equals(delta.getType())) {
                for (int i = 0; i < delta.getOriginal().getLines().size(); i++) {
                    deleteLines.add(preBeginLine + i);
                }
                continue;
            }
            // 下面的代码应该运行不到
            log.error("unknown Delta.TYPE {}", delta.getType());
        }

        return new DiffLines(newLines, deleteLines, preChangeLines, curChangeLines, changeLineMap);
    }

//  public static void main(String[] args) {
//
//    String file1 = "E:\\pom.xml";
//    String file2 = "E:\\pom2.xml";
//    try {
//      DiffLines diffLines = analyzeDiffLines(file1, file2);
//      System.out.println(diffLines.getPreChangeLines().size());
//    } catch (IOException e) {
//      e.printStackTrace();
//    }
//  }

}