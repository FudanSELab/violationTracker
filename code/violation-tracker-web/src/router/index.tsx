import { THistory } from '@/pages/historyContext';
import React from 'react';
import {
  NavigateFunction,
  useLocation,
  useNavigate,
  Location,
} from 'react-router-dom';
import loadable from 'react-loadable';
import LoadingTip from './LoadingTip';

export interface RoutedProps {
  history: THistory;
  location: Location;
  navigate: NavigateFunction;
  // params: Params;
}

export function withRouter<P extends RoutedProps>(
  Child: React.ComponentClass<P>,
) {
  return (props: Omit<P, keyof RoutedProps>) => {
    const location = useLocation();
    const navigate = useNavigate();
    const history = {
      goBack: () => navigate(-1),
      push: (val) => {
        navigate(val);
      },
      replace: (url) => {
        navigate(url, { replace: true });
      },
    } as THistory;
    // const params = useParams();
    return (
      <Child
        {...(props as P)}
        navigate={navigate}
        location={location}
        history={history}
        // params={params}
      />
    );
  };
}

export interface IRouterProps {
  name?: string; //名称（实际没用）
  path: string; //路径
  component: any; //对应的组件
  exact?: any;
  routes?: IRouterProps[];
  needLogin?: boolean; //页面是否需要登录才能看
}

//写一个页面就在此数组里面加一个
const routers: IRouterProps[] = [
  {
    name: '提示',
    path: '/loading',
    component: LoadingTip,
    needLogin: false,
  },
  {
    name: '首页',
    path: '/',
    component: loadable({
      loader: () => import('../pages/Index'), // 需要异步加载的路由
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: '登录',
    path: '/login',
    component: loadable({
      loader: () => import('../pages/Login'), // 需要异步加载的路由
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '注册',
    path: '/register',
    component: loadable({
      loader: () => import('../pages/Register/Register'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试',
    path: '/test',
    component: loadable({
      loader: () => import('../pages/Test'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试2',
    path: '/test2',
    component: loadable({
      loader: () => import('../pages/Test/index2'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试3',
    path: '/test3',
    component: loadable({
      loader: () => import('../pages/Test/index3'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试4',
    path: '/test4',
    component: loadable({
      loader: () => import('../pages/Test/index4'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试5',
    path: '/test5',
    component: loadable({
      loader: () => import('../pages/Test/index5'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试6',
    path: '/test6',
    component: loadable({
      loader: () => import('../pages/Test/index6'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试7',
    path: '/test7',
    component: loadable({
      loader: () => import('../pages/Test/index7'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试8',
    path: '/test8',
    component: loadable({
      loader: () => import('../pages/Test/index8'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '测试9',
    path: '/test9',
    component: loadable({
      loader: () => import('../pages/Test/index9'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '重置密码',
    path: '/password/reset',
    component: loadable({
      loader: () => import('../pages/ResetPassword'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: false,
  },
  {
    name: '设置',
    path: '/settings',
    component: loadable({
      loader: () => import('../pages/Setting'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: '追溯查询',
    path: '/query/retrospect',
    component: loadable({
      loader: () => import('../pages/Query/Retrospect'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: 'Commit 修改文件查询',
    path: '/query/change/files',
    component: loadable({
      loader: () => import('../pages/Query/ChangedFiles'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: '版本说明',
    path: '/about',
    component: loadable({
      loader: () => import('../pages/About'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: '原始缺陷',
    path: '/rawIssue',
    component: loadable({
      loader: () => import('../pages/ProjectIssueDetail'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: '方法追溯',
    path: '/methodTrace',
    component: loadable({
      loader: () => import('../pages/CodeTrace/MethodTrace'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: '文件追溯',
    path: '/fileTrace',
    component: loadable({
      loader: () => import('../pages/CodeTrace/FileTrace'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
  {
    name: '文件缺陷对比',
    path: '/fileDiff',
    component: loadable({
      loader: () => import('../pages/FileDiff'),
      loading: LoadingTip, // 这是一个的提示
    }),
    needLogin: true,
  },
];

export default routers;
