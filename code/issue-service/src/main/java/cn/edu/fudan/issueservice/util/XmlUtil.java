package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.issueservice.domain.dto.XmlError;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.jdom2.Attribute;
import org.jdom2.Element;
import org.jdom2.JDOMException;
import org.jdom2.input.SAXBuilder;
import org.xml.sax.SAXException;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * @author beethoven
 * @date 2021-07-01 15:44:46
 */
@Slf4j
public class XmlUtil {

    public static List<XmlError> getError(String fileName) throws IOException, SAXException, JDOMException {

        StringBuilder buffer = new StringBuilder();
        try (BufferedReader bf = new BufferedReader(new FileReader(fileName))) {
            String s;
            while ((s = bf.readLine()) != null) {
                buffer.append(s.trim()).append("\n");
            }
        }
        String xmlContent = buffer.toString().replaceAll("[\\x00-\\x08\\x0b-\\x0c\\x0e-\\x1f\\ufffe]", "");

        Element element = new SAXBuilder().build(new InputStreamReader(IOUtils.toInputStream(xmlContent, String.valueOf(StandardCharsets.UTF_8)))).getRootElement();
        List<Element> elements = element.getChildren();
        List<XmlError> xmlErrors = new ArrayList<>();

        for (Element temp : elements) {
            XmlError xmlError = new XmlError();
            List<Attribute> attributes = temp.getAttributes();
            for (Attribute attribute : attributes) {
                switch (attribute.getName()) {
                    case "file":
                        xmlError.setFile(attribute.getValue());
                        break;
                    case "line":
                        xmlError.setLine(Integer.parseInt(attribute.getValue()));
                        break;
                    case "id":
                        xmlError.setId(attribute.getValue());
                        break;
                    case "subid":
                        xmlError.setSubId(attribute.getValue());
                    case "severity":
                        xmlError.setSeverity(attribute.getValue());
                        break;
                    case "msg":
                        xmlError.setMsg(attribute.getValue());
                        break;
                    case "func_info":
                        xmlError.setFuncInfo(attribute.getValue());
                        break;
                    default:
                }
            }
            xmlErrors.add(xmlError);
        }

        return xmlErrors;
    }
}
