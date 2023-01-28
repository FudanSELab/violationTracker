package cn.edu.fudan.issueservice.util.stat;

import cn.edu.fudan.issueservice.domain.dbo.LogicalStatement;
import cn.edu.fudan.issueservice.util.JavaAstParserUtil;
import cn.edu.fudan.issueservice.util.StringsUtil;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.PackageDeclaration;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.comments.BlockComment;
import com.github.javaparser.ast.comments.Comment;
import com.github.javaparser.ast.comments.JavadocComment;
import com.github.javaparser.ast.comments.LineComment;
import com.github.javaparser.ast.expr.*;
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.IntStream;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc 获取逻辑行
 * @date 2022-09-26 14:20
 */
@Slf4j
public class LogicalStatementRule extends VoidVisitorAdapter<Object> {
    // 物理行
    private Map<Integer, String> lineMap;
    // 文件路径
    private String filePath;
    // 逻辑行
    private List<LogicalStatement> logicalStatements;
    private CompilationUnit cu;
    // 最大 begin line
    private int maxLine;
    // 包名
    private String pkgName;

    private final int MAX_CONTENT_SIZE = 1024;

    public LogicalStatementRule(String filePath, Integer beginLine, Integer endLine, Integer offset) {
        this(filePath, List.of(beginLine), List.of(endLine), List.of(offset));
    }

    public LogicalStatementRule(String filePath, List<Integer> beginLines, List<Integer> endLines, List<Integer> offsets) {
        this.filePath = filePath;
        this.lineMap = new HashMap<>(32);
        try {
            ParserConfiguration configuration = new ParserConfiguration();
            configuration.setCharacterEncoding(StandardCharsets.UTF_8);
            ParseResult<CompilationUnit> parseResult = new JavaParser(configuration).parse(Paths.get(filePath));
            this.cu = parseResult.getResult().isPresent() ? parseResult.getResult().get() : null;
        } catch (FileNotFoundException e) {
            log.error("lost file: {}", filePath);
        } catch (IOException e) {
            log.error("javaparser parse failed: {}", StringsUtil.firstLine(e.getMessage()));
        }
        initLineMap();
        initLogicalStatements(filePath, beginLines, endLines, offsets);
        this.maxLine = getMaxLine(logicalStatements);
        if (this.cu == null) {
            checkContent();
            checkAnchor();
        } else {
            this.cu.accept(this, null);
        }
    }

    public LogicalStatement getLogicalStatement(int beginLine, int offset) {
        checkContent();
        checkAnchor();
        LogicalStatement logicalStatement = LogicalStatement.builder().filePath(filePath).beginLine(beginLine).offset(offset + 1).build();
        for (LogicalStatement statement : logicalStatements) {
            if (logicalStatement.equals(statement)) {
                return statement;
            }
        }
        return null;
    }

    public List<LogicalStatement> getLogicalStatements() {
        checkContent();
        checkAnchor();
        return logicalStatements;
    }

    /**
     * 空行、token 错位等情况拿不到正确逻辑行，使用物理行
     */
    private void checkContent() {
        for (LogicalStatement stat : logicalStatements) {
            // 超过 1024 字节更改code的获取方式为获取物理行
            int len = stat.getContent() == null ? 0 : stat.getContent().getBytes(StandardCharsets.UTF_8).length;
            if (stat.getContent() == null || (len > MAX_CONTENT_SIZE ||
                    (!stat.getHit() && stat.getIsBlock()))) {
                log.debug("path is {}, startLine:{} endLine:{} startToken:{}", filePath,
                        stat.getBeginLine(), stat.getEndLine(), stat.getOffset());
                log.debug("failed to get logical code, code length is {}, logical code: {} ...",
                        len, StringsUtil.firstLine(stat.getContent()));
                StringBuilder sb = new StringBuilder();
                for (int i = stat.getBeginLine(); i <= stat.getEndLine(); i++) {
                    sb.append(lineMap.get(i)).append("\n");
                }
                stat.setContent(sb.toString());
                log.debug("try to get physical code, physical code: {}", sb);
            }
        }
    }

    /**
     * 空行、注释行等可能拿不到 anchor node 信息，单独处理
     */
    private void checkAnchor() {
        List<Integer> idxs = new ArrayList<>();
        List<Integer> beginLines = new ArrayList<>();
        for (int i = 0; i < logicalStatements.size(); i++) {
            if (logicalStatements.get(i).getAnchorName() == null) {
                idxs.add(i);
                beginLines.add(logicalStatements.get(i).getBeginLine());
            }
        }
        final List<Object[]> anchors = JavaAstParserUtil.findMethodNameAndOffsetList(cu, beginLines, beginLines);
        int count = 0;
        for (int idx : idxs) {
            logicalStatements.get(idx).setAnchorName((String) anchors.get(count)[0]);
            logicalStatements.get(idx).setAnchorOffset((Integer) anchors.get(count++)[1]);
        }
    }

    /**
     * 初始化物理行信息
     */
    private void initLineMap() {
        // fixme 单独处理 0 行为 空
        lineMap.put(0, "");

        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(filePath)))) {
            int l = 1;
            String line;
            while ((line = br.readLine()) != null) {
                this.lineMap.put(l++, line);
            }
        } catch (IOException e) {
            log.error("file read failed: {}", filePath);
        }
    }

    /**
     * 初始化逻辑行位置信息
     *
     * @param filePath
     * @param beginLines
     * @param endLines
     * @param offsets
     */
    private void initLogicalStatements(String filePath, List<Integer> beginLines, List<Integer> endLines, List<Integer> offsets) {
        this.logicalStatements = new ArrayList<>();
        if (beginLines == null || offsets == null ||
                beginLines.isEmpty() || offsets.isEmpty() ||
                beginLines.size() < offsets.size()) return;
        for (int i = 0; i < beginLines.size(); i++) {
            LogicalStatement statement = LogicalStatement.builder()
                    .filePath(filePath)
                    .beginLine(beginLines.get(i))
                    .endLine(endLines.get(i))
                    .offset(offsets.get(i) + 1)
                    .build();
            // 单独处理注释行、to do行
            if (lineMap.get(statement.getBeginLine()).trim().startsWith("//")) {
                statement.setContent(lineMap.get(statement.getBeginLine()));
                statement.setHit(true);
                statement.setIsBlock(false);
            }
            this.logicalStatements.add(statement);
        }
        if (cu != null) {
            // 不能体现在ast中的注释（无代码上下文），单独处理
            List<Comment> commentList = cu.findAll(Comment.class);
            for (Comment comment : commentList) {
                if (comment.getRange().isPresent()) {
                    int start = comment.getRange().get().begin.line;
                    int end = comment.getRange().get().end.line;
                    for (LogicalStatement stat : logicalStatements) {
                        if (!Boolean.TRUE.equals(stat.getHit()) && stat.getBeginLine() >= start && stat.getBeginLine() <= end) {
                            stat.setContent(lineMap.get(stat.getBeginLine()));
                            stat.setHit(true);
                            stat.setNode(comment);
                            stat.setIsBlock(false);
                        }
                    }
                }
            }
        }
    }


    /**
     * 匹配包含起始行 beginLines 的逻辑语句
     *
     * @param node
     */
    private void findHitStatement(Node node, String anchorName, int anchorLine, String className) {
        if (node.getRange().isPresent()) {
            int begin = node.getRange().get().begin.line;
            int end = node.getRange().get().end.line;
            if (begin > maxLine && node.getComment().isPresent() && node.getComment().get().getRange().isPresent() &&
                    node.getComment().get().getRange().get().begin.line > maxLine) {
                return;
            }
            String line = lineMap.get(begin);
            String fullCode = node.getTokenRange().isPresent() ? node.getTokenRange().get().toString() : "";
            String content = "";
            NextNodeRule nextNodeRule = new NextNodeRule();
            node.accept(nextNodeRule, null);
            for (LogicalStatement stat : logicalStatements) {
                if (stat.getContent() == null || !stat.getHit()) {
                    if (stat.getBeginLine().equals(begin) && stat.getOffset() >= node.getRange().get().begin.column) {
                        // 起始行相同
                        int endIdx = line.length();
                        if (nextNodeRule.isCurrentIsBlock()) {
                            Node next = nextNodeRule.getNext();
                            if (next != null && next.getRange().isPresent()) {
                                // 格式不规范，双语句并行，只取当前语句
                                endIdx = next.getRange().get().begin.line == begin ? next.getRange().get().begin.column : endIdx;
                                String nextFullCode = next.getTokenRange().isPresent() ? next.getTokenRange().get().toString() : "";
                                String truncateCode = nextFullCode.startsWith("{") ?
                                        nextFullCode.substring(1) : nextFullCode;
                                content = fullCode.substring(0, fullCode.indexOf(truncateCode));
                                if (content.trim().isEmpty() || content.trim().equals("{")) {
                                    content = stat.getContent();
                                }
                            } else if (next == null) {
                                endIdx = node.getRange().get().end.column;
                                content = fullCode;
                            }
                            stat.setIsBlock(true);
                        } else {
                            if (begin == end) {
                                // 存在格式不规范，双语句并行，只取当前语句
                                endIdx = node.getRange().get().end.column;
                            }
                            content = fullCode;
                            stat.setIsBlock(false);
                        }
                        stat.setNode(node);
                        stat.setHit(stat.getOffset() <= endIdx);
                        stat.setContent(content);
                        stat.setPackageName(pkgName);
                        if (anchorName != null) {
                            stat.setAnchorName(anchorName);
                            stat.setAnchorLine(anchorLine);
                        }
                        if (className != null) {
                            stat.setClassName(className);
                        }
                    } else if (stat.getBeginLine() > begin && stat.getBeginLine() <= end) {
                        // line包含在逻辑语句内
                        stat.setNode(node);
                        stat.setHit(false);
                        stat.setContent(node.getTokenRange().isPresent() ? node.getTokenRange().get().toString() : "");
                        stat.setPackageName(pkgName);
                        if (nextNodeRule.isCurrentIsBlock()) {
                            Node next = nextNodeRule.getNext();
                            if ((next != null && next.getRange().isPresent()) &&
                                    (stat.getBeginLine() < next.getRange().get().begin.line ||
                                            (stat.getBeginLine().equals(next.getRange().get().begin.line) &&
                                                    stat.getOffset() <= next.getRange().get().begin.column))) {
                                String nextFullCode = next.getTokenRange().isPresent() ? next.getTokenRange().get().toString() : "";
                                String truncateCode = nextFullCode.startsWith("{") ?
                                        nextFullCode.substring(1) : nextFullCode;
                                content = fullCode.substring(0, fullCode.indexOf(truncateCode));
                                stat.setContent(content);
                            }
                            stat.setIsBlock(true);
                        } else {
                            stat.setIsBlock(false);
                        }
                        if (anchorName != null) {
                            stat.setAnchorName(anchorName);
                            stat.setAnchorLine(anchorLine);
                        }
                        if (className != null) {
                            stat.setClassName(className);
                        }
                    }
                }
            }
        }
    }

    /**
     * 最大 begin line
     *
     * @param statements
     * @return
     */
    private int getMaxLine(List<LogicalStatement> statements) {
        OptionalInt max = statements.stream().flatMapToInt(statement -> IntStream.of(statement.getBeginLine())).max();
        return max.isPresent() ? max.getAsInt() : Integer.MAX_VALUE;
    }


    @Override
    public void visit(PackageDeclaration n, Object arg) {
        this.pkgName = n.getNameAsString();
        findHitStatement(n, n.getNameAsString(), n.getRange().isPresent() ? n.getRange().get().begin.line : 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ImportDeclaration n, Object arg) {
        findHitStatement(n, n.getNameAsString(), n.getRange().isPresent() ? n.getRange().get().begin.line : 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(EnumDeclaration n, Object arg) {
        findHitStatement(n, "enum " + n.getNameAsString(),
                n.getRange().isPresent() ? n.getRange().get().begin.line : 0, n.getNameAsString());
        super.visit(n, arg);
    }

    @Override
    public void visit(ClassOrInterfaceDeclaration n, Object arg) {
        String name = n.isInterface() ? "interface " : "class ";
        findHitStatement(n, name + n.getNameAsString(),
                n.getRange().isPresent() ? n.getRange().get().begin.line : 0, n.getNameAsString());
        super.visit(n, arg);
    }


    @Override
    public void visit(InitializerDeclaration n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(AnnotationDeclaration n, Object arg) {
        findHitStatement(n, "@interface " + n.getNameAsString(),
                n.getRange().isPresent() ? n.getRange().get().begin.line : 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ConstructorDeclaration n, Object arg) {
        findHitStatement(n, n.getSignature().toString(),
                n.getRange().isPresent() ? n.getRange().get().begin.line : 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(EnumConstantDeclaration n, Object arg) {
        findHitStatement(n, n.getNameAsString(), n.getRange().isPresent() ? n.getRange().get().begin.line : 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(MethodDeclaration n, Object arg) {
        findHitStatement(n, n.getSignature().toString(), n.getRange().isPresent() ? n.getRange().get().begin.line : 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(FieldDeclaration n, Object arg) {
        StringBuilder simpleName = new StringBuilder();
        for (VariableDeclarator variableDeclarator : n.getVariables()) {
            simpleName.append(variableDeclarator.getNameAsString());
            simpleName.append(" ");
        }
        findHitStatement(n, simpleName.toString().trim(), n.getRange().isPresent() ? n.getRange().get().begin.line : 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(AssertStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(BlockStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(BreakStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(CatchClause n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ContinueStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(DoStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(EmptyStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ExplicitConstructorInvocationStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ExpressionStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ForStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ForEachStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(IfStmt n, Object arg) {
        if (n.getElseStmt().isPresent()) {
            int ifEnd = n.getThenStmt().getRange().isPresent() ? n.getThenStmt().getRange().get().end.line : 0;
            int elStart = n.getElseStmt().get().getRange().isPresent() ? n.getElseStmt().get().getRange().get().begin.line : 0;
            if (ifEnd > 0 && elStart > 0) {
                for (LogicalStatement statement : logicalStatements) {
                    if (!Boolean.TRUE.equals(statement.getHit()) && statement.getBeginLine() >= ifEnd && statement.getBeginLine() <= elStart) {
                        statement.setContent(lineMap.get(statement.getBeginLine()));
                        statement.setHit(true);
                        statement.setNode(n.getElseStmt().get());
                    }
                }
            }
        }
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(LabeledStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(LocalClassDeclarationStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ReturnStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(SwitchStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(SwitchEntry n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(SynchronizedStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ThrowStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(TryStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(UnparsableStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(WhileStmt n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(LambdaExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ObjectCreationExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ArrayAccessExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ArrayCreationExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ArrayInitializerExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(AssignExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(BinaryExpr n, Object arg) {
//        findHitStatement(n, null, 0, null);
//        super.visit(n, arg);
    }

    @Override
    public void visit(BooleanLiteralExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(CastExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(CharLiteralExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ClassExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ConditionalExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(DoubleLiteralExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(EnclosedExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(FieldAccessExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(InstanceOfExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(IntegerLiteralExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(LongLiteralExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(MarkerAnnotationExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(MethodCallExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(MethodReferenceExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(NameExpr n, Object arg) {
//        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(NormalAnnotationExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(NullLiteralExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(SingleMemberAnnotationExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(StringLiteralExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(SuperExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(ThisExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(TypeExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(UnaryExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(VariableDeclarationExpr n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(BlockComment n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(JavadocComment n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }

    @Override
    public void visit(LineComment n, Object arg) {
        findHitStatement(n, null, 0, null);
        super.visit(n, arg);
    }
}
