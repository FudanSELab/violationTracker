package cn.edu.fudan.issueservice.util;

import java.io.Serializable;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;

/**
 * @author beethoven
 * @date 2021-11-30 19:33:45
 */
public class MapSortUtil {

    public static <K, V extends Comparable<? super V>> Map<K, V> sortByValueAsc(Map<K, V> map) {
        Map<K, V> result = new LinkedHashMap<>();
        Stream<Map.Entry<K, V>> st = map.entrySet().stream();
        st.sorted(Map.Entry.comparingByValue()).forEach(e -> result.put(e.getKey(), e.getValue()));
        return result;
    }

    public static <K, V extends Comparable<? super V>> Map<K, V> sortByValueDesc(Map<K, V> map) {
        Map<K, V> result = new LinkedHashMap<>();
        Stream<Map.Entry<K, V>> st = map.entrySet().stream();
        st.sorted((Comparator<Map.Entry<K, V>> & Serializable) (c1, c2) -> c2.getValue().compareTo(c1.getValue())).forEach(e -> result.put(e.getKey(), e.getValue()));
        return result;
    }

}
