import { Component } from 'react';
import { Chart, Geom, Axis, Tooltip, Legend } from 'bizcharts';
import DataSet from '@antv/data-set';

import './IssueChart.css';

interface IProps {
  chartData?: {
    date: string;
    newIssueCount: number;
    eliminatedIssueCount: number;
    remainingIssueCount: number;
  }[];
}

class IssueChart extends Component<IProps> {
  render() {
    let data = [
      {
        date: '2010-01-01',
        'New Issue': 0,
        'Eliminated Issue': 0,
        'Remaining Issue': 0,
      },
    ];

    if (this.props.chartData) {
      for (var i in this.props.chartData) {
        var dataIndex = parseInt(i);
        data[dataIndex] = {
          date:
            this.props.chartData[i] && this.props.chartData[i].date
              ? this.props.chartData[i].date.slice(0, 10)
              : '',
          'New Issue':
            this.props.chartData[i] && this.props.chartData[i].newIssueCount,
          'Eliminated Issue':
            this.props.chartData[i] &&
            this.props.chartData[i].eliminatedIssueCount,
          'Remaining Issue':
            this.props.chartData[i] &&
            this.props.chartData[i].remainingIssueCount,
        };
      }
    }
    const ds = new DataSet();
    const dv = ds.createView().source(data);
    dv.transform({
      type: 'fold',
      fields: ['New Issue', 'Eliminated Issue', 'Remaining Issue'],
      // 展开字段集
      key: 'city',
      // key字段
      value: 'temperature', // value字段
    });
    const cols = {
      date: {
        range: [0, 1],
      },
    };
    const title = {
      autoRotate: true, // 是否需要自动旋转，默认为 true
      // offset: {Number}, // 设置标题 title 距离坐标轴线的距离
      textStyle: {
        fontSize: '12',
        textAlign: 'center' as 'center',
        fill: '#999',
        fontWeight: 'bold',
        // rotate: {角度}
      }, // 坐标轴文本属性配置
      position: 'end' as 'end', // 标题的位置，**新增**
    };
    return (
      <div id="isschart">
        <Chart height={300} data={dv} scale={cols} forceFit padding={'auto'}>
          <Legend />
          <Axis name="date" title={title} />
          <Axis name="number" />
          <Tooltip
            crosshairs={{
              type: 'y',
            }}
          />
          <Geom
            type="line"
            position="date*temperature"
            size={4}
            color={['city', ['red', 'green', 'yellow']]}
            // color={["New Issue", "#ffffff"]}
          />
          <Geom
            type="point"
            position="date*temperature"
            size={4}
            shape={'circle'}
            color={['city', ['red', 'green', 'yellow']]}
            style={{
              stroke: '#fff',
              lineWidth: 1,
            }}
          />
        </Chart>
      </div>
    );
  }
}
export default IssueChart;
