import { useHistory } from '@/pages/historyContext';
import { INDEX_TABS } from '@/pages/Index';
import { LivingIssueProjectViewData } from '@/services/graph/project';
import { SmileOutlined } from '@ant-design/icons';
import { Carousel, Radio, Result } from 'antd';
import { CarouselRef } from 'antd/lib/carousel';
import { stringify } from 'query-string';
import React, { useMemo, useRef, useState } from 'react';
import ProjectLineCard from './ProjectLineCard';

import './styles.less';

type ProjectLineType = 'livingIssue';
interface IProps {
  dataList: {
    livingIssue?: LivingIssueProjectViewData[];
  };
}

const ProjectLinesView: React.FC<IProps> = ({ dataList }) => {
  let slickRef = useRef<CarouselRef>(null);
  const { history } = useHistory();
  const [slickValue, setSlickValue] = useState<number>(0);
  const PROJECT_LINES: {
    type: ProjectLineType;
    title: string;
    yField: string;
    tooltip?: string;
    yAxisTitle: string;
    onClick: (item: any) => void;
  }[] = useMemo(
    () => [
      {
        type: 'livingIssue',
        title: 'Remaining Violations',
        yAxisTitle: 'violations',
        yField: 'num',
        onClick: (item: LivingIssueProjectViewData) => {
          if (!item.projectId || item.num === 0) {
            console.warn('无数据');
            return;
          }
          history.push({
            pathname: '/',
            search: `?${stringify({
              activeKey: INDEX_TABS[2].key,
              project_names: item.projectName,
              // since: moment(item.date).weekday(-7).format('YYYY-MM-DD'), // 提交开始时间
              // until: item.date, // 提交结束时间
            })}`,
          });
        },
      },
    ],
    [history],
  );
  return (
    <div className="project-lines-view">
      <Radio.Group
        optionType="button"
        value={slickValue}
        options={PROJECT_LINES.map(({ title: label }, value) => ({
          label,
          value,
        }))}
        onChange={(v) => {
          setSlickValue(v.target.value);
          slickRef.current?.goTo(v.target.value);
        }}
      />
      <Carousel
        {...{
          // centerMode: true,
          infinite: false,
          centerPadding: '60px',
          slidesToShow: 1,
          draggable: true,
          dots: false,
          afterChange: (index) => setSlickValue(index),
        }}
        className="project-graph-slick"
        ref={slickRef}
      >
        {PROJECT_LINES.map(
          ({ type, title, yField, yAxisTitle, tooltip, onClick }) => {
            return (
              <div key={type}>
                <ProjectLineCard
                  title={title}
                  data={dataList[type as ProjectLineType] as any}
                  yField={yField}
                  tooltip={tooltip}
                  yAxisTitle={yAxisTitle}
                  onElementClick={onClick}
                />
              </div>
            );
          },
        )}
        <div>
          <Result
            style={{
              height: '400px',
              width: '-moz-max-content',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
            icon={<SmileOutlined />}
            title="Done"
          />
        </div>
      </Carousel>
    </div>
  );
};

export default ProjectLinesView;
