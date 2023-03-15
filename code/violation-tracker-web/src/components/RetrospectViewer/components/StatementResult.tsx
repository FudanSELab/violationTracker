import { Fragment } from 'react';
import * as React from 'react';
import intl from 'react-intl-universal';
import { Collapse, Tooltip } from 'antd';
import { DiffOutlined } from '@ant-design/icons';
import { changeStatementHistoryColor } from '../../../color';
import Cookies from 'js-cookie';

const { Panel } = Collapse;
const LINKBLUE = '#1890ff';

interface IProps {
  result: API.RetrospectResult;
  onCommitClick?: (commitId: string, changeStatus: string) => void;
}

const renderCommitStr = (
  date: string,
  commitId: string,
  changeStatus: string,
  onClick?: (commitId: string, changeStatus: string) => void,
): React.ReactNode => (
  <Fragment>
    <Tooltip
      title={
        <div>
          {date ? <div>{intl.get('time') + ': ' + date}</div> : ''}
          {intl.get('commit') + ': ' + commitId}
        </div>
      }
      overlayClassName="tooltip"
    >
      {`${(date ?? '').split(' ')[0]} ${commitId.substring(0, 6)}`}
    </Tooltip>
    <DiffOutlined
      style={{
        color: LINKBLUE,
        marginLeft: '3px',
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(commitId, changeStatus);
      }}
    />
  </Fragment>
);

const StatementResult: React.FC<IProps> = ({ result, onCommitClick }) => {
  result.histories = result.histories.filter(
    ({ changeStatus }) => changeStatus !== 'CHANGE_LINE',
  );
  return (
    <div className="statementBlock">
      <h3 className="title">{`${result.title ?? '无数据'}(${
        result.begin ?? '-'
      }, ${result.end ?? '-'})`}</h3>
      <div style={{ overflowY: 'scroll', maxHeight: '250px' }}>
        {result.histories.length !== 0 ? (
          <Collapse>
            {result.histories.map(
              (
                {
                  changeStatus,
                  committer,
                  commitId,
                  date,
                  body,
                  lineBegin,
                  lineEnd,
                },
                key,
              ) => {
                if (changeStatus && changeStatus !== 'UNCHANGED') {
                  const panelTitle =
                    Cookies.get('lang') === 'en-US'
                      ? `${changeStatus} by ${committer}`
                      : `${intl.get('by')} ${committer} ${intl.get(
                          changeStatus.toLowerCase(),
                        )}`;
                  return (
                    <Panel
                      header={
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: changeStatementHistoryColor(changeStatus),
                          }}
                        >
                          {panelTitle}
                        </span>
                      }
                      key={key}
                      extra={renderCommitStr(
                        date,
                        commitId,
                        changeStatus,
                        onCommitClick,
                      )}
                    >
                      {`(${lineBegin ?? '-'}, ${lineEnd ?? '-'}) ${
                        body ?? '无数据'
                      }`}
                    </Panel>
                  );
                }
                return null;
              },
            )}
          </Collapse>
        ) : (
          '没有追溯历史'
        )}
      </div>
    </div>
  );
};

export default StatementResult;
