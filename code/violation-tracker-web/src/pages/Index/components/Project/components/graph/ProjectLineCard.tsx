import ProjectLine from '@/components/graph/ProjectLine';
import { ProjectViewData } from '@/services/graph/project';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Result, Skeleton, Tooltip } from 'antd';
import { LabelTooltipType } from 'antd/lib/form/FormItemLabel';
import React, { useMemo, useState } from 'react';
import { quickSort, toTooltipProps } from './utils';

interface IProps<T extends ProjectViewData<any>> {
  title: string;
  tooltip?: LabelTooltipType;
  data?: T[];
  yField: string;
  yAxisTitle?: string;
  onElementClick?: (item: T) => void;
  // children?: never[] | ((item: T) => JSX.Element);
}

const ProjectLineCard = <T extends ProjectViewData<any>>({
  title,
  tooltip,
  data,
  yField,
  yAxisTitle,
  onElementClick,
}: IProps<T>) => {
  // const [showDetail, setShowDetail] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(true);
  // const [item, setItem] = useState<T>();
  const projectNums = useMemo(() => {
    const projectNumList: { project: string; num: number }[] = [];
    (data ?? [])
      .reduce((acc, item) => {
        if (!acc.has(item.projectName)) {
          acc.set(item.projectName, 0);
        }
        if (acc.has(item.projectName)) {
          acc.set(
            item.projectName,
            (acc.get(item.projectName) as number) + +item[yField],
          );
        }
        return acc;
      }, new Map<string, number>())
      .forEach((value, key) => {
        projectNumList.push({
          project: key,
          num: value,
        });
      });
    return projectNumList;
  }, [data, yField]);
  const dataSorted = useMemo(() => {
    if (!data) return [];
    return quickSort(projectNums, 0, projectNums.length)
      .map(({ project }) =>
        data.filter(({ projectName }) => projectName === project),
      )
      .flat();
  }, [data, projectNums]);
  const detailLimitZero = useMemo(() => {
    if (!dataSorted) return [];
    let notZeroProjects: string[] = [];
    projectNums
      .filter(({ num }) => num > 0)
      .forEach(({ project }) => notZeroProjects.push(project));
    return (
      dataSorted.filter(({ projectName }) =>
        notZeroProjects.includes(projectName),
      ) ?? []
    );
  }, [dataSorted, projectNums]);
  let tooltipNode = null;
  const tooltipProps = toTooltipProps(tooltip);
  if (tooltipProps) {
    const {
      icon = <QuestionCircleOutlined />,
      ...restTooltipProps
    } = tooltipProps;
    tooltipNode = (
      <Tooltip {...restTooltipProps}>{React.cloneElement(icon)}</Tooltip>
    );
  }
  return Array.isArray(data) ? (
    data.length > 0 ? (
      <Card
        title={
          <>
            {title}
            {tooltipNode}
            <Button
              style={{ marginLeft: '10px' }}
              size="small"
              shape="round"
              icon={showAll ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Only zero' : 'Show all'}
            </Button>
          </>
        }
        style={{ margin: '5px' }}
      >
        <ProjectLine
          data={showAll ? dataSorted : detailLimitZero}
          yField={yField}
          yAxisTitle={yAxisTitle}
          onElementClick={onElementClick}
        />
      </Card>
    ) : (
      <Card className="project-line-card-skeleton">
        <Result style={{ padding: '15px' }} status="404" subTitle="暂无数据" />
      </Card>
    )
  ) : (
    <Card className="project-line-card-skeleton">
      <Skeleton title={{ width: 160 }} paragraph={false} active />
      <Skeleton.Image style={{ width: '100%', height: '300px' }} />
    </Card>
  );
};

export default ProjectLineCard;
