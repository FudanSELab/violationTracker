import { FireOutlined } from '@ant-design/icons';
import { Alert, Button, Spin } from 'antd';
import * as React from 'react';
import intl from 'react-intl-universal';
import StatementResult from './StatementResult';

interface IProps {
  loading: boolean;
  loadingLines: number;
  onRetrospect: () => void;
  onClear: () => void;
  onCommitClick?: (commitId: string, changeStatus: string) => void;
  list?: API.RetrospectResult[];
}

const RetrospectSearch: React.FC<IProps> = ({
  loading,
  loadingLines,
  onRetrospect,
  onClear,
  onCommitClick,
  list,
}) => {
  return (
    <>
      <div className="tools">
        <Button
          type="primary"
          danger
          onClick={onRetrospect}
          loading={loading}
          icon={<FireOutlined />}
        >
          {intl.get('get history')}
        </Button>
        <Button onClick={onClear}>{intl.get('clear all')}</Button>
      </div>
      {loading ? (
        <Spin tip="加载中...">
          <Alert
            message="追溯语句中"
            description={`正在追溯 ${loadingLines} 条语句，请稍等...`}
            type="info"
          />
        </Spin>
      ) : Array.isArray(list) && list.length !== 0 ? (
        <div className="result">
          {list.map((statementBlock, index) => (
            <StatementResult
              key={`${statementBlock} ${index}`}
              result={statementBlock as API.RetrospectResult}
              onCommitClick={onCommitClick}
            />
            // <div>{JSON.stringify(statementBlock)}</div>
          ))}
        </div>
      ) : null}
    </>
  );
};

export default RetrospectSearch;
