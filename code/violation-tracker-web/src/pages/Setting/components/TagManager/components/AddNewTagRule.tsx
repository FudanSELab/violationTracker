import { useStores } from '@/models';
import { postNewTag } from '@/services/tag';
import { Button, Form, Input, message } from 'antd';
import { useEffect } from 'react';

interface IProps {
  onReload: () => void;
  onDone: () => void;
}

const AddNewTabRule: React.FC<any> = ({ onReload, onDone }: IProps) => {
  const [baseForm] = Form.useForm();
  const { userStore } = useStores();

  const onFinish = (values: any) => {
    postNewTag(
      { name: values.tagName, description: values.tagDescription },
      userStore.userToken,
    ).then((resp) => {
      if (typeof resp !== 'boolean') {
        onReload();
        onDone();
      } else {
        message.error('添加新标签失败，请重试！');
      }
    });
  };

  useEffect(() => {
    baseForm.resetFields();
  });

  return (
    <Form
      name="AddNewTag"
      form={baseForm}
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 16 }}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="标签名"
        name="tagName"
        rules={[
          { required: true, message: '请填写标签名！' },
          { type: 'string', max: 30, message: '标签名最长为30个字符' },
        ]}
      >
        <Input allowClear />
      </Form.Item>
      <Form.Item
        label="标签描述"
        name="tagDescription"
        rules={[{ required: true, message: '请填写标签描述！' }]}
      >
        <Input allowClear />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};
export default AddNewTabRule;
