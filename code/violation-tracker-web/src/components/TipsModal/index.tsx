import { QuestionCircleOutlined } from '@ant-design/icons';
import { Modal, Typography } from 'antd';
import { useState } from 'react';

import './styles.less';

const TipsModal: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);
  return (
    <div
      style={{
        position: 'fixed',
        right: '2vw',
        bottom: '3vh',
        zIndex: 1,
      }}
    >
      {/*<div className="tips" onClick={() => setVisible(true)}>*/}
      {/*  <QuestionCircleOutlined*/}
      {/*    style={{ fontSize: '17pt', marginRight: '5px', color: '#0d94d8' }}*/}
      {/*  />*/}
      {/*  How to tracker statements?*/}
      {/*</div>*/}
      <Modal
        title="Tips"
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <h3>如何选择语句段进行追溯查询？</h3>
        <p>
          选择语句段，请按住键盘
          <Typography.Text keyboard> shift </Typography.Text>键，用鼠标点击
          <Typography.Text keyboard>起始行</Typography.Text>和
          <Typography.Text keyboard>结束行</Typography.Text>
        </p>
      </Modal>
    </div>
  );
};

export default TipsModal;
