import ProjectNumericTable, {
  ProjectNumericItem,
} from '@/components/ProjectNumericTable';
import { Button, DatePicker, Divider } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useStores } from '@/models';
import {
  LivingIssueProjectViewData,
  ProjectViewData,
} from '@/services/graph/issue';

import './styles.less';
import moment from 'moment';
import ProjectLinesView from './components/graph';
import { FundOutlined, ToolOutlined } from '@ant-design/icons';
import FormItem from 'antd/lib/form/FormItem';
import ProjectScanTable from '@/components/ProjectScanTable';
import { getBrowserType } from '@/utils/check';
import { getLivingIssueForGraph, getProjectList } from '@/services/issue';

const DATE_FORMAT = 'YYYY-MM-DD';
const Project: React.FC = () => {
  const browser = getBrowserType();
  const { userStore } = useStores();
  const [showNumericTable, setShowNumericTable] = useState<boolean>(false);
  const [dateRange] = useState<string[]>([
    moment()
      .weekday(-1 - 6 * 7)
      .format(DATE_FORMAT),
    moment().weekday(-1).format(DATE_FORMAT),
  ]);

  const [projectBasicList, setProjectBasicList] = useState<API.ProjectItem[]>(
    [],
  );
  const [livingIssueList, setLivingIssueList] = useState<
    LivingIssueProjectViewData[]
  >();
  useEffect(() => {
    // fixme FSE
    let list = getProjectList({}, userStore.userToken);
    setProjectBasicList(list);
    const projectIdList = new Set(list.map(({ projectId }) => +projectId));
    const filterIsFinished = ({ projectId }: ProjectViewData<any>) =>
      projectIdList.has(+projectId);
    const graphParams = {
      // project_ids: '',
      project_ids: list.map(({ projectId }) => projectId).join(','),
      since: dateRange[0],
      until: dateRange[1],
      detail: false,
    };
    getLivingIssueForGraph(graphParams, userStore.userToken).then((data) => {
      if (typeof data !== 'boolean' && data) {
        setLivingIssueList(data.filter(filterIsFinished));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const projectNumericList = useMemo(() => {
    const currentTime = dateRange[1];
    return (projectBasicList.map((basic) => {
      const findSameProjectAndTime = <T extends ProjectViewData<any>>(
        key: string,
        list?: T[],
      ) => {
        if (!list) return undefined;
        return (
          list.find(
            ({ projectName, date }: ProjectViewData<any>) =>
              projectName === basic.projectName && date === currentTime,
          )?.[key] ?? '-'
        );
      };
      return {
        ...basic,
        retainedStaticBug: findSameProjectAndTime('num', livingIssueList),
      };
    }) as unknown) as ProjectNumericItem[];
  }, [dateRange, projectBasicList, livingIssueList]);
  return (
    <div id="project-page">
      <ProjectLinesView
        dataList={{
          livingIssue: livingIssueList,
        }}
      />
      <Divider />
      <FormItem label="Time Range" style={{ marginBottom: '10px' }}>
        <DatePicker.RangePicker
          value={[
            moment(dateRange[0], DATE_FORMAT),
            moment(dateRange[1], DATE_FORMAT),
          ]}
          disabled
        />
      </FormItem>
      <div className="button-switch">
        <Button
          type="link"
          size="large"
          icon={<FundOutlined />}
          style={
            showNumericTable
              ? { opacity: 1, transform: 'scale(1.1)' }
              : { opacity: 0.5, transform: 'scale(0.9)' }
          }
          onClick={() => setShowNumericTable(true)}
        >
          Numeric Table
        </Button>
        <Divider type="vertical" />
        <Button
          type="link"
          size="large"
          icon={<ToolOutlined />}
          style={
            !showNumericTable
              ? { opacity: 1, transform: 'scale(1.1)' }
              : { opacity: 0.5, transform: 'scale(0.9)' }
          }
          onClick={() => setShowNumericTable(false)}
        >
          Scan Table
        </Button>
      </div>
      {browser === 'Chrome' || browser === 'Safari' ? (
        <div className="flip-container">
          <div className={`flipper ${showNumericTable ? '' : 'hover'}`}>
            <ProjectNumericTable
              className="front"
              dataSource={projectNumericList}
            />
            <ProjectScanTable className="back" />
          </div>
        </div>
      ) : (
        <div>
          {showNumericTable ? (
            <ProjectNumericTable dataSource={projectNumericList} />
          ) : (
            <ProjectScanTable />
          )}
        </div>
      )}
    </div>
  );
};

export default Project;
