import { ProjectViewData } from '@/services/graph/project';
import { Line } from '@ant-design/charts';

interface IProps<T extends ProjectViewData<any>> {
  data: T[];
  yField: string;
}

const MinProjectLine = <T extends ProjectViewData<any>>({
  data,
  yField,
}: IProps<T>) => {
  const config = {
    renderer: 'svg' as 'svg',
    data: data,
    padding: [3, -21],
    xField: 'date',
    yField: yField,
    seriesField: 'projectName',
    xAxis: false as false,
    yAxis: false as false,
    legend: false as false,
    tooltip: false as false,
    smooth: true,
    animation: {
      appear: {
        // animation: 'path-in',
        duration: 3000,
      },
    },
  };
  return (
    <Line
      style={{
        width: 300,
        height: 150,
      }}
      {...config}
    />
  );
};

export default MinProjectLine;
