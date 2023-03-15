import { Card } from 'antd';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../../models';
import LoginForm from './LoginForm';

import './styles.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { userStore } = useStores();
  const { login } = userStore;
  React.useEffect(() => {
    if (login) {
      navigate('/');
    } else {
      userStore.setUser({
        userToken: 'ec15d79e36e14dd258cfff3d48b73d35',
        username: 'admin',
        userRight: 1,
      });
      navigate('/');
    }
  }, [login, navigate, userStore]);
  return (
    <div id="LoginPage">
      <Card id="LoginForm">
        <LoginForm
          onLogin={(logined) => {
            logined && navigate('/');
          }}
        />
      </Card>
    </div>
  );
};

export default Login;
