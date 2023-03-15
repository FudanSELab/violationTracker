import { Button, Form, Input, Popover, Radio, RadioChangeEvent } from 'antd';
import { useState } from 'react';
import * as React from 'react';
import moment from 'moment';
import { useStores } from '@/models';

interface IProps {
  text: string;
  record: {
    startCommitDate: string;
    uuid: string;
    repoId: string;
    tool: string;
    type: string;
  };
}

const StatusRadio: React.FC<IProps> = ({ text, record }) => {
  const { issueStore, userStore } = useStores();
  const [visible, setVisible] = useState<boolean>(false);
  const ignoreItem = issueStore.ignoreMap.get(record.uuid);
  return (
    <Radio.Group
      size="small"
      defaultValue={ignoreItem ? 'Ignore' : text}
      onChange={(e: RadioChangeEvent) => {
        const value = e.target.value;
        if (value === 'Open') {
          issueStore.removeIgnoreItem(record.uuid);
        }
      }}
    >
      <Radio value="Open">Open</Radio>
      <Popover
        trigger="click"
        visible={visible}
        onVisibleChange={(visible) => setVisible(visible)}
        title={<strong>填写忽略理由</strong>}
        content={
          <>
            <Form
              name="ignore"
              onFinish={({ reason }) => {
                issueStore.setIgnoreItem({
                  accountName: userStore.username,
                  ignoreTime: moment().format('YYYY-MM-DD'),
                  issueUuid: record.uuid,
                  repoUuid: record.repoId,
                  tag: 'Ignore',
                  tool: record.tool,
                  type: record.type,
                  reason,
                });
                setVisible(false);
              }}
              initialValues={{
                reason: ignoreItem?.reason,
              }}
            >
              <Form.Item
                name="reason"
                rules={[
                  {
                    required: true,
                    message: '请输入忽略理由',
                  },
                ]}
              >
                <Input.TextArea maxLength={200} showCount autoSize />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right' }}>
                <Button type="primary" size="small" htmlType="submit">
                  确认
                </Button>
              </Form.Item>
            </Form>
          </>
        }
      >
        <Radio value="Ignore" onClick={() => setVisible(true)}>
          Ignore
        </Radio>
      </Popover>
    </Radio.Group>
  );
};

export default StatusRadio;
