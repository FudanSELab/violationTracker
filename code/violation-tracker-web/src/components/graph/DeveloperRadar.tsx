import React from 'react';
import { Radar } from '@ant-design/charts';

export type RadarDataItem = {
  name: string;
  star: number;
};

interface IProps {
  data: RadarDataItem[];
}

const DeveloperRadar: React.FC<IProps> = ({ data }) => {
  const config = {
    renderer: 'svg' as 'svg',
    data: data,
    xField: 'name',
    yField: 'star',
    meta: {
      star: {
        alias: '分数',
        min: 0,
        max: 5,
      },
    },
    xAxis: {
      line: null,
      tickLine: null,
    },
    yAxis: {
      label: false,
      grid: {
        alternateColor: 'rgba(0, 0, 0, 0.04)',
      },
    },
    // 开启辅助点
    point: {},
    area: {},
  };
  return <Radar style={{ width: '450px', height: '450px' }} {...config} />;
};

export default DeveloperRadar;
