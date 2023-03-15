import { LeftCircleOutlined } from '@ant-design/icons';
import * as React from 'react';
import { useHistory } from '../pages/historyContext';

export const BackButton: React.FC = () => {
  // const { history } = useContext(HistoryContext);
  const { history } = useHistory();
  return (
    <div
      style={{
        cursor: 'pointer',
        marginRight: '10px',
        display: 'inline-block',
      }}
      onClick={() => history.goBack()}
    >
      <LeftCircleOutlined style={{ fontSize: '20px' }} />
    </div>
  );
};

export default BackButton;
