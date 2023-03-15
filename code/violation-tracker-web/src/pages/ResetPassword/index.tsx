import { LeftCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input } from 'antd';
import intl from 'react-intl-universal';
import React from 'react';
import { resetPassword } from '../../services/user';

import './styles.less';
import InputPassword from '@/components/InputPassword';
import { useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const handleSubmit = (values: { username: string; password: string }) => {
    resetPassword(values);
  };
  return (
    <>
      <article id="reset-password">
        <Card
          title={
            <>
              <span
                onClick={() => navigate(-1)}
                style={{ color: '#333', marginRight: '5px' }}
              >
                <LeftCircleOutlined />
              </span>
              重置密码
            </>
          }
          style={{ width: '350px', margin: '17vh auto' }}
        >
          <Form onFinish={handleSubmit} layout="vertical">
            <Form.Item
              label={`${intl.get('Username')}`}
              name="username"
              rules={[
                {
                  required: true,
                  message: '请输入用户名',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="请输入用户名"
              />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="password"
              rules={[
                {
                  required: true,
                  message: '请输入新密码',
                },
              ]}
            >
              <InputPassword />
            </Form.Item>
            <Form.Item style={{ marginBottom: '0px', textAlign: 'right' }}>
              <Button type="primary" htmlType="submit">
                重置密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </article>
    </>
  );
};

export default ResetPassword;
