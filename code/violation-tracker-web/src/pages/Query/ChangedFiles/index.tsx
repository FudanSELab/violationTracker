import {
  BackTop,
  Card,
  Input,
  List,
  Radio,
  Result,
  Spin,
  Typography,
} from 'antd';
import { parse, stringify } from 'query-string';
import { useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import BackButton from '../../../components/BackButton';
import { queryChangedFilesByCommitId } from '../../../services/query';
import { useHistory } from '../../historyContext';

import './styles.css';
import { Link } from 'react-router-dom';
import ChangeStatusTag from '@/components/ChangeStatusTag';

interface IHistorySearch {
  repoUuid: string;
  repoName: string;
  url: string;
}

function getFileName(filePath: string) {
  return filePath.replace(/.*\/([^/]+)$/, (_, p1) => p1);
}

function expend2Object(type: string) {
  return (str: string) => ({
    filePath: str,
    type,
  });
}

const QueryChangedFiles: React.FC<{}> = () => {
  const { location } = useHistory();
  const historySearch = (useMemo(() => {
    return location.search ? parse(location.search) : '';
  }, [location.search]) as unknown) as IHistorySearch;

  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [commitKeys, setCommitKeys] = useState<string[]>([]);
  const [parentCommit, setParentCommit] = useState<string>('');
  const [filesCommitMap, setFilesCommitMap] = useState<{
    [commitId: string]: {
      filePath: string;
      type: 'ADD' | 'RENAME' | 'DELETE' | 'CHANGE';
    }[];
  }>();

  const onSearch = useCallback(
    (searchText: string) => {
      setLoading(true);
      setSearchText(searchText);
      return queryChangedFilesByCommitId({
        repo_uuid: historySearch.repoUuid,
        commit_id: searchText,
      }).then((resp) => {
        setLoading(false);
        if (typeof resp !== 'boolean' && resp !== null) {
          const keys = Object.keys(resp);
          setCommitKeys(keys);
          setParentCommit(keys[0]);
          const result: any = {};
          keys.forEach((key) => {
            const list = [];
            list.push(...resp[key].CHANGE.map(expend2Object('CHANGE')));
            list.push(...resp[key].ADD.map(expend2Object('ADD')));
            list.push(...resp[key].RENAME.map(expend2Object('RENAME')));
            list.push(...resp[key].DELETE.map(expend2Object('DELETE')));
            result[key] = list;
          });
          setFilesCommitMap(result);
        }
      });
    },
    [historySearch.repoUuid],
  );

  // const onSelect = useCallback(
  //   (filePath, commitId, parentCommitId) => {
  //     const url = `/fileDiff?${stringify({
  //       repo_uuid: historySearch.repoUuid,
  //       file_path: filePath,
  //       cur_commit: commitId,
  //       pre_commit: parentCommitId,
  //     })}`;
  //     window.open(url);
  //   },
  //   [historySearch.repoUuid],
  // );

  return (
    <div id="query-changed-files">
      <BackTop />
      <div className="issloca">
        <div className="input">
          <BackButton />
          <div style={{ fontSize: 'larger', fontWeight: 'bold' }}>
            {historySearch.repoName}｜Commit 修改文件搜索
          </div>
        </div>
      </div>
      <div style={{ width: '90%', margin: '0 auto', padding: '20px' }}>
        <span>
          🔗代码库链接：
          <a href={historySearch.url} target="_blank" rel="noopener noreferrer">
            {historySearch.url}
          </a>
        </span>
        <Card bordered={false} style={{ margin: '20px 0' }}>
          <span style={{ verticalAlign: 'middle', fontSize: '15pt' }}>
            {historySearch.repoName}&nbsp;/&nbsp;&nbsp;
          </span>
          <Input.Search
            style={{ width: 500 }}
            disabled={loading}
            allowClear
            autoFocus
            placeholder="请输入 commit hash 查询修改文件"
            onSearch={onSearch}
            enterButton="搜索"
          />
        </Card>
        {searchText !== '' ? (
          <Card bordered={false}>
            <span>父 commit hash: </span>
            <Radio.Group
              style={{ marginBottom: '10px' }}
              value={parentCommit}
              onChange={(e) => {
                setParentCommit(e.target.value);
              }}
            >
              {commitKeys.map((commit) => (
                <Radio.Button key={commit} value={commit}>
                  <Typography.Text copyable>{commit}</Typography.Text>
                </Radio.Button>
              ))}
            </Radio.Group>
            {loading ? (
              <div
                style={{
                  textAlign: 'center',
                  margin: '5 0',
                  height: '50px',
                }}
              >
                <Spin />
              </div>
            ) : filesCommitMap && filesCommitMap[parentCommit] ? (
              <List
                rowKey={(item) => item.filePath}
                header={
                  <div>
                    找到{' '}
                    <strong
                      style={{ fontSize: '15pt', fontFamily: 'monospace' }}
                    >
                      {filesCommitMap[parentCommit].length}
                    </strong>{' '}
                    个结果
                  </div>
                }
                bordered
                dataSource={filesCommitMap[parentCommit].map(
                  ({ filePath, type }, index) => ({
                    filePath,
                    type,
                    index: index + 1,
                  }),
                )}
                renderItem={({ index, type, filePath }) => (
                  <List.Item
                    className="list-clickable"
                    // onClick={() => onSelect(filePath, searchText, parentCommit)}
                  >
                    <List.Item.Meta
                      avatar={index}
                      title={
                        <Link
                          to={{
                            pathname: '/fileDiff',
                            search: `?${stringify({
                              repo_uuid: historySearch.repoUuid,
                              file_path: filePath,
                              cur_commit: searchText,
                              pre_commit: parentCommit,
                            })}`,
                          }}
                          target="_blank"
                        >
                          {getFileName(filePath)}{' '}
                          <ChangeStatusTag status={type} />
                        </Link>
                      }
                      description={filePath}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Result
                status="warning"
                title="查询不到数据，请确保 commit hash 正确"
              />
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default QueryChangedFiles;
