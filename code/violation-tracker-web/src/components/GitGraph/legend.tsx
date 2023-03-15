import {
  BugTwoTone,
  CheckCircleTwoTone,
  PlusCircleTwoTone,
  QuestionCircleOutlined,
  StopTwoTone,
} from '@ant-design/icons';
import { Button, Descriptions, Modal } from 'antd';
import { useState } from 'react';
import Common from './img/common.png';
import Retrospect from './img/retrospect.png';
import Direct from './img/direct.png';
import Indirect from './img/indirect.png';
import ChangeEdge from './img/change-edge.png';

const GitGraphLegend = () => {
  const [visible, setVisible] = useState<boolean>(false);
  return (
    <>
      <Button type="text" onClick={() => setVisible(true)}>
        <QuestionCircleOutlined />
        图例说明
      </Button>
      <Modal
        visible={visible}
        title="追溯链图例说明"
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <Descriptions column={1}>
          <Descriptions.Item
            label={<img src={Common} style={{ width: 33 }} alt="普通节点" />}
          >
            普通节点，表示一个 commit
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <img src={Retrospect} style={{ width: 33 }} alt="追溯节点" />
            }
          >
            追溯节点，表示这个 commit 追溯到了希望追溯的语句
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <img src={Direct} style={{ width: 33 }} alt="直接父子关系" />
            }
          >
            直接父子关系，表示前后两个 commit 是父子关系
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <img src={Indirect} style={{ width: 33 }} alt="间接父子关系" />
            }
          >
            间接父子关系，表示前后两个 commit 是祖父子关系
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <img src={ChangeEdge} style={{ width: 33 }} alt="间接父子关系" />
            }
          >
            表示前后两个 commit 的代码有变动
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <StopTwoTone style={{ fontSize: 20 }} twoToneColor="#de1c31" />
            }
          >
            表示该节点不可编译
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <PlusCircleTwoTone
                style={{ fontSize: 20 }}
                twoToneColor="#de1c31"
              />
            }
          >
            表示从该节点引入缺陷
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <BugTwoTone style={{ fontSize: 20 }} twoToneColor="#de1c31" />
            }
          >
            表示该节点缺陷仍然存在
          </Descriptions.Item>
          <Descriptions.Item label={<BugTwoTone style={{ fontSize: 20 }} />}>
            表示该节点缺陷可能存在
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <CheckCircleTwoTone
                style={{ fontSize: 20 }}
                twoToneColor="#52c41a"
              />
            }
          >
            表示该节点缺陷被修复
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};

export default GitGraphLegend;
