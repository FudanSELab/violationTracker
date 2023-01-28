package cn.edu.fudan.issueservice.domain.vo;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import lombok.Data;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * @author Beethoven
 */
@Data
public class PagedGridResult<T> {
    /**
     * page:页
     * ps: 每页数量
     * total:总页数
     * records:总记录数
     * rows:每行显示内容
     */
    private int page;

    private int ps;

    private int total;

    private long records;

    private List<T> rows;

    public static void handlePageHelper(int page, int ps, String order, Boolean isAsc) {
        if (StringUtils.isEmpty(order)) {
            PageHelper.startPage(page, ps);
        } else {
            String orderBy = order;
            if (isAsc != null && isAsc) {
                orderBy = order + ' ' + "asc";
            }
            if (isAsc != null && !isAsc) {
                orderBy = order + ' ' + "desc";
            }
            PageHelper.startPage(page, ps, orderBy);
        }
    }

    public static PagedGridResult<?> getPagedGridResult(int page, int records, int size, List<?> list) {
        PagedGridResult<Object> result = new PagedGridResult<>();
        result.page = page;
        result.records = records;
        result.total = size;
        result.rows = new ArrayList<>();
        list.forEach(r -> result.rows.addAll((Collection<?>) r));
        return result;
    }

    public PagedGridResult<T> setterPagedGrid(List<T> list, Integer page) {
        PageInfo<?> pageList = new PageInfo<>(list);
        PagedGridResult<T> grid = new PagedGridResult<>();
        grid.setPage(page);
        grid.setRows(list);
        grid.setTotal(pageList.getPages());
        grid.setRecords(pageList.getTotal());
        return grid;
    }


    /**
     * 将PageHelper分页后的list转为分页信息
     */
    public static <T> PagedGridResult<T> restPage(List<T> list) {
        PagedGridResult<T> result = new PagedGridResult<>();
        PageInfo<T> pageInfo = new PageInfo<T>(list);
        result.setTotal(pageInfo.getPages());
        result.setPage(pageInfo.getPageNum());
        result.setPs(pageInfo.getPageSize());
        result.setRecords(pageInfo.getTotal());
        result.setRows(pageInfo.getList());
        return result;
    }

    /**
     * 从pageList获取pageInfo信息，返回resList数据
     *
     * @param pageList
     * @param resList
     * @param <T>
     * @return
     */
    public static <T> PagedGridResult<T> restPage(List<T> pageList, List<T> resList) {
        if (pageList == null || resList == null) {
            return null;
        }
        if (pageList.size() != resList.size()) {
            return null;
        }
        PagedGridResult<T> result = restPage(pageList);
        result.setRows(resList);
        return result;
    }

    /**
     * 将未分页的list转为分页信息
     */
    public static <T> PagedGridResult<T> restPage(List<T> list, Integer page, Integer ps) {
        PagedGridResult<T> result = new PagedGridResult<>();
        if (page == 0) {
            result.setRows(list);
            result.setRecords(list.size());
            result.setTotal(1);
            result.setPs(list.size());
            result.setPage(1);
        } else {
            result.setRows(startPage(list, page, ps));
            result.setRecords(list.size());
            if (list.size() % ps != 0)
                result.setTotal(list.size() / ps + 1);
            else result.setTotal(list.size() / ps);
            result.setPs(ps);
            result.setPage(page);
        }
        return result;
    }

    public static <T> PagedGridResult<T> restPage(List<T> list, Integer page, Integer ps, Integer total, Integer records) {
        PagedGridResult<T> result = new PagedGridResult<>();
        result.setRows(list);
        result.setPage(page);
        result.setPs(ps);
        result.setTotal(total);
        result.setRecords(records);
        return result;
    }

    private static <T> List<T> startPage(List<T> list, Integer page, Integer ps) {
        if (list == null) {
            return new ArrayList<T>();
        }
        if (list.size() == 0) {
            return new ArrayList<T>();
        }

        Integer count = list.size(); // 记录总数
        Integer pageCount = 0; // 页数
        if (count % ps == 0) {
            pageCount = count / ps;
        } else {
            pageCount = count / ps + 1;
        }

        int fromIndex = 0; // 开始索引
        int toIndex = 0; // 结束索引

        if (page < pageCount) {
            fromIndex = (page - 1) * ps;
            toIndex = fromIndex + ps;
        } else if (page.equals(pageCount)){
            fromIndex = (page - 1) * ps;
            toIndex = count;
        } else {
            return new ArrayList<>();
        }

        return list.subList(fromIndex, toIndex);
    }

}
