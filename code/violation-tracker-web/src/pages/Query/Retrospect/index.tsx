import { AutoComplete, BackTop, Card, List, Radio, Spin } from 'antd';
import { parse, stringify } from 'query-string';
import { useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import BackButton from '../../../components/BackButton';
import { queryFilesOrMethods } from '../../../services/query';
import { useHistory } from '../../historyContext';

import './styles.css';
import { useDebounce } from '@/utils/hooks';
import { RefSelectProps } from 'antd/lib/select';

interface IHistorySearch {
  repoUuid: string;
  repoName: string;
}

const PAGE_SIZE = 50;

const QueryRetrospect: React.FC<{}> = () => {
  const { location, history } = useHistory();
  const historySearch = (useMemo(() => {
    return location.search ? parse(location.search) : '';
  }, [location.search]) as unknown) as IHistorySearch;

  const searchRef = React.useRef<RefSelectProps>(null);

  const [level, setLevel] = useState<API.TLevel>('file');
  const [recordLength, setRecordLength] = useState<number | string>(0);
  const [loading, setLoading] = useState<boolean>(false);
  // const [hasMore, setHasMore] = useState<boolean>(false);
  // const [nextPage, setNextPage] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const [options, setOptions] = useState<API.RetrospectFileOrMethodItem[]>([]);

  const onDebounceSearch = useDebounce(
    (searchText: string) => {
      setSearchText(searchText);
      // setNextPage(1);
      // setHasMore(true);
      setOptions([]);
      setRecordLength(0);
      onLoadMore(searchText, 1, PAGE_SIZE, level);
    },
    500,
    [],
  );
  const onLoadMore = (
    searchText: string,
    page: number,
    pageSize: number,
    level: API.TLevel,
  ) => {
    setLoading(true);
    return queryFilesOrMethods({
      repo_uuid: historySearch.repoUuid,
      key: searchText,
      level,
      page,
      ps: pageSize,
    }).then((listResp) => {
      setLoading(false);
      if (page <= 1) {
        // 自动聚焦
        // 自动聚焦会让页面回到出现 AutoComplete 的位置，而我们下拉刷新不希望页面回到最初位置
        searchRef.current?.focus();
      }
      // setNextPage(page + 1);
      if (listResp !== null) {
        setRecordLength(listResp.size);
        // setHasMore(page + 1 <= listResp.total);
        page > 1
          ? setOptions(options.concat(listResp.rows ?? []))
          : setOptions(listResp.rows ?? []);
      }
    });
  };

  const onSelect = useCallback(
    (metaUuid: string, repoUuid: string) => {
      history.push({
        pathname: level === 'file' ? '/fileTrace' : '/methodTrace',
        search: stringify({
          repo_uuid: repoUuid,
          meta_uuid: metaUuid,
          level,
        }),
      });
    },
    [history, level],
  );

  // const debouncedScrollerEventListener = useDebounce(
  //   () => {
  //     if (!hasMore) {
  //       message.info('已到最后');
  //       return;
  //     }
  //     const bodyScrollHeight = document.body.scrollHeight;
  //     const last_known_scroll_position = window.scrollY + window.innerHeight;
  //     if (last_known_scroll_position === bodyScrollHeight) {
  //       onLoadMore(searchText, nextPage, PAGE_SIZE, level);
  //     }
  //   },
  //   200,
  //   [onLoadMore, nextPage, searchText, hasMore, level],
  // );

  // React.useEffect(() => {
  //   document.addEventListener('scroll', debouncedScrollerEventListener);
  //   return () => {
  //     document.removeEventListener('scroll', debouncedScrollerEventListener);
  //   };
  // }, [debouncedScrollerEventListener]);

  return (
    <div id="query-retrospect">
      <BackTop />
      <div className="issloca">
        <div className="input">
          <BackButton />
          <div style={{ fontSize: 'larger', fontWeight: 'bold' }}>
            {historySearch.repoName} 文件追溯搜索
          </div>
        </div>
      </div>
      <div style={{ width: '90%', margin: '0 auto', padding: '20px' }}>
        <Radio.Group
          style={{ marginBottom: '10px' }}
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setOptions([]);
            setRecordLength(0);
            onLoadMore(searchText, 1, PAGE_SIZE, e.target.value);
          }}
        >
          <Radio.Button value="file">按文件查询</Radio.Button>
          <Radio.Button value="method">按方法查询</Radio.Button>
        </Radio.Group>
        <br />
        <Card bordered={false} style={{ marginBottom: '20px' }}>
          <span style={{ verticalAlign: 'middle', fontSize: '15pt' }}>
            {historySearch.repoName}&nbsp;/&nbsp;&nbsp;
          </span>
          <AutoComplete
            ref={searchRef}
            style={{ width: 200 }}
            disabled={loading}
            allowClear
            autoFocus
            open={false}
            onSearch={onDebounceSearch}
            placeholder="文件追溯搜索"
          />
        </Card>
        {searchText !== '' ? (
          <Card bordered={false}>
            <List
              header={
                <div>
                  找到{' '}
                  <strong style={{ fontSize: '15pt', fontFamily: 'monospace' }}>
                    {recordLength}
                  </strong>{' '}
                  个结果
                </div>
              }
              bordered
              // loadMore={loadMore}
              // loading={loading}
              dataSource={options.map((item, index) => ({
                ...item,
                index: index + 1,
              }))}
              renderItem={({
                index,
                filePath,
                fullName,
                metaUuid,
              }: API.RetrospectFileOrMethodItem & { index: number }) => (
                <List.Item
                  className="list-clickable"
                  onClick={() => onSelect(metaUuid, historySearch.repoUuid)}
                >
                  <List.Item.Meta
                    avatar={index}
                    title={fullName}
                    description={filePath}
                  />
                </List.Item>
              )}
            >
              {/* {loading && hasMore && ( */}
              {loading && (
                <div
                  style={{ textAlign: 'center', margin: '5 0', height: '50px' }}
                >
                  <Spin />
                </div>
              )}
            </List>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default QueryRetrospect;
