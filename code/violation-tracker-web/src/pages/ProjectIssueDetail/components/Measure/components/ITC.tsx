import { Component } from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip, Coord, Guide } from 'bizcharts';
import intl from 'react-intl-universal';
import transformIssueName from '../../../../../utils/transformIssueName';
import DataSet from '@antv/data-set';
import { getIssueTypeCountData } from '../../../../../services/measure';
import { handleIssueTypeCountData } from '../util';

interface IProps {
  repoUuid: string;
  signal?: AbortSignal;
}
interface IState {
  sum: any;
  itcData: any;
  itcLoading: any;
}

class ITCDount extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      itcData: [],
      sum: [],
      itcLoading: false,
    };
  }

  UNSAFE_componentWillMount() {
    // 点击项目进入时，等待获取repoId再发送请求
    if (this.props.repoUuid) {
      this.getIssueTypeCount(this.props.repoUuid);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: { repoUuid: string }) {
    if (this.props.repoUuid !== nextProps.repoUuid) {
      this.getIssueTypeCount(nextProps.repoUuid);
    }
  }

  getIssueTypeCount(repoUuid: string) {
    this.setState({ itcLoading: true });
    getIssueTypeCountData(
      {
        tool: sessionStorage.getItem('type') ?? '',
        repo_uuids: repoUuid,
      },
      sessionStorage.getItem('userToken') ?? '',
      this.props.signal,
    ).then((issueTypeCount: any) => {
      this.setState({ itcLoading: false });
      if (!issueTypeCount) return;
      const data = handleIssueTypeCountData(issueTypeCount);
      let sum = 0;
      data.forEach((t) => {
        sum += t.Default;
      });
      data.forEach((value) => {
        value.Issue_Type = transformIssueName(value.Issue_Type);
      });
      const ds = new DataSet();
      const dv = ds.createView().source(data);
      dv.transform({
        type: 'percent',
        field: 'Default',
        dimension: 'Issue_Type',
        as: 'percent',
      });
      this.setState({
        itcData: dv,
        sum,
      });
    });
  }

  render() {
    const { sum, itcData, itcLoading } = this.state;
    const cols = {
      percent: {
        formatter: (val: string) => {
          return (+val * 100).toFixed(2) + '%';
        },
      },
    };
    return (
      <div>
        <Spin spinning={itcLoading}>
          <Chart height={300} width={450} data={itcData} scale={cols}>
            <Coord type={'theta'} radius={1} innerRadius={0.7} />
            <Axis name="percent" />
            <Tooltip
              showTitle={false}
              itemTpl={
                '<li><span style=&quot;background-color:{color};&quot; class=&quot;g2-tooltip-marker&quot;></span>{name}: {value}</li>'
              }
            />
            <Guide>
              <Guide.Html
                position={['50%', '50%']}
                html={
                  '<div style=&quot;color:#8c8c8c;font-size:1.3em;text-align: center;width: 10em;&quot;>' +
                  intl.get('Total') +
                  ': ' +
                  sum +
                  '</div>'
                }
              />
            </Guide>
            <Geom
              type="intervalStack"
              position="percent"
              color="Issue_Type"
              tooltip={[
                'Issue_Type*percent',
                (Issue_Type, percent) => {
                  percent = (percent * 100).toFixed(1);
                  percent = percent + '%';
                  return {
                    name: Issue_Type,
                    value: percent,
                  };
                },
              ]}
              style={{
                lineWidth: 1,
                stroke: '#fff',
              }}
            ></Geom>
          </Chart>
        </Spin>
      </div>
    );
  }
}

export default ITCDount;
