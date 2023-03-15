import { Component } from 'react';
import './styles.less';

export default class NoMatchPage extends Component {
  render() {
    return (
      <div
        style={{
          backgroundColor: '#333333',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          flex: 1,
        }}
      >
        <h1 className="error-title">404, 未找到页面</h1>
      </div>
    );
  }
}
