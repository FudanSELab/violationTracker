import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import intl from 'react-intl-universal';
import { useStores } from '@/models';
// import prefitImg from '@img/profitImage.jpg';

const PersonManager: React.FC = () => {
  const { userStore } = useStores();
  return (
    <div className={'block2'}>
      <div id={'user-title'} className={'title'}>
        {intl.get('personal information')}
      </div>
      <div className={'block2'}>
        <div id={'userTitle'}>
          <Avatar src={userStore.userAvatar} icon={<UserOutlined />} />
          <span id={'settingsUserName'}>{userStore.username}</span>
        </div>
        <div id={'settingsType'}>
          {userStore.isMaintainer
            ? intl.get('super administrator')
            : intl.get('ordinary users')}
        </div>
        <div id={'userInfo'}></div>
      </div>
    </div>
  );
};

export default PersonManager;
