import * as React from 'react';
import intl from 'react-intl-universal';
import { Card, Col, Descriptions, Row, Statistic, Typography } from 'antd';
import transformIssueName from '../../../utils/transformIssueName';

interface IProps {
  issueType?: string;
  commitTotalTimes: number;
  className: string;
  packageName: string;
  fileName: string;
  level: API.TLevel;
}

const FileMetaCard: React.FC<IProps> = ({
  issueType,
  commitTotalTimes,
  className,
  packageName,
  fileName,
  level,
  children,
}) => {
  return (
    <Card className="meta-card" bordered={false}>
      <Row gutter={20}>
        <Col span="8">
          <Statistic
            className="statistic"
            valueStyle={{
              color: '#0084f7',
              fontSize: '25pt',
              fontWeight: 'bold',
              lineHeight: '30pt',
            }}
            title={intl.get('times tracked')}
            value={commitTotalTimes}
          />
        </Col>
        <Col span="16">
          {issueType ? (
            <>
              <Statistic
                className="statistic"
                valueStyle={{
                  lineHeight: '30pt',
                }}
                style={{
                  marginBottom: 2,
                }}
                title={intl.get('BugType')}
                value={transformIssueName(issueType)}
              />
              <p>原文：{issueType}</p>
            </>
          ) : null}
        </Col>
      </Row>
      <Descriptions column={2} title="File Information">
        {level === 'method' ? (
          <Descriptions.Item label={intl.get('class')}>
            <Typography.Text code>{className ?? ''}</Typography.Text>
          </Descriptions.Item>
        ) : null}
        <Descriptions.Item label={intl.get('package')} span={2}>
          <Typography.Text code>{packageName ?? ''}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('file')} span={2}>
          <Typography.Text code>{fileName ?? ''}</Typography.Text>
        </Descriptions.Item>
      </Descriptions>
      {children}
    </Card>
  );
};

export default FileMetaCard;
