import { Component } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Checkbox, Form } from 'antd';
import './styles.css';
import intl from 'react-intl-universal';
import logo from '@img/icon.jpg';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { inject, observer } from 'mobx-react';
import UserStore from '../../../models/userStore';
import { login } from '../../../services/user';

interface IState {
  showErrorMessage: boolean;
}

//表单
const FormItem = Form.Item;

//登录框
@inject('userStore')
@observer
class LoginForm extends Component<
  {
    onLogin: (login: boolean) => void;
    userStore?: UserStore;
  },
  IState
> {
  constructor(props: {
    onLogin: (login: boolean) => void;
    userStore?: UserStore;
  }) {
    super(props);
    this.state = {
      showErrorMessage: true,
    };
  }

  handleSubmit = (values: { usernameOrEmail: string; password: string }) => {
    login(values).then((data) => {
      if (!data) {
        console.error(intl.get('error account or password'));
        this.setState({ showErrorMessage: false });
        return;
      }
      this.props.userStore?.setUser({
        userToken: data.token,
        username: data.username,
        userRight: +data.right,
      });
      sessionStorage.setItem('type', 'sonarqube');
      this.props.onLogin(true);
    });
  };

  render() {
    const { showErrorMessage } = this.state;
    return (
      <div>
        <div id={'loginFormTitle'}>
          <img className={'logo'} src={logo} alt={'logo'} />
          {intl.get('title')}
        </div>
        <Form
          onFinish={this.handleSubmit}
          className="login-form"
          layout="vertical"
        >
          <FormItem
            label={`${intl.get('Username')} or ${intl.get('email')}`}
            name="usernameOrEmail"
            rules={[
              {
                required: true,
                message: 'Please enter username or email',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Please enter username or email"
            />
          </FormItem>
          <FormItem
            label={intl.get('Password')}
            name="password"
            rules={[
              {
                required: true,
                message: intl.get('Please input your Password!'),
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder={intl.get('input password')}
              autoComplete="off"
            />
          </FormItem>
          <FormItem name="remember" valuePropName="checked" initialValue={true}>
            <Checkbox>{intl.get('Remember me')}</Checkbox>
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
            >
              {intl.get('Log in')}
            </Button>
            <FormItem
              name="error account or password message"
              validateStatus="error"
              help={intl.get('error account or password')}
              hidden={showErrorMessage}
            ></FormItem>
          </FormItem>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {intl.get('Or')}{' '}
              <Link to={'/register'}>{intl.get('register now!')}</Link>
            </span>
            <Link to={{ pathname: '/password/reset' }}>
              {intl.get('Forgot password') + '?'}
            </Link>
          </div>
          {/*<br />*/}
        </Form>
      </div>
    );
  }
}

export default LoginForm;
