package cn.edu.fudan.issueservice.handler;

import com.alibaba.fastjson.JSONObject;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * mapper里json型字段到类的映射。 用法一: 入库：#{jsonDataField,
 * typeHandler=cn.edu.fudan.issueservice.handler.JsonTypeHandler} 出库： <resultMap> <result
 * property="jsonDataField" column="json_data_field" javaType="com.xxx.MyClass"
 * typeHandler=cn.edu.fudan.issueservice.handler.JsonTypeHandler"/> </resultMap>
 *
 * <p>用法二： 1）在mybatis-config.xml中指定handler: <typeHandlers> <typeHandler
 * handler="cn.edu.fudan.issueservice.handler.JsonTypeHandler" javaType="com.xxx.MyClass"/>
 * </typeHandlers> 2)在MyClassMapper.xml里直接select/update/insert。
 *
 * @author zjf
 * @author fancying
 */
public class JsonTypeHandler extends BaseTypeHandler<JSONObject> {

    /**
     * 用于定义在Mybatis设置参数时该如何把Java类型的参数转换为对应的数据库类型
     *
     * @param preparedStatement 当前的PreparedStatement对象
     * @param i                 当前参数的位置
     * @param objects           当前参数的Java对象
     * @param jdbcType          当前参数的数据库类型
     */
    @Override
    public void setNonNullParameter(PreparedStatement preparedStatement, int i, JSONObject objects, JdbcType jdbcType) throws SQLException {
        preparedStatement.setString(i, String.valueOf(objects.toJSONString()));
    }

    /**
     * 用于在Mybatis获取数据结果集时如何把数据库类型转换为对应的Java类型
     *
     * @param resultSet  当前的结果集
     * @param columnName 当前的字段名称
     * @return 转换后的Java对象
     */
    @Override
    public JSONObject getNullableResult(ResultSet resultSet, String columnName) throws SQLException {
        String sqlJson = resultSet.getString(columnName);
        if (null != sqlJson) {
            return JSONObject.parseObject(sqlJson);
        }
        return null;
    }

    /**
     * 用于在Mybatis通过字段位置获取字段数据时把数据库类型转换为对应的Java类型
     *
     * @param resultSet   当前的结果集
     * @param columnIndex 当前字段的位置
     * @return 转换后的Java对象
     */
    @Override
    public JSONObject getNullableResult(ResultSet resultSet, int columnIndex) throws SQLException {
        String sqlJson = resultSet.getString(columnIndex);
        if (null != sqlJson) {
            return JSONObject.parseObject(sqlJson);
        }
        return null;
    }

    /**
     * 用于Mybatis在调用存储过程后把数据库类型的数据转换为对应的Java类型
     *
     * @param callableStatement 当前的CallableStatement执行后的CallableStatement
     * @param columnIndex       当前输出参数的位置
     * @return null
     */
    @Override
    public JSONObject getNullableResult(CallableStatement callableStatement, int columnIndex) throws SQLException {
        String sqlJson = callableStatement.getString(columnIndex);
        if (null != sqlJson) {
            return JSONObject.parseObject(sqlJson);
        }
        return null;
    }
}