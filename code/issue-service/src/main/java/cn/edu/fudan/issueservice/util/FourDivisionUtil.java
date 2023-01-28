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
            // 转成BigDecimal类型，避免失去精度
            BigDecimal[] datas = new BigDecimal[param.length];
            for (int i = 0; i < param.length; i++) {
                datas[i] = BigDecimal.valueOf(param[i]);
            }
            int len = datas.length;// 数组长度
            Arrays.sort(datas);    // 数组排序，从小到大
            BigDecimal q1 = null;  // 第一四分位
            BigDecimal q2 = null;  // 第二四分位
            BigDecimal q3 = null;  // 第三四分位
            int index = 0; // 记录下标
            // n代表项数，因为下标是从0开始所以这里理解为：len = n+1
            if (len % 2 == 0) { // 偶数
                index = new BigDecimal(len + 1).divide(new BigDecimal("4")).intValue();
                q1 = datas[index - 1].multiply(new BigDecimal("0.25")).add(datas[index].multiply(new BigDecimal("0.75")));
                q2 = datas[len / 2].add(datas[len / 2 - 1]).divide(new BigDecimal("2"));
                index = new BigDecimal(3 * (len + 1)).divide(new BigDecimal("4")).intValue();
                q3 = datas[index - 1].multiply(new BigDecimal("0.75")).add(datas[index].multiply(new BigDecimal("0.25")));
            } else { // 奇数
                //不是整数时需要特殊处理
                q1 = dealOddNumber(datas, len, "0.25");
                q2 = dealOddNumber(datas, len, "0.5");
                q3 = dealOddNumber(datas, len, "0.75");
            }
            // 保留两位小数（四舍五入）
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
        return new BigDecimal(number.intValue()).compareTo(number) == 0;//true 整数 false 小数
    }
}
