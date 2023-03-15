import { createContext, useContext } from 'react';
import CodePortraitStore from './codePortraitStore';
import IssueStore from './issueStore';
import MetaStore from './metaStore';
import ProjectStore from './projectStore';
import SettingStore from './settingStore';
import UserStore from './userStore';

//生成store的统一方法
const createStores = () => {
  //新增加一个store,在此创建一个实例即可
  return {
    userStore: new UserStore(),
    issueStore: new IssueStore(),
    metaStore: new MetaStore(),
    projectStore: new ProjectStore(),
    settingStore: new SettingStore(),
    codePortraitStore: new CodePortraitStore(),
  };
};

//类组件使用的store
const stores = createStores();
// Context的封装,创建 Provider，通过 React.Context来注入,包裹函数组件,将hookStores注入到函数组件中
const StoresContext = createContext(stores);
// hooks 使用笔记看这里 -> https://github.com/olivewind/blog/issues/1
const useStores = () => useContext(StoresContext); //hooks组件使用的store

type TStore = ReturnType<typeof createStores>;
const StoreContext = createContext<TStore | null>(null);

export { stores, createStores, StoreContext, useStores };
