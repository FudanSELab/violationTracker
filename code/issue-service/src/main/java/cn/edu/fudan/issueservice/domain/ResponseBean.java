package cn.edu.fudan.issueservice.domain;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

import java.io.Serializable;

/**
 * @author WZY
 * @version 1.0
 **/
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ApiModel(value = "The structure returned by the API", description = "This is the return format benchmark for all interfaces")
public class ResponseBean<T> implements Serializable {

    @ApiModelProperty(value = "Custom status code", name = "code")
    private int code;

    @ApiModelProperty(value = "Description", name = "msg")
    private String msg;

    @ApiModelProperty(value = "Data", name = "data")
    private T data;

    public static final ResponseBean<Object> OK_RESPONSE_BEAN =
          new ResponseBean<>(HttpStatus.OK.value(), HttpStatus.OK.name(), null);
}
