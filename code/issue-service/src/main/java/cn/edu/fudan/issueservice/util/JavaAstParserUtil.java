package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.issueservice.domain.dbo.RawIssueMatchInfo;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.*;
import lombok.extern.slf4j.Slf4j;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * @author fancying
 * @author Jerry Zhang
 */
@Slf4j
public class JavaAstParserUtil {

    private static final Map<String, CompilationUnit> COMPILATION_UNIT_CACHE = new WeakHashMap<>(8);

    // Batch get the method name and offset where the violation is located
    public static List<Object[]> findMethodNameAndOffsetList(CompilationUnit compilationUnit, List<Integer> beginLines, List<Integer> endLines) {
        try {
            // When endLines is empty, you do not need to get the method name and offset
            if (endLines.isEmpty()) {
                return new ArrayList<>();
            }
            List<Object[]> ans = new ArrayList<>();
            for (int i = 0; i < beginLines.size(); i++) {
                int beginLine = beginLines.get(i);
                int endLine = endLines.get(i);
                ans.add(findMethodNameAndOffset(compilationUnit, beginLine, endLine));
            }
            return ans;
        } catch (Exception e) {
            log.error(e.getMessage());
            return new ArrayList<>();
        }
    }

    private static Object[] findMethodNameAndOffset(CompilationUnit compilationUnit, Integer beginLine, Integer endLine) {
        // Method
        List<MethodDeclaration> methodDeclarations = compilationUnit.findAll(MethodDeclaration.class);
        for (MethodDeclaration methodDeclaration : methodDeclarations) {
            if (methodDeclaration.getRange().isPresent()) {
                int begin = methodDeclaration.getRange().get().begin.line;
                int end = methodDeclaration.getRange().get().end.line;
                if (beginLine >= begin && endLine <= end) {
                    return new Object[]{methodDeclaration.getSignature().toString(), beginLine - begin};
                }
            }
        }
        List<ClassOrInterfaceDeclaration> classOrInterfaceDeclarationList = compilationUnit.findAll(ClassOrInterfaceDeclaration.class);
        // Enum
        if (classOrInterfaceDeclarationList.isEmpty()) {
            List<EnumConstantDeclaration> enumConstantDeclarationList = compilationUnit.findAll(EnumConstantDeclaration.class);
            for (EnumConstantDeclaration enumConstantDeclaration : enumConstantDeclarationList) {
                if (enumConstantDeclaration.getRange().isPresent()) {
                    int begin = enumConstantDeclaration.getRange().get().begin.line;
                    int end = enumConstantDeclaration.getRange().get().end.line;
                    if (beginLine >= begin && endLine <= end) {
                        return new Object[]{"enum " + enumConstantDeclaration.getNameAsString(), beginLine - begin};
                    }
                }
            }
        } else {
            for (ClassOrInterfaceDeclaration classOrInterfaceDeclaration : classOrInterfaceDeclarationList) {
                // Constructor
                List<ConstructorDeclaration> constructorDeclarations = classOrInterfaceDeclaration.findAll(ConstructorDeclaration.class);
                for (ConstructorDeclaration constructorDeclaration : constructorDeclarations) {
                    if (constructorDeclaration.getRange().isPresent()) {
                        int begin = constructorDeclaration.getRange().get().begin.line;
                        int end = constructorDeclaration.getRange().get().end.line;
                        if (beginLine >= begin && endLine <= end) {
                            return new Object[]{constructorDeclaration.getSignature().toString(), beginLine - begin};
                        }
                    }
                }
                // Field
                List<FieldDeclaration> fieldDeclarations = classOrInterfaceDeclaration.findAll(FieldDeclaration.class);
                for (FieldDeclaration fieldDeclaration : fieldDeclarations) {
                    if (fieldDeclaration.getRange().isPresent()) {
                        int begin = fieldDeclaration.getRange().get().begin.line;
                        int end = fieldDeclaration.getRange().get().end.line;
                        if (beginLine >= begin && endLine <= end) {
                            StringBuilder simpleName = new StringBuilder();
                            for (VariableDeclarator variableDeclarator : fieldDeclaration.getVariables()) {
                                simpleName.append(variableDeclarator.getName());
                                simpleName.append(" ");
                            }
                            return new Object[]{simpleName.toString(), beginLine - begin};
                        }
                    }
                }
            }
            // Class
            for (ClassOrInterfaceDeclaration classOrInterfaceDeclaration : classOrInterfaceDeclarationList) {
                if (classOrInterfaceDeclaration.getRange().isPresent()) {
                    int begin = classOrInterfaceDeclaration.getRange().get().begin.line;
                    int end = classOrInterfaceDeclaration.getRange().get().end.line;
                    if (beginLine >= begin && endLine <= end) {
                        return new Object[]{"class " + classOrInterfaceDeclaration.getNameAsString(),
                                classOrInterfaceDeclaration.getRange().isPresent() ? beginLine - classOrInterfaceDeclaration.getRange().get().begin.line : beginLine};
                    }
                }
            }
        }
        return new Object[]{null, 0};
    }



    private static CompilationUnit analyzeFileToCompilationUnit(String absoluteFilePath) throws IOException{
        if (COMPILATION_UNIT_CACHE.containsKey(absoluteFilePath)) {
            return COMPILATION_UNIT_CACHE.get(absoluteFilePath);
        }
        FileInputStream in = new FileInputStream(absoluteFilePath);
        ParseResult<CompilationUnit> parseResult = new JavaParser().parse(in, StandardCharsets.UTF_8);
        if (parseResult.getResult().isPresent()) {
            COMPILATION_UNIT_CACHE.put(absoluteFilePath, parseResult.getResult().get());
            return parseResult.getResult().get();
        }

        return null;
    }

    public static List<String> getAllClassNamesInFile(String absoluteFilePath) throws IOException {
        CompilationUnit compileUtil = analyzeFileToCompilationUnit(absoluteFilePath);
        if (compileUtil == null) {
            return Collections.emptyList();
        }
        List<String> allClassNamesInFile = new ArrayList<>();

        for (EnumDeclaration e : compileUtil.findAll(EnumDeclaration.class)) {
            allClassNamesInFile.add("enum " + e.getNameAsString());
        }

        for (ClassOrInterfaceDeclaration c : compileUtil.findAll(ClassOrInterfaceDeclaration.class)) {
            allClassNamesInFile.add(c.isInterface() ? "interface " : "class "  + c.getNameAsString());
        }

        return  allClassNamesInFile;
    }


    /**
     * Get all method signatures in the java file
     *
     * @param absoluteFilePath absolute file path
     * @return all method signatures
     */
    public static List<String> getAllMethodsInFile(String absoluteFilePath) throws IOException {
        CompilationUnit compileUtil = analyzeFileToCompilationUnit(absoluteFilePath);
        if (compileUtil == null) {
            return Collections.emptyList();
        }
        List<String> allMethodsInFile = new ArrayList<>();
        List<ClassOrInterfaceDeclaration> classOrInterfaceDeclarations = compileUtil.findAll(ClassOrInterfaceDeclaration.class);
        for (ClassOrInterfaceDeclaration classOrInterfaceDeclaration : classOrInterfaceDeclarations) {
            List<MethodDeclaration> methodDeclarations = classOrInterfaceDeclaration.findAll(MethodDeclaration.class);
            for (MethodDeclaration methodDeclaration : methodDeclarations) {
                String method = methodDeclaration.getSignature().toString();
                allMethodsInFile.add(method);
            }
        }
        return  allMethodsInFile;
    }

    /**
     * Gets the names of all fields in a Java file
     *
     * @param absoluteFilePath absolute file path
     * @return field list
     */
    public static List<String> getAllFieldsInFile(String absoluteFilePath) throws IOException{
        CompilationUnit compileUtil = analyzeFileToCompilationUnit(absoluteFilePath);
        if (compileUtil == null) {
            return Collections.emptyList();
        }
        List<String> allFieldsInFile = new ArrayList<>();
        List<ClassOrInterfaceDeclaration> classOrInterfaceDeclarations = compileUtil.findAll(ClassOrInterfaceDeclaration.class);
        for (ClassOrInterfaceDeclaration classOrInterfaceDeclaration : classOrInterfaceDeclarations) {
            List<FieldDeclaration> fieldDeclarations = classOrInterfaceDeclaration.findAll(FieldDeclaration.class);
            for (FieldDeclaration fieldDeclaration : fieldDeclarations) {
                NodeList<VariableDeclarator> variables = fieldDeclaration.getVariables();
                for (VariableDeclarator variable : variables) {
                    allFieldsInFile.add(variable.getName().toString());
                }
            }
        }
        return allFieldsInFile;
    }



}
