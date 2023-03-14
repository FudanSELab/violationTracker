package cn.edu.fudan.issueservice.handler;

import com.alibaba.fastjson.JSONObject;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Map the json-type fields in the mapper file to instances of the class.
 * 1. Insert data: #{jsonDataField,
 * typeHandler=cn.edu.fudan.issueservice.handler.JsonTypeHandler}
 * 2. Select data: <resultMap> <result
 * property="jsonDataField" column="json_data_field" javaType="com.xxx.MyClass"
 * typeHandler=cn.edu.fudan.issueservice.handler.JsonTypeHandler"/> </resultMap>
 *
 * <p> 1）mybatis-config.xml: <typeHandlers> <typeHandler
 * handler="cn.edu.fudan.issueservice.handler.JsonTypeHandler" javaType="com.xxx.MyClass"/>
 * </typeHandlers>
 * 2) MyClassMapper.xml: select/update/insert。
 *
 * @author zjf
 * @author fancying
 */
public class JsonTypeHandler extends BaseTypeHandler<JSONObject> {

    /**
     * Used to define how to convert Java type parameters to the corresponding database type when setting parameters in Mybatis
     *
     * @param preparedStatement The current PreparedStatement object
     * @param i                 The position of the current parameter
     * @param objects           The Java object for the current parameter
     * @param jdbcType          The database type of the current parameter
     */
    @Override
    public void setNonNullParameter(PreparedStatement preparedStatement, int i, JSONObject objects, JdbcType jdbcType) throws SQLException {
        preparedStatement.setString(i, String.valueOf(objects.toJSONString()));
    }

    /**
     * Used to convert the database type to the corresponding Java type when Mybatis retrieves the data result set
     *
     * @param resultSet  result set
     * @param columnName column name
     * @return Java Object
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
     * Used to convert the database type to the corresponding Java type when Mybatis gets field data through the field location
     *
     * @param resultSet   result set
     * @param columnIndex column index
     * @return Java Object
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
     * Used to convert database type data to the corresponding Java type after calling a stored procedure
     *
     * @param callableStatement CallableStatement
     * @param columnIndex       column index
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