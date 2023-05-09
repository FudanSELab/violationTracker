import { Component } from 'react';
import {
  DownOutlined,
  LogoutOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Menu, Avatar, Dropdown, Popconfirm } from 'antd';
import { Link } from 'react-router-dom';
import './styles.css';
import logo from '@img/icon.jpg';
import intl from 'react-intl-universal';
// import prefitImg from '@img/profitImage.jpg';
import { projectRoot } from '../../urlConfig';
import { inject, observer } from 'mobx-react';
import UserStore from '../../models/userStore';
import HistoryContext from '../../pages/historyContext';

//导航栏
class Nav extends Component {
  render() {
    return (
      <div id="menu">
        <Link to={projectRoot} id="NavLogo">
          <img className={'logo'} src={logo} alt={'logo'} />
          {intl.get('title')}
        </Link>
        <AuthDiv />
      </div>
    );
  }
}

interface IAuthProps {
  userStore?: UserStore;
}
interface IAuthState {
  show: boolean;
}

//导航栏用户部分
@inject('userStore')
@observer
class AuthDiv extends Component<IAuthProps, IAuthState> {
  static contextType = HistoryContext;
  constructor(props: {}) {
    super(props);
    this.state = {
      show: false,
    };
  }

  changeShow = (show: boolean) => {
    this.setState({
      show: show,
    });
  };

  render() {
    const menu = (
      <Menu>
        {this.props.userStore?.isMaintainer
          ? // <Menu.Item key={'6'}>
            //   <Link to={`/recycle`}>
            //     <div className={'aLink'}>
            //       <DeleteOutlined style={{ marginRight: '6px' }} />
            //       {intl.get('recycle bin')}
            //     </div>
            //   </Link>
            // </Menu.Item>
            null
          : null}
        <Menu.Item key="5" onClick={() => {}}>
          <Link to={`/settings`}>
            <div className={'aLink'}>
              <SettingOutlined style={{ marginRight: '6px' }} />
              {intl.get('settings')}
            </div>
          </Link>
        </Menu.Item>
        <Menu.Item key="4" onClick={() => {}}>
          <Link to={`/about`}>
            <span className={'aLink'}>
              <InfoCircleOutlined style={{ marginRight: '6px' }} />
              {intl.get('version explain')}
            </span>
          </Link>
        </Menu.Item>
        <Menu.Item key="3" onClick={() => {}}>
          <Popconfirm
            title={intl.get('are-you-sure-to-log-out?')}
            onConfirm={() => {
              this.props.userStore?.setUser({});
              this.context.history.push('/login');
            }}
            okText={intl.get('yes')}
            cancelText={intl.get('no')}
          >
            <span className={'aLink'}>
              <LogoutOutlined style={{ marginRight: '6px' }} />
              {intl.get('Log out')}
            </span>
          </Popconfirm>
        </Menu.Item>
      </Menu>
    );
    return (
      <div id="menuright">
        <Avatar
          style={{ border: '2px solid orange' }}
          src={this.props.userStore?.userAvatar}
          icon={<UserOutlined />}
        />
        <span id="UserName">
          <Dropdown overlay={menu}>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className="ant-dropdown-link">
              {this.props.userStore?.username} <DownOutlined />
            </a>
          </Dropdown>
        </span>
      </div>
    );
  }
}

export default Nav;
