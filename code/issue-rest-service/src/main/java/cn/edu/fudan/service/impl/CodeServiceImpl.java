package cn.edu.fudan.service.impl;

import cn.edu.fudan.service.CodeService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.LineIterator;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ResetCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.internal.storage.file.FileRepository;
import org.eclipse.jgit.lib.Repository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.HashMap;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc Code management
 * @date 2023/3/3 14:49
 */
@Slf4j
@Service
public class CodeServiceImpl implements CodeService {
    @Value("${repoPrefix}")
    private String repoPrefix;


    private final LRUCache<HashMap<String, String>> fileCache = new LRUCache<>(10);

    @Override
    public HashMap<String, String> getFileContent(String repoUuid, String commitId, String filePath, int start, int end) throws NullPointerException, GitAPIException {
        String keyForCache = repoUuid + commitId + filePath + start + end;
        File file;

        HashMap<String, String> map = fileCache.get(keyForCache);
        if (map != null) {
            log.info("CODE-SERVICE/FILE: cache");
            return map;
        }

        String repoPath = repoPrefix + File.separator + repoUuid;
        log.info("CODE-SERVICE/FILE: " + repoPath + "/" + filePath + ", version: " + commitId);
        Git git = getGit(repoPath);
        assert git != null;
        git.checkout().setStartPoint(commitId).addPath(filePath).call();

        file = new File(repoPath + File.separator + filePath);
        HashMap<String, String> result = getWantedFileContentNew(file, start, end);

        fileCache.put(keyForCache, result);
        git.reset().setMode(ResetCommand.ResetType.HARD).call();
        return result;
    }


    private HashMap<String, String> getWantedFileContentNew(File file, int start, int end) {
        HashMap<String, String> result = new HashMap<>(3);
        StringBuilder content = new StringBuilder();
        LineIterator myReader = null;
        try {
            myReader = FileUtils.lineIterator(file, "UTF-8");
            int count = 0;
            while (myReader.hasNext()) {
                if (count++ >= start && count <= end) {
                    content.append(myReader.nextLine()).append("\n");
                } else {
                    myReader.nextLine();
                }
            }
            result.put("line", count + "");
        } catch (Exception e) {
            log.error("CODE-SERVICE/FILE: " + e.getMessage());
        } finally {
            if (myReader != null) {
                myReader.close();
            }
        }
        result.put("data", content.toString());
        return result;
    }

    private Git getGit(String repoDir) {
        File repoGitDir = new File(repoDir + "/.git");
        if (!repoGitDir.exists()) {
            log.error("Error! Not Exists : " + repoGitDir.getAbsolutePath());
        } else {
            try (Repository repo = new FileRepository(repoGitDir.getAbsolutePath());) {
                return new Git(repo);
            } catch (Exception e) {
                log.error(e.getMessage() + " : " + repoGitDir.getAbsolutePath());
            }
        }
        return null;
    }

    static class LRUCache<T> {
        HashMap<String, Node> map;
        int capacity;

        class Node {
            String key;
            T value;
            Node left;
            Node right;

            Node(String key, T value) {
                this.key = key;
                this.value = value;
            }
        }

        Node head = new Node("", null);
        Node tail = new Node("", null);

        public LRUCache(int capacity) {
            this.capacity = capacity;
            map = new HashMap<>(capacity);
            head.right = tail;
            tail.left = head;
        }

        public void put(String key, T value) {
            if (map.containsKey(key)) {
                Node node = map.get(key);
                node.value = value;

                updateToHead(node);
            } else {
                if (map.size() == capacity) {
                    Node lastNode = tail.left;
                    deleteKey(lastNode);
                    map.remove(lastNode.key);
                }

                Node node = new Node(key, value);
                map.put(key, node);
                putToHead(node);
            }
        }


        public T get(String key) {
            if (map.containsKey(key)) {
                Node node = map.get(key);
                updateToHead(node);
                return node.value;
            }
            return null;
        }

        private void deleteKey(Node node) {
            node.left.right = node.right;
            node.right.left = node.left;
        }

        private void putToHead(Node node) {
            node.left = head;
            node.right = head.right;
            node.left.right = node;
            node.right.left = node;
        }

        private void updateToHead(Node node) {
            deleteKey(node);
            putToHead(node);
        }


    }
}
