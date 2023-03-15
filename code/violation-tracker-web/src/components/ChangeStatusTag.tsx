import {
  MinusSquareFilled,
  PlusSquareFilled,
  SnippetsFilled,
  SwapOutlined,
  ToolFilled,
} from '@ant-design/icons';
import { Tag } from 'antd';
import * as React from 'react';
import { changeStatementHistoryColor } from '../color';

interface IProps {
  status: string;
  ellipsis?: boolean;
}

const getIconByStatus = (status: string) => {
  switch (status) {
    case 'DELETE':
      return <MinusSquareFilled />;
    case 'ADD':
      return <PlusSquareFilled />;
    case 'CHANGE':
    case 'SELF_CHANGE':
    case 'NOT_CHANGED':
      return <ToolFilled />;
    case 'MOVE':
      return <SnippetsFilled />;
    case 'CHANGE_LINE':
      return <SwapOutlined />;
    default:
      return undefined;
  }
};

const ChangeStatusTag: React.FC<IProps> = ({ status, ellipsis }) => {
  return (
    <Tag
      icon={getIconByStatus(status)}
      color={changeStatementHistoryColor(status)}
    >
      {ellipsis ? status.slice(0, 3) : status}
    </Tag>
  );
};

export default ChangeStatusTag;
