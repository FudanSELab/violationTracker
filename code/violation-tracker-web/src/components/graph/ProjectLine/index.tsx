import React, { useEffect, useRef } from 'react';
import { Line } from '@ant-design/charts';
import { ProjectViewData } from '@/services/graph/project';
import { Options } from '@ant-design/charts/es/hooks/useChart';
import { useDebounce } from '@/utils/hooks';

interface IProps<T extends ProjectViewData<any>> {
  data: T[];
  yField: string;
  yAxisTitle?: string;
  onElementClick?: (item: T) => void;
}

const ProjectLine = <T extends ProjectViewData<any>>({
  data,
  yField,
  yAxisTitle,
  onElementClick,
}: IProps<T>) => {
  const config = {
    data: data,
    autoFit: true,
    padding: 'auto' as 'auto',
    xField: 'date',
    yField: yField,
    yAxis: {
      title: {
        text: yAxisTitle,
      },
    },
    seriesField: 'projectName',
    legend: { position: 'top' as 'top' },
    smooth: true,
    animation: {
      appear: {
        // animation: 'path-in',
        duration: 3000,
      },
    },
    point: {
      shape: 'circle',
      style: {
        cursor: 'pointer',
      },
    },
  };
  const ref = useRef<Options>();
  const debounceElementClick = useDebounce(
    ({ data }: any) => {
      const item = data.data as T;
      if (onElementClick) onElementClick(item);
    },
    100,
    [onElementClick],
  );
  useEffect(() => {
    if (ref.current) {
      // 点击 point
      ref.current.on('element:click', debounceElementClick);
    }
  }, [debounceElementClick]);
  return (
    <Line
      style={{ height: 320 }}
      tooltip={{
        customItems: (list) =>
          list.map((item) => {
            if ((item.data as any).option !== undefined) {
              return {
                ...item,
                value: `${item.value} (${(item.data as any).option.value}/${
                  (item.data as any).option.total
                })`,
              };
            }
            return item;
          }),
      }}
      {...config}
      // @ts-ignore
      chartRef={ref}
    />
  );
};

export default ProjectLine;
