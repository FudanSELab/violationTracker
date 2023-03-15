package cn.edu.fudan.service;

/**
 * @author PJH
 */
public interface RedisService {

    /**
     * Refresh the cache daily
     */
    void refreshRedis();

    /**
     * Add a new cache row
     */
    void addNewRedis(Object key, Object value);

    /**
     * Get the row data by the key
     */
    Object getValueFromRedis(String key);
}
