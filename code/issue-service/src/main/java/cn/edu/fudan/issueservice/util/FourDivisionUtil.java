package cn.edu.fudan.issueservice.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class FourDivisionUtil {
    public static Map<String, BigDecimal> fourDivision(double[] param) {
        Map<String, BigDecimal> numParams = new HashMap<>();
        if (param == null || param.length == 0) {
            return null;
        }
        if (param.length <= 3) {
            numParams.put("q1", BigDecimal.valueOf(param[(param.length - 1) / 2]));
            numParams.put("q2", BigDecimal.valueOf(param[(param.length - 1) / 2]));
            numParams.put("q3", BigDecimal.valueOf(param[param.length / 2]));
        } else {
            // Convert to the BigDecimal type to avoid losing accuracy
            BigDecimal[] datas = new BigDecimal[param.length];
            for (int i = 0; i < param.length; i++) {
                datas[i] = BigDecimal.valueOf(param[i]);
            }
            int len = datas.length;
            Arrays.sort(datas);
            BigDecimal q1 = null;
            BigDecimal q2 = null;
            BigDecimal q3 = null;
            int index = 0;
            // n represents the number of terms, because the subscript starts from 0, so it is understood here: len = n+1
            if (len % 2 == 0) { // even
                index = new BigDecimal(len + 1).divide(new BigDecimal("4")).intValue();
                q1 = datas[index - 1].multiply(new BigDecimal("0.25")).add(datas[index].multiply(new BigDecimal("0.75")));
                q2 = datas[len / 2].add(datas[len / 2 - 1]).divide(new BigDecimal("2"));
                index = new BigDecimal(3 * (len + 1)).divide(new BigDecimal("4")).intValue();
                q3 = datas[index - 1].multiply(new BigDecimal("0.75")).add(datas[index].multiply(new BigDecimal("0.25")));
            } else { // odd
                // Special handling is required when the result is not an integer
                q1 = dealOddNumber(datas, len, "0.25");
                q2 = dealOddNumber(datas, len, "0.5");
                q3 = dealOddNumber(datas, len, "0.75");
            }
            // Results retain two decimal places (rounded)
            numParams.put("q1", q1);
            numParams.put("q2", q2);
            numParams.put("q3", q3);
        }
        return numParams;
    }

    private static BigDecimal dealOddNumber(BigDecimal[] datas, int len, String x) {
        BigDecimal q1;
        BigDecimal index = new BigDecimal(len + 1).multiply(new BigDecimal(x));
        if (checkNumberType(index)) {
            q1 = datas[index.intValue() - 1];
        } else {
            q1 = (datas[index.setScale(0, RoundingMode.HALF_UP).intValue() - 1]
                    .add(datas[index.setScale(0, RoundingMode.HALF_DOWN).intValue() - 1]))
                    .multiply(BigDecimal.valueOf(0.5));
        }
        return q1;
    }

    private static boolean checkNumberType(BigDecimal number) {
        return new BigDecimal(number.intValue()).compareTo(number) == 0;//true: integer, false: decimal
    }
}
