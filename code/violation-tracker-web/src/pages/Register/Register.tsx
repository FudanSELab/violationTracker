import React, { useCallback } from 'react';
import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Input, Tooltip, Button, message, Form, Card } from 'antd';
import intl from 'react-intl-universal';
import logo from '@img/icon.jpg';
import { isEmail } from '../../utils/check';
import './Register.less';
import InputPassword from '@/components/InputPassword';
import { checkAccountName, checkEmail, register } from '@/services/user';
import { useStores } from '@/models';
import { Link, useNavigate } from 'react-router-dom';

const FormItem = Form.Item;

const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { userStore } = useStores();
  // 提交注册信息
  const handleSubmit = useCallback(
    (values: { accountName: string; password: string; email: string }) => {
      register(values).then((d) => {
        if (d !== null) {
          message.success(intl.get('success'));
          navigate('/');
        }
      });
    },
    [navigate],
  );
  return (
    <div id="registerPage">
      <Card id="registerBlock" style={{ width: '400px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/login">
            <ArrowLeftOutlined /> 返回登录页面
          </Link>
        </div>
        <div id="registerFormTitle">
          <img className={'logo'} src={logo} alt={'logo'} />
          {intl.get('title')}
        </div>
        <Form layout="vertical" onFinish={handleSubmit}>
          <FormItem
            label={
              <span>
                {intl.get('accountName')}&nbsp;
                <Tooltip title={intl.get('What is your Gitlab Id?')}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            }
            name="accountName"
            rules={[
              {
                required: true,
                message: intl.get('Please input your Gitlab Id!'),
              },
              {
                validator: async (_, value) => {
                  if (!value) return;
                  if (value && value.length < 2) {
                    throw new Error(
                      intl.get('The name cannot be less than two!'),
                    );
                  }
                  if (isEmail(value)) {
                    throw new Error('用户名不应是邮箱格式');
                  }
                  const resp = await checkAccountName(
                    value,
                    userStore?.userToken,
                  );
                  if (!resp) {
                    throw new Error(intl.get('Username already exists!'));
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
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder={intl.get('accountName')}
            />
          </FormItem>
          <FormItem
            label={intl.get('E-mail')}
            name="email"
            rules={[
              {
                required: true,
                message: intl.get('Please input your E-mail!'),
              },
              {
                type: 'email',
                message: intl.get('The input is not valid E-mail!'),
              },
              {
                validator: async (_, value) => {
                  if (
                    !value.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)
                  )
                    return;
                  const data = await checkEmail({ email: value });
                  if (!data) {
                    throw new Error(intl.get('Email already exists!'));
                  } else {
                    return '成功';
                  }
                },
              },
            ]}
            shouldUpdate={(prevValues, curValues) =>
              prevValues.email !== curValues.email
            }
            hasFeedback
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder={intl.get('E-mail')}
            />
          </FormItem>
          <FormItem
            style={{ marginBottom: '0' }}
            label={intl.get('Password')}
            name="password"
            rules={[
              {
                required: true,
                message: intl.get('Please input your password!'),
              },
            ]}
            hasFeedback
          >
            <InputPassword />
          </FormItem>
          <FormItem
            label={intl.get('Confirm Password')}
            name="confirm"
            rules={[
              {
                required: true,
                message: intl.get('Please confirm your password!'),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve('成功');
                  }
                  return Promise.reject(
                    intl.get('Two passwords that you enter is inconsistent!'),
                  );
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder={intl.get('Password')}
              autoComplete="off"
            />
          </FormItem>
          <FormItem
            style={{
              marginBottom: '0',
            }}
          >
            <Button type="primary" htmlType="submit">
              {intl.get('Register')}
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
};

export default RegistrationForm;
