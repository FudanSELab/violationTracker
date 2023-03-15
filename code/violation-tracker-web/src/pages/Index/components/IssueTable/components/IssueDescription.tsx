import { Descriptions, Divider, Spin, Typography } from 'antd';
import intl from 'react-intl-universal';
import React, { useEffect, useState } from 'react';
import { useStores } from '@/models';
import transformIssueName from '@/utils/transformIssueName';

interface IIssueDescriptionProps {
  data: {
    hasGetDetail?: boolean;
    uuid: string;
    status: string;
    detail?: {
      filePath: string;
      className: string;
      methodName: string;
      bugLines: string | number;
      code: string;
    }[];
    producer: string;
    startCommitDate: string;
    startCommit: string;
    solver?: string;
    solveTime?: string;
    solveCommit?: string;
  };
  types: string;
}

export const IssueDescription: React.FC<IIssueDescriptionProps> = ({
  data,
  types,
}) => {
  const { issueStore } = useStores();
  const [loading, setLoading] = useState(false);

  const getIssueDetail = React.useCallback(
    (issueUuids: string) => {
      return issueStore.searchDetailByIssueUuid({
        detail: true,
        issue_uuids: issueUuids,
      });
    },
    [issueStore],
  );

  useEffect(() => {
    if (data) {
      if (data?.hasGetDetail !== undefined && data?.hasGetDetail) return;
      setLoading(true);
      getIssueDetail(data.uuid).then(() => {
        setLoading(false);
      });
    }
  }, [data, getIssueDetail]);

  return loading ? (
    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
      <Spin />
    </div>
  ) : data ? (
    data.status !== 'Solved' && data.detail && data.detail[0] ? (
      <div id={'issueDetail'}>
        <Descriptions column={1}>
          <Descriptions.Item label={intl.get('issue adder')}>
            {data.producer}
          </Descriptions.Item>
          <Descriptions.Item label={intl.get('issue_first_commit_time')}>
            {data.startCommitDate}
          </Descriptions.Item>
          <Descriptions.Item label={intl.get('issue_first_commit')}>
            <Typography.Text code>
              {data.startCommit || intl.get('no data')}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={intl.get('issue_name')}>
            {transformIssueName(types)}
          </Descriptions.Item>
          {/* <Descriptions.Item label={intl.get('issue_description')}>
            {}
          </Descriptions.Item> */}
        </Descriptions>
        {data.detail.map((item, index: number) => (
          <div key={index}>
            <Divider />
            <Descriptions column={1}>
              <Descriptions.Item label={intl.get('file')}>
                {item.filePath || intl.get('no data')}
              </Descriptions.Item>
              <Descriptions.Item label={intl.get('class')}>
                <Typography.Text code>
                  {item.className || intl.get('no data')}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={intl.get('method')}>
                <Typography.Text code>
                  {item.methodName || intl.get('no data')}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={intl.get('line num')}>
                {item.bugLines || intl.get('no data')}
              </Descriptions.Item>
              <Descriptions.Item label={intl.get('code')}>
                <Typography.Text code>
                  {item.code || intl.get('no data')}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        ))}
      </div>
    ) : (
      <Descriptions column={1}>
        <Descriptions.Item label={intl.get('issue adder')}>
          {data.producer}
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('issue_first_commit_time')}>
          {data.startCommitDate}
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('issue solver')}>
          {data.solver || intl.get('no data')}
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('issue solved time')}>
          {data.solveTime || intl.get('no data')}
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('issue solved commit')}>
          <Typography.Text code>
            {data.solveCommit || intl.get('no data')}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
    )
  ) : (
    <span>暂无数据</span>
  );
};
