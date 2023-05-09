import { Component } from 'react';
import { DatePicker, Spin, Tabs } from 'antd';
import './dashboard.css';
import intl from 'react-intl-universal';
import { Chart, Geom, Axis, Tooltip, Legend } from 'bizcharts';
import {
  getDateforLastNMonth,
  getCurrentDateForLastWeek,
} from '../../../../../../utils/getDuration';
import { disabledDate, disabledRangeTime } from '../../../../../../utils/time';
import DataSet from '@antv/data-set';
import { View } from '@antv/data-set/lib/view';
import {
  getProjectCCnLOCDaily,
  getProjectIssueCount,
} from '../../../../../../services/charts';

let durationGranularity = '1';

interface IProps {
  repoUuid: string;
  projectName: string;
  signal?: AbortSignal;
}
interface IState {
  ccandlocdata?: View;
  projectIssueData?: View;
  defaultkey: string;
  dateforccandloc: any;
  activeLoading: boolean;
  issueLoading: boolean;
}

class Dashboard extends Component<IProps, IState> {
  dateRange: string[] = getDateforLastNMonth(1);
  headerMap: { [key: string]: string } = {
    commit_count: intl.get('Commit Count'),
    LOC: intl.get('LOC'),
    remainingIssueCount: intl.get('Remaining Issue'),
    newIssueCount: intl.get('New Issue'),
    eliminatedIssueCount: intl.get('Eliminated Issue'),
  };
  constructor(props: IProps) {
    super(props);
    this.state = {
      defaultkey: '0',
      dateforccandloc: {},
      activeLoading: true,
      issueLoading: true,
    };
  }

  UNSAFE_componentWillMount() {
    // 点击项目进入时，等待获取repoId再发送请求
    if (this.props.repoUuid) {
      this.getProjectCcnLocData(this.props.repoUuid);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: IProps) {
    if (
      this.props.repoUuid !== nextProps.repoUuid ||
      this.props.projectName !== nextProps.projectName
    ) {
      this.getProjectCcnLocData(nextProps.repoUuid);
    }
  }

  onDeveloperDateChange(_: any, dateString: string[]) {
    durationGranularity = '2';
    this.dateRange = dateString;
    this.getProjectCcnLocData(this.props.repoUuid);
  }

  onChangeTabs(key: string) {
    if (key !== durationGranularity) {
      if (key === '0') {
        durationGranularity = '0';
        this.dateRange = getCurrentDateForLastWeek();
      } else if (key === '1') {
        durationGranularity = '1';
        this.dateRange = getDateforLastNMonth(1);
      } else if (key === '2') {
        durationGranularity = '2';
        this.dateRange = getDateforLastNMonth(1);
      }
      this.getProjectCcnLocData(this.props.repoUuid);
    }
  }

  getProjectCcnLocData(repoUuid: string) {
    this.setState({ activeLoading: true, issueLoading: true });
    const { signal } = this.props;
    getProjectCCnLOCDaily(
      {
        since: this.dateRange[0],
        until: this.dateRange[1],
        repo_uuids: repoUuid,
      },
      sessionStorage.getItem('userToken') ?? '',
      signal,
    ).then((d) => {
      this.setState({ activeLoading: false });
      const data = d ?? [];
      const ds = new DataSet();
      const dv = ds.createView().source(data);
      dv.transform({
        type: 'fold',
        fields: ['commit_count', 'LOC'], // 展开字段集
        key: 'type', // key字段
        value: 'value', // value字段
      });
      this.setState({
        ccandlocdata: dv,
      });
    });
    getProjectIssueCount(
      {
        since: this.dateRange[0],
        until: this.dateRange[1],
        repo_uuids: repoUuid,
        tool: 'sonarqube',
      },
      sessionStorage.getItem('userToken') ?? '',
      signal,
    ).then((d) => {
      this.setState({ issueLoading: false });
      const data: any[] = d ?? [];
      data.map((element: { remainingIssueCount: string }) => {
        return {
          ...element,
          remainingIssueCount: +element.remainingIssueCount,
        };
      });
      const ds = new DataSet();
      const dv = ds.createView().source(data);
      dv.transform({
        type: 'fold',
        fields: [
          'remainingIssueCount',
          'newIssueCount',
          'eliminatedIssueCount',
        ], // 展开字段集
        key: 'type', // key字段
        value: 'value', // value字段
      });
      this.setState({
        projectIssueData: dv,
      });
    });
  }

  render() {
    const {
      ccandlocdata,
      projectIssueData,
      activeLoading,
      issueLoading,
    } = this.state;
    const { TabPane } = Tabs;
    const { RangePicker } = DatePicker;
    const label = {
      textStyle: {
        // textAlign: 'center', // 文本对齐方向，可取值为： start center end
        fill: '#404040', // 文本的颜色
        fontSize: '12', // 文本大小
        // fontWeight: 'bold', // 文本粗细
        textBaseline: 'bottom', // 文本基准线，可取 top middle bottom，默认为middle
      },
    };
    const title = (text: string) => {
      return {
        autoRotate: true, // 是否需要自动旋转，默认为 true
        // offset: 20, // 设置标题 title 距离坐标轴线的距离
        text: intl.get(text),
        textStyle: {
          fontSize: '12',
          textAlign: 'center',
          fill: 'black',
          // fontWeight: 'bold',
          // rotate: 0
        }, // 坐标轴文本属性配置
        position: 'middle', // 标题的位置，**新增**
      };
    };
    const cols = {
      commit_date: {
        range: [0, 1],
        mask: 'MM-DD',
      },
      date: {
        range: [0, 1],
        mask: 'MM-DD',
      },
    };

    return (
      <div>
        <div className={'dbleft'}>
          <p className={'cdbtitle'}>{intl.get('Activation Report')}</p>
          <Tabs
            activeKey={durationGranularity}
            onChange={this.onChangeTabs.bind(this)}
            type="card"
          >
            {[intl.get('recent week'), intl.get('recent month')].map((d, k) => {
              return (
                <TabPane tab={d} key={k}>
                  <Spin spinning={activeLoading}>
                    <Chart
                      placeholder
                      filter={[
                        [
                          'type',
                          () => {
                            return true;
                          },
                        ],
                      ]}
                      height={300}
                      data={ccandlocdata}
                      scale={cols}
                      forceFit
                      padding={'auto'}
                    >
                      <Legend
                        position="bottom-center"
                        itemFormatter={(val: string) => {
                          return this.headerMap[val]; // val 为每个图例项的文本值
                        }}
                      />
                      <Axis name="commit_date" />
                      <Tooltip />
                      <Geom
                        type="line"
                        position="commit_date*value"
                        size={2}
                        color={'type'}
                        tooltip={[
                          'type*value',
                          (type, value) => {
                            return {
                              name: this.headerMap[type],
                              value: value,
                            };
                          },
                        ]}
                      />
                      <Geom
                        type="point"
                        position="commit_date*value"
                        size={3}
                        shape={'circle'}
                        style={{ stroke: '#fff', lineWidth: 1 }}
                        color="type"
                        tooltip={[
                          'type*value',
                          (type, value) => {
                            return {
                              name: this.headerMap[type],
                              value: value,
                            };
                          },
                        ]}
                      />
                    </Chart>
                  </Spin>
                </TabPane>
              );
            })}
            <TabPane tab={intl.get('more')} key={2}>
              <div style={{ paddingBottom: '15px' }}>
                <RangePicker
                  size={'small'}
                  disabledDate={disabledDate}
                  disabledTime={disabledRangeTime}
                  // showTime={{
                  //     hideDisabledOptions: true,
                  //     defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('11:59:59', 'HH:mm:ss')],
                  // }}
                  format="YYYY-MM-DD"
                  onChange={this.onDeveloperDateChange.bind(this)}
                />
              </div>
              <div>
                <Chart
                  placeholder
                  filter={[
                    [
                      'type',
                      () => {
                        return true;
                      },
                    ],
                  ]}
                  height={300}
                  data={ccandlocdata}
                  scale={cols}
                  forceFit
                  padding={'auto'}
                >
                  <Legend
                    position="bottom-center"
                    itemFormatter={(val) => {
                      return this.headerMap[val]; // val 为每个图例项的文本值
                    }}
                  />
                  <Axis name="commit_date" />
                  <Tooltip
                  // crosshairs={{
                  //     type: "y"
                  // }}
                  />
                  <Geom
                    type="line"
                    position="commit_date*value"
                    size={2}
                    color={'type'}
                    tooltip={[
                      'type*value',
                      (type, value) => {
                        return {
                          name: this.headerMap[type],
                          value: value,
                        };
                      },
                    ]}
                  />
                  <Geom
                    type="point"
                    position="commit_date*value"
                    size={3}
                    shape={'circle'}
                    style={{ stroke: '#fff', lineWidth: 1 }}
                    color="type"
                    tooltip={[
                      'type*value',
                      (type, value) => {
                        return {
                          name: this.headerMap[type],
                          value: value,
                        };
                      },
                    ]}
                  />
                </Chart>
              </div>
            </TabPane>
          </Tabs>
        </div>
        <div className={'dbmid'}>
          <p className={'cdbtitle'}>{intl.get('Issue Report')}</p>
          <Tabs
            activeKey={durationGranularity}
            onChange={this.onChangeTabs.bind(this)}
            type="card"
          >
            {[intl.get('recent week'), intl.get('recent month')].map((d, k) => {
              return (
                <TabPane tab={d} key={k}>
                  <Spin spinning={issueLoading}>
                    <Chart
                      // placeholder={(intl.formatMessage({ id: 'no data' }))}
                      placeholder
                      height={300}
                      data={projectIssueData}
                      scale={cols}
                      forceFit
                      padding={'auto'}
                    >
                      <Legend
                        position="bottom-center"
                        itemFormatter={(val) => {
                          return this.headerMap[val]; // val 为每个图例项的文本值
                        }}
                      />

                      <Axis name="date" />
                      {/* @ts-ignore */}
                      <Axis
                        name="remainingIssueCount"
                        label={label}
                        title={title('remainingIssueCount')}
                      />
                      <Tooltip />
                      <Geom
                        type="line"
                        position="date*value"
                        size={2}
                        color={'type'}
                        tooltip={[
                          'type*value',
                          (type, value) => {
                            return {
                              name: this.headerMap[type],
                              value: value,
                            };
                          },
                        ]}
                      />
                      <Geom
                        type="point"
                        position="date*value"
                        size={3}
                        shape={'circle'}
                        style={{ stroke: '#fff', lineWidth: 1 }}
                        color="type"
                        tooltip={[
                          'type*value',
                          (type, value) => {
                            return {
                              name: this.headerMap[type],
                              value: value,
                            };
                          },
                        ]}
                      />
                    </Chart>
                  </Spin>
                </TabPane>
              );
            })}
            <TabPane
              // activeKey={durationGranularity}
              tab={intl.get('more')}
              key={2}
            >
              <br></br>
              <div style={{ paddingTop: '15px' }}>
                <Chart
                  placeholder
                  height={300}
                  data={projectIssueData}
                  scale={cols}
                  forceFit
                  padding={'auto'}
                >
                  <Legend
                    position="bottom-center"
                    itemFormatter={(val) => {
                      return this.headerMap[val]; // val 为每个图例项的文本值
                    }}
                  />
                  <Axis name="date" />
                  {/* @ts-ignore */}
                  <Axis
                    name="remainingIssueCount"
                    label={label}
                    title={title('remainingIssueCount')}
                  />
                  <Tooltip />
                  <Geom
                    type="line"
                    position="date*value"
                    size={2}
                    color={'type'}
                    tooltip={[
                      'type*value',
                      (type, value) => {
                        return {
                          name: this.headerMap[type],
                          value: value,
                        };
                      },
                    ]}
                  />
                  <Geom
                    type="point"
                    position="date*value"
                    size={3}
                    shape={'circle'}
                    style={{ stroke: '#fff', lineWidth: 1 }}
                    color="type"
                    tooltip={[
                      'type*value',
                      (type, value) => {
                        return {
                          name: this.headerMap[type],
                          value: value,
                        };
                      },
                    ]}
                  />
                </Chart>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default Dashboard;
