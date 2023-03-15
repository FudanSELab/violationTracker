import { Component } from 'react';
import intl from 'react-intl-universal';
import { BookOutlined } from '@ant-design/icons';
import { Drawer, Button, Table, Tooltip } from 'antd';
// import * as urlConfig from '@/urlConfig';

import './RecommendWindow.css';
import { ColumnsType } from 'antd/lib/table';

interface IState {
  visible: boolean;
  historyHeight: number;
  winWidth: number;
}

class RecommendWindow extends Component<{}, IState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      visible: false,
      historyHeight: window.innerHeight,
      winWidth: window.innerWidth,
    };
  }

  componentDidMount() {
    window.onresize = () => {
      this.getWinWidthAndHeight();
    };
  }

  getWinWidthAndHeight() {
    if (window.innerWidth) {
      this.setState({
        winWidth: window.innerWidth,
        historyHeight: window.innerHeight,
      });
    } else if (document.body && document.body.clientWidth) {
      this.setState({
        winWidth: document.body.clientWidth,
        historyHeight: document.body.clientHeight,
      });
    }
    if (document.documentElement && document.documentElement.clientWidth) {
      this.setState({
        winWidth: document.documentElement.clientWidth,
        historyHeight: document.documentElement.clientHeight,
      });
    }
  }

  showDrawer = () => {
    this.setState({
      visible: true,
    });
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    let { visible, historyHeight } = this.state;
    const columns: ColumnsType<any> = [
      {
        title: <span>{intl.get('type')}:</span>,
        dataIndex: 'type',
        key: 'type',
        width: 300,
        render: (text) => {
          return <div>{text}</div>;
        },
      },
      {
        title: <span>{intl.get('location')}:</span>,
        dataIndex: 'position',
        key: 'position',
        width: 300,
        render: (text) => {
          return <div>{text}</div>;
        },
      },
      {
        title: <span>{intl.get('start commit')}:</span>,
        dataIndex: 'date',
        key: 'date',
        width: 250,
        render: (text) => {
          return <div>{text}</div>;
        },
      },
      {
        title: <span>{intl.get('status')}</span>,
        dataIndex: 'state1',
        key: 'state1',
        width: 100,
        render: (text) => {
          return <div>{text}</div>;
        },
      },
      {
        title: <span>{intl.get('status')}</span>,
        dataIndex: 'state2',
        key: 'state2',
        width: 100,
        render: (text) => {
          return <div>{text}</div>;
        },
      },
    ];
    let testData = [
      {
        type: 'String literals should not be duplicated',
        position: 'String literals should not be duplicated',
        date: '2014-12-24 23:12:00',
        state1: 'Open',
        state2: 'Urgent',
      },
    ];
    let testExperts = [
      {
        name: 'heyue',
        information: 'Expression is always true.',
      },
      {
        name: 'gehaipeng',
        information: 'Expression is always true.',
      },
      {
        name: 'chenjun',
        information:
          'Delete and remove code that has no effect or is never executed.',
      },
    ];

    return (
      <div>
        <Tooltip title={intl.get('Methods recommended')}>
          <Button
            shape="circle"
            type="dashed"
            size="large"
            // onClick={this.showDrawer}
          >
            <BookOutlined />
          </Button>
        </Tooltip>
        <Drawer
          title={intl.get('Issue ID') + '(该功能目前仅显示测试数据)'}
          headerStyle={{ fontSize: '25px', fontWeight: 'bold' }}
          height={historyHeight - 150}
          placement="bottom"
          closable={false}
          onClose={this.onClose}
          visible={visible}
          keyboard={true}
        >
          <Table pagination={false} columns={columns} dataSource={testData} />
          <div>
            <div id="methodsRecommended">
              <div
                style={{
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {intl.get('Methods recommended')}
              </div>
              <div className="methods">
                Methods recommended
                <br />
                Methods recommended
                <br />
                Methods recommended
                <br />
              </div>
              <hr className="methodsLine"></hr>
              <div className="methods">
                Methods recommended
                <br />
                Methods recommended
                <br />
                Methods recommended
                <br />
              </div>
              <hr className="methodsLine"></hr>
              <div className="methods">
                Methods recommended
                <br />
                Methods recommended
                <br />
                Methods recommended
                <br />
              </div>
            </div>
            <div>
              <div
                style={{
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {intl.get('Experts recommend')}
              </div>
              {testExperts.map((d, k) => {
                return (
                  <div className="experts">
                    <span className="expertsImformation">
                      {/* @ts-ignore */}
                      <a href>{d.name}</a>
                    </span>
                    <span className="expertsImformation">
                      &nbsp;-&nbsp;{d.information}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Drawer>
      </div>
    );
  }
}

export default RecommendWindow;
