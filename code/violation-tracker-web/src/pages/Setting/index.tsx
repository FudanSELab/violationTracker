import React, { Component } from 'react';
import { Tabs } from 'antd';
import intl from 'react-intl-universal';
import BackButton from '../../components/BackButton';
import { inject, observer } from 'mobx-react';
import ProjectStore from '../../models/projectStore';
import UserStore from '@/models/userStore';
import SettingStore from '@/models/settingStore';
import RuleManager from './components/RuleManager';
import UserManager from './components/UserManager';
import PersonManager from './components/PersonManager';

import './styles.css';
import EvaluateStandardManager from './components/EvaluateStandardManager';
import TagManager from './components/TagManager';

const { TabPane } = Tabs;

interface IProps {
  projectStore: ProjectStore;
  settingStore?: SettingStore;
  userStore: UserStore;
}
interface IState {
  originalName: string;
}

@inject('projectStore')
@inject('settingStore')
@inject('userStore')
@observer
class Setting extends Component<IProps, IState> {
  controller?: AbortController;
  constructor(props: IProps) {
    super(props);
    if ('AbortController' in window) {
      this.controller = new window.AbortController();
    }
    this.state = {
      originalName: '',
    };
  }

  componentWillUnmount() {
    // 若有未处理完的请求，则取消（适用于fetch）
    if ('AbortController' in window) {
      this.controller?.abort();
    }
  }

  render() {
    if (this.props.userStore.isMaintainer) {
      return (
        <>
          <div className={'issloca'}>
            <div id={'settingsTitle'}>
              <BackButton />
              <span>{intl.get('settings')}</span>
            </div>
          </div>
          <div id={'settingsPage'}>
            <div id={'blockTab'}>
              <div id={'settingsTab'}>
                <Tabs type="card" tabPosition="left">
                  <TabPane tab={intl.get('personal information')} key="1">
                    <div id={'blockUser'}>
                      <PersonManager />
                    </div>
                  </TabPane>
                  <TabPane tab={intl.get('personnel management')} key="2">
                    <div id={'blockPerson'}>
                      <UserManager />
                    </div>
                  </TabPane>
                  <TabPane tab={intl.get('rules repo management')} key="4">
                    <div id={'blockRule'}>
                      <RuleManager />
                    </div>
                  </TabPane>
                  <TabPane
                    tab={intl.get('evaluate standard management')}
                    key="5"
                  >
                    <div id={'blockEvaluateStandard'}>
                      <EvaluateStandardManager />
                    </div>
                  </TabPane>
                  <TabPane tab={intl.get('tab management')} key="6">
                    <div id={'blockTab'}>
                      <TagManager />
                    </div>
                  </TabPane>
                </Tabs>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className={'issloca'}>
            <div id={'settingsTitle'}>
              <BackButton />
              <span>{intl.get('settings')}</span>
            </div>
          </div>
          <div id={'settingsPage'}>
            <div id={'blockLeft'} className={'block'}>
              <PersonManager />
            </div>
          </div>
        </>
      );
    }
  }
}

export default Setting;
