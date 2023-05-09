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
        Legend Description
      </Button>
      <Modal
        visible={visible}
        title="legend description"
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <Descriptions column={1}>
          <Descriptions.Item
            label={<img src={Common} style={{ width: 33 }} alt="Normal" />}
          >
            Normal node, represents a commit.
          </Descriptions.Item>
          <Descriptions.Item
            label={<img src={Retrospect} style={{ width: 33 }} alt="Tracked" />}
          >
            Tracked node, represents a commit traced back to the desired
            statement.
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <img
                src={Direct}
                style={{ width: 33 }}
                alt="Direct parent-child"
              />
            }
          >
            Direct parent-child relationship, represents a parent-child
            relationship between the two commits in chronological order.
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <img
                src={Indirect}
                style={{ width: 33 }}
                alt="Indirect parent-child"
              />
            }
          >
            Indirect parent-child relationship, represents a grandparent-child
            relationship between the two commits in chronological order.
          </Descriptions.Item>
          <Descriptions.Item
            label={<img src={ChangeEdge} style={{ width: 33 }} alt="Changed" />}
          >
            Indicates that there are code changes between the two commits in
            chronological order.
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <StopTwoTone style={{ fontSize: 20 }} twoToneColor="#de1c31" />
            }
          >
            Indicates that the node cannot be compiled.
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <PlusCircleTwoTone
                style={{ fontSize: 20 }}
                twoToneColor="#de1c31"
              />
            }
          >
            Indicates the introduction of a violation from this node.
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <BugTwoTone style={{ fontSize: 20 }} twoToneColor="#de1c31" />
            }
          >
            Indicates that the violation still exists at this node.
          </Descriptions.Item>
          <Descriptions.Item label={<BugTwoTone style={{ fontSize: 20 }} />}>
            Indicates that the violation maybe exists at this node.
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <CheckCircleTwoTone
                style={{ fontSize: 20 }}
                twoToneColor="#52c41a"
              />
            }
          >
            Indicates that the violation has been fixed at this node.
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};

export default GitGraphLegend;
