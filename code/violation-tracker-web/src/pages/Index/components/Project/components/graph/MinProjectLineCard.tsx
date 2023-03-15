import MinProjectLine from '@/components/graph/MinProjectLine';
import { Card, Skeleton } from 'antd';
import React from 'react';

const MinProjectLineCard: React.FC<{
  actived?: boolean;
  title: string;
  data?: any[];
  yField: string;
  onClick?: () => void;
}> = ({ actived, title, data, yField, onClick }) => {
  return (
    <Card
      style={{
        display: 'inline-block',
        width: '350px',
        height: '227px',
        borderColor: actived ? '#40a9ff' : undefined,
        color: actived ? '#1890FF' : 'inherit',
      }}
      onClick={onClick}
      hoverable
    >
      {data ? (
        <>
          <MinProjectLine data={data} yField={yField} />
          <div style={{ marginTop: '10px' }}>{title}</div>
        </>
      ) : (
        <>
          <Skeleton.Image style={{ width: '300px', height: '150px' }} />
          <Skeleton title={{ width: 160 }} active paragraph={false} />
        </>
      )}
    </Card>
  );
};

export default MinProjectLineCard;
