import { Avatar, Skeleton, Typography } from 'antd';

export function withSkeleton(element: JSX.Element | string | number | null) {
  return (
    element ?? (
      <Skeleton
        title={{ width: '80px', style: { margin: 0 } }}
        paragraph={false}
        active
      />
    )
  );
}

export const ellipsisText = (text: string, minWidth?: string) => {
  return (
    <Typography.Text
      style={{ width: minWidth ?? '80px', color: 'inherit' }}
      ellipsis={{ tooltip: text }}
    >
      {text}
    </Typography.Text>
  );
};

export const userText = (text: string) => {
  return (
    // 强制不换行
    <div style={{ whiteSpace: 'nowrap' }}>
      <Avatar
        style={{
          backgroundColor: '#87d068',
          verticalAlign: 'middle',
        }}
        size="small"
      >
        {(text ?? '').substr(0, 1)}
      </Avatar>
      <span
        style={{
          marginLeft: '4px',
          verticalAlign: 'middle',
        }}
      >
        {text}
      </span>
    </div>
  );
};
