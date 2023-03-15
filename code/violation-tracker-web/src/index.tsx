import * as React from 'react';
import ReactDOM from 'react-dom';
import ReactApp from './pages/App';
import './index.css';
import { Provider, useLocalObservable } from 'mobx-react';
import { createStores, StoreContext, stores } from './models';

// 创建 Provider，通过 React.Context 来注入
const StoreProvider: React.FC = ({ children }) => {
  const hookStores = useLocalObservable(createStores); //函数组件中hooks使用的store
  return (
    <StoreContext.Provider value={hookStores}>{children}</StoreContext.Provider>
  );
};

ReactDOM.render(
  <Provider {...stores}>
    <StoreProvider>
      <ReactApp />
    </StoreProvider>
  </Provider>,
  document.getElementById('Page'),
);

// ReactDOM.render(
//   <App />,
//   document.getElementById('root')
// );
