import React from 'react';
import { Button, Typography } from 'antd';
import { ModalForm, ProFormText } from '@ant-design/pro-form';
import { UserAddOutlined } from '@ant-design/icons';
import { isEmail } from '@/utils/check';
import intl from 'react-intl-universal';
import { checkAccountName } from '@/services/user';
import { useStores } from '@/models';

interface IProps {
  create: (gitName: string) => Promise<boolean>;
}

const UserCreateButton: React.FC<IProps> = ({ create }) => {
  const { userStore } = useStores();
  return (
    <ModalForm<{
      gitName: string;
    }>
      style={{ position: 'relative', zIndex: 1031 }}
      title="创建新用户"
      trigger={
        <Button type="link">
          <UserAddOutlined /> 创建新用户
        </Button>
      }
      onFinish={({ gitName }) => create(gitName)}
    >
      <ProFormText
        label="用户名"
        name="gitName"
        rules={[
          {
            required: true,
            message: '请输入用户名',
          },
          {
            validator: async (_, value) => {
              if (value && value.length < 2) {
                return new Error(intl.get('The name cannot be less than two!'));
              }
              if (isEmail(value)) {
                return new Error('用户名不应是邮箱格式');
              }
              const resp = await checkAccountName(value, userStore.userToken);
              if (resp) {
                return new Error(intl.get('Username already exists!'));
              } else {
                return '成功';
              }
            },
          },
        ]}
        shouldUpdate={(prevValues, curValues) =>
          prevValues.accountName !== curValues.accountName
        }
        hasFeedback
      />
      <Typography.Paragraph>
        <blockquote>默认密码为您输入的用户名 + '1234!'</blockquote>
      </Typography.Paragraph>
    </ModalForm>
  );
};

export default UserCreateButton;
