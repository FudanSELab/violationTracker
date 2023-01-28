package cn.edu.fudan.issueservice.util;

/**
 * @author Beethoven
 */
public class SearchUtil {

    public static int dichotomy(String[] strings, String value) {
        int middle;
        int start = 0;
        int end = strings.length - 1;
        while (start <= end) {
            if (start == end) {
                int compareResult = value.compareTo(strings[end]);
                if (compareResult == 0) {
                    return end;
                }
                return -1;
            } else {
                middle = (start + end) / 2;
                int compareResult = value.compareTo(strings[middle]);
                if (compareResult == 0) {
                    return middle;
                } else if (compareResult < 0) {
                    end = --middle;
                } else {
                    start = ++middle;
                }
            }
        }
        return -1;
    }
}
