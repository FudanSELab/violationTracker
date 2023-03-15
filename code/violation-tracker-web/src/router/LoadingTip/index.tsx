import { Spin } from 'antd';
import './styles.less';

const LoadingTip = () => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <h2 className="loading-tips">
      懒加载
      <br />
      路由中...
      <br />
      <p>代码大数据平台</p>
    </h2>
    <Spin />
  </div>
);

export default LoadingTip;
