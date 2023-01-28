package cn.edu.fudan.issueservice.util.stat;

import com.github.javaparser.ast.ImportDeclaration;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.PackageDeclaration;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.*;
import com.github.javaparser.ast.stmt.*;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;

/**
 * @author Jerry Zhang <zhangjian16@fudan.edu.cn>
 * @desc 下一个子节点
 * @date 2022-09-26 15:09
 */
public class NextNodeRule extends VoidVisitorAdapter<Object> {
    private boolean currentIsBlock;
    private Node next;

    public NextNodeRule() {
        this.next = null;
        this.currentIsBlock = false;
    }

    public Node getNext() {
        return next;
    }

    public boolean isCurrentIsBlock() {
        return currentIsBlock;
    }

    @Override
    public void visit(PackageDeclaration n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ImportDeclaration n, Object arg) {
        check(n);
    }

    @Override
    public void visit(EnumDeclaration n, Object arg) {
        isBlock(n.getEntries().isEmpty() ? null : n.getEntry(0));
    }

    @Override
    public void visit(ClassOrInterfaceDeclaration n, Object arg) {
        isBlock(n.getMembers().isEmpty() ? null : n.getMember(0));
    }


    @Override
    public void visit(InitializerDeclaration n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(AnnotationDeclaration n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ConstructorDeclaration n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(EnumConstantDeclaration n, Object arg) {
        isBlock(n.getClassBody().isEmpty() ? null : n.getClassBody().get(0));
    }

    @Override
    public void visit(MethodDeclaration n, Object arg) {
        isBlock(n.getBody().isPresent() ? n.getBody().get() : null);
    }

    @Override
    public void visit(AssertStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(BlockStmt n, Object arg) {
        isBlock(n.getStatements().isEmpty() ? null : n.getStatement(0));
    }

    @Override
    public void visit(BreakStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(CatchClause n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(ContinueStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(DoStmt n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(EmptyStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ExplicitConstructorInvocationStmt n, Object arg) {
        isBlock(n.getArguments().isEmpty() ? null : n.getArgument(0));
    }

    @Override
    public void visit(ExpressionStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ForStmt n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(ForEachStmt n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(IfStmt n, Object arg) {
        isBlock(n.getThenStmt());
    }

    @Override
    public void visit(LabeledStmt n, Object arg) {
        isBlock(n.getStatement());
    }

    @Override
    public void visit(LocalClassDeclarationStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ReturnStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(SwitchStmt n, Object arg) {
        isBlock(n.getEntries().isEmpty() ? null : n.getEntry(0));
    }

    public void visit(SwitchEntry n, Object arg) {
        isBlock(n.getStatements().isEmpty() ? null : n.getStatement(0));
    }

    @Override
    public void visit(SynchronizedStmt n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(ThrowStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(TryStmt n, Object arg) {
        isBlock(n.getTryBlock());
    }

    @Override
    public void visit(UnparsableStmt n, Object arg) {
        check(n);
    }

    @Override
    public void visit(WhileStmt n, Object arg) {
        isBlock(n.getBody());
    }

    @Override
    public void visit(LambdaExpr n, Object arg) {
        isBlock(n.getChildNodes().size() <= 1 ? null : n.getChildNodes().get(1));
    }

    @Override
    public void visit(ObjectCreationExpr n, Object arg) {
        isBlock(n.getChildNodes().size() <= 1 ? null : n.getChildNodes().get(1));
    }

    @Override
    public void visit(ArrayAccessExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ArrayCreationExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ArrayInitializerExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(AssignExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(BinaryExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(BooleanLiteralExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(CastExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(CharLiteralExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ClassExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ConditionalExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(DoubleLiteralExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(EnclosedExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(FieldAccessExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(InstanceOfExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(IntegerLiteralExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(LongLiteralExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(MarkerAnnotationExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(MethodCallExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(MethodReferenceExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(NameExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(NormalAnnotationExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(NullLiteralExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(SingleMemberAnnotationExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(StringLiteralExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(SuperExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(ThisExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(TypeExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(UnaryExpr n, Object arg) {
        check(n);
    }

    @Override
    public void visit(VariableDeclarationExpr n, Object arg) {
        check(n);
    }

    private void isBlock(Node next) {
        this.currentIsBlock = true;
        this.next = next;
    }

    private void check(Node node) {
        if (node.toString().contains("{")) {
            BlockStmt obj = null;
            LambdaExpr lambda = null;
            if (!node.findAll(InitializerDeclaration.class).isEmpty()) {
                obj = node.findAll(InitializerDeclaration.class).get(0).getBody();
            }
            if (!node.findAll(LambdaExpr.class).isEmpty()) {
                lambda = node.findAll(LambdaExpr.class).get(0);
            }
            if (obj != null && lambda == null) {
                isBlock(obj);
            } else if (obj == null && lambda != null) {
                isBlock(lambda);
            } else if (obj != null && obj.getRange().isPresent() && lambda.getRange().isPresent()) {
                if (obj.getRange().get().begin.line > lambda.getRange().get().begin.line) {
                    isBlock(lambda);
                } else if (obj.getRange().get().begin.line < lambda.getRange().get().begin.line) {
                    isBlock(obj);
                } else if (obj.getRange().get().begin.column > lambda.getRange().get().begin.column) {
                    isBlock(lambda);
                } else {
                    isBlock(obj);
                }
            }else {
                isBlock(node.getChildNodes().isEmpty() ? null : node.getChildNodes().get(0));
            }
        } else {
            this.currentIsBlock = false;
        }
    }
}
