import { useStores } from '@/models';
import { putEditTag } from '@/services/tag';
import { Button, Form, Input, message } from 'antd';
import { observer } from 'mobx-react';
import { useEffect } from 'react';

interface IProps {
  tagId: string;
  tagName: string;
  tagDescription: string;
  onReload: () => void;
  onDone: () => void;
}

const EditTagPage: React.FC<any> = observer(
  ({ tagId, tagName, tagDescription, onReload, onDone }: IProps) => {
    const { userStore } = useStores();
    const [baseForm] = Form.useForm();
    const onFinish = (values: any) => {
      putEditTag(
        {
          name: values.NewTagName,
          description: values.NewTagDescription,
          tag_id: tagId,
        },
        userStore.userToken,
      ).then((resp) => {
        if (typeof resp !== 'boolean' && resp) {
          onReload();
          onDone();
          // setChanged(false);
          baseForm.resetFields();
        } else {
          message.error('修改标签失败, 请重新填写！');
        }
      });
    };

    useEffect(() => {
      baseForm.resetFields();
    });

    return (
      <>
        <Form
          name="EditTag"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          onFinish={onFinish}
          form={baseForm}
          initialValues={{
            NewTagName: tagName,
            NewTagDescription: tagDescription,
          }}
        >
          <Form.Item
            label="标签名"
            name="NewTagName"
            rules={[{ required: true, message: '请填写标签名！' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="标签描述"
            name="NewTagDescription"
            rules={[{ required: true, message: '请填写标签描述！' }]}
          >
            <Input />
          </Form.Item>
          {/* {tagName !== currTagName || tagDescription !== currTagDescription ? ( */}
          {/* {changed ? ( */}
          <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
            <Button type="primary" htmlType="submit">
              确认修改
            </Button>
          </Form.Item>
          {/* ) : null} */}
        </Form>
      </>
    );
  },
);

export default EditTagPage;
