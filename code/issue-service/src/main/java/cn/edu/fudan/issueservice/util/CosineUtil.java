package cn.edu.fudan.issueservice.util;

import org.springframework.util.StringUtils;

import java.util.*;

/**
 * description: Code comparison tool (based on cosine similarity)
 *
 * @author fancying
 * create: 2020-06-06 15:48
 **/
public class CosineUtil {


    /**
     * Calculate the cosine similarity of the token string
     *
     * @param tokensX tokensX
     * @param tokensY tokensY
     * @return The cosine similarity of the token string
     */
    public static double cosineSimilarity(List<Byte> tokensX, List<Byte> tokensY) {
        List<Object> allTokens = new ArrayList<>();
        allTokens.addAll(tokensX);
        allTokens.addAll(tokensY);
        Set<Object> tokenSet = new HashSet<>(allTokens);
        Map<Object, Integer> tokenMapX = new HashMap<>();
        Map<Object, Integer> tokenMapY = new HashMap<>();
        for (Object b : tokensX) {
            tokenMapX.put(b, tokenMapX.getOrDefault(b, 0) + 1);
        }
        for (Object b : tokensY) {
            tokenMapY.put(b, tokenMapY.getOrDefault(b, 0) + 1);
        }
        List<Integer> vecX = new ArrayList<>();
        List<Integer> vecY = new ArrayList<>();
        for (Object b : tokenSet) {
            vecX.add(tokenMapX.getOrDefault(b, 0));
            vecY.add(tokenMapY.getOrDefault(b, 0));
        }

        long x = 0, y = 0, xy = 0;
        for (int i = 0; i < tokenSet.size(); i++) {
            xy += vecX.get(i) * vecY.get(i);
            x += vecX.get(i) * vecX.get(i);
            y += vecY.get(i) * vecY.get(i);
        }
        double r = xy / (Math.sqrt(x) * Math.sqrt(y));
        if (((Double) Double.NaN).equals(r)) {
            r = 1.00;
        }
        return r;
    }

    /**
     * Tokenize a string of code
     *
     * @param stat
     * @return
     */
    public static List<Byte> lexer(String stat, boolean tokenize) {
        if (StringUtils.isEmpty(stat)) {
            return Collections.emptyList();
        }
        int index = 0;
        List<Byte> res = new ArrayList<>();
        String token = "";
        while (index < stat.length()) {
            char c = stat.charAt(index);
            if (Character.isSpaceChar(c)) {
                index++;
                continue;
            }
            // Numeric char
            if (Character.isDigit(c)) {
                while (Character.isDigit(c)) {
                    token += c;
                    if (++index >= stat.length()) {
                        break;
                    }
                    c = stat.charAt(index);
                }
//                if (tokenize) {
//                    res.add(str2hash(token));
//                } else {
//                    res.add(token);
//                }
                res.add(str2hash(token));
                token = "";
                continue;
            }
            if (Character.isLetter(c) || c == '_') {
                while (Character.isLetterOrDigit(c) || c == '_') {
                    token += c;
                    if (++index >= stat.length()) {
                        break;
                    }
                    c = stat.charAt(index);
                }
//                if (tokenize) {
//                    res.add(str2hash(token));
//                } else {
//                    res.add(token);
//                }
                res.add(str2hash(token));
                token = "";
                continue;
            }
            index++;
        }
        return res;
    }

    /**
     * A hash function that maps a string to a [-128,-3]u[125,127]
     *
     * @param str
     * @return
     */
    private static byte str2hash(String str) {
        str = str.toLowerCase();
        if (str.length() < 2) {
            int h = str.toCharArray()[str.length() - 1];
            h <<= 1;
            return (byte) (-3 - (h & 0x7f));
        } else {
            int h1 = str.toCharArray()[str.length() - 1];
            int h2 = str.toCharArray()[str.length() - 2];
            h1 <<= 1;
            int h = h1 ^ h2;
            return (byte) (-3 - (h & 0x7f));
        }
    }

}
