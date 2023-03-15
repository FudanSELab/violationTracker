import { Component } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/zh-cn';
import intl from 'react-intl-universal';
import Cookies from 'js-cookie';
import zhCNData from '../locales/zh-CN.json';
import enUSData from '../locales/en-US.json';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import NoMatchPage from './404';
import './styles.css';
import routers, { IRouterProps } from '../router';
import BasicLayout from '../layouts/BasicLayout';
import { inject, observer } from 'mobx-react';
import UserStore from '../models/userStore';
import { ConfigProvider } from 'antd';
import SettingStore from '@/models/settingStore';

// locale data
const locales = {
  'en-US': enUSData,
  'zh-CN': zhCNData,
};

const originalSetItem = sessionStorage.setItem;
sessionStorage.setItem = function (key, newValue) {
  const setItemEvent = new Event('listUpdate');
  //@ts-ignore
  setItemEvent.key = key;
  //@ts-ignore
  setItemEvent.newValue = newValue;
  //@ts-ignore
  window.dispatchEvent(setItemEvent);
  //@ts-ignore
  originalSetItem.apply(this, arguments);
};
if (!Cookies.get('lang')) {
  Cookies.set('lang', 'en-US');
}
moment.locale(Cookies.get('lang') === 'en-US' ? 'en-US' : 'zh-CN');

interface IAppProps {
  userStore?: UserStore;
  settingStore?: SettingStore;
}

//页面组件
@inject('userStore')
@inject('settingStore')
@observer
class App extends Component<IAppProps, { initDone: boolean }> {
  constructor(props: IAppProps) {
    super(props);
    const langV = Cookies.get('lang') ?? 'zh-CN';
    Cookies.set('lang', langV as string | object);
    this.state = {
      initDone: false,
    };
  }

  UNSAFE_componentWillMount() {
    this.props.userStore?.getDataFromStorage();
    this.props.settingStore?.getDataFromStorage();
  }

  componentDidMount() {
    this.loadLocales();
  }

  loadLocales() {
    let currentLocale = intl.determineLocale({
      urlLocaleKey: 'lang',
      cookieLocaleKey: 'lang',
    });
    // react-intl-universal 是单例模式, 只应该实例化一次
    intl
      .init({
        currentLocale, // TODO: determine locale here
        locales,
      })
      .then(() => {
        this.setState({ initDone: true });
      });
  }

  // 递归方法
  routerListRecursion = (routers: IRouterProps[]) => {
    return routers.map(
      ({ path, exact, routes, component: LoadComponent }, key) => {
        let newItem = { path, exact };
        if (routes && routes.length) {
          return (
            <Route key={path + key} {...newItem} element={<LoadComponent />}>
              {this.routerListRecursion(routes)}
            </Route>
          );
        } else {
          return (
            <Route key={path + key} {...newItem} element={<LoadComponent />} />
          );
        }
      },
    );
  };

  render() {
    return (
      this.state.initDone && (
        <ConfigProvider locale={Cookies.get('lang') === 'en-US' ? enUS : zhCN}>
          <Router>
            <Routes>
              <Route path="/" element={<BasicLayout />}>
                {this.routerListRecursion(
                  routers.filter(({ needLogin }) => needLogin),
                )}
              </Route>
              {this.routerListRecursion(
                routers.filter(({ needLogin }) => !needLogin),
              )}
              <Route path="*" element={<NoMatchPage />} />
            </Routes>
          </Router>
        </ConfigProvider>
      )
    );
  }
}

export default App;
