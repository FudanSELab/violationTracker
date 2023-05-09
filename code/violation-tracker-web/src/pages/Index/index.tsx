import React, { useEffect, useMemo, useState } from 'react';
import '@/assets/css/Home.css';
import {
  BarsOutlined,
  ExceptionOutlined,
  FundProjectionScreenOutlined,
} from '@ant-design/icons';
import { Layout, Tabs } from 'antd';
import { parse, stringify } from 'query-string';
import './styles.less';
import Project from './components/Project';
import IssueTable from './components/IssueTable';
import StaticIssueAnalysisTable from './components/StaticIssueAnalysisTable';
import { useHistory } from '../historyContext';

const TabPane = Tabs.TabPane;

// interface IIndexState {
//   type: string;
//   duration: string;
//   month: string;
// }
interface IHistorySearch {
  activeKey: string;
}

export const INDEX_TABS: {
  key: string;
  content: JSX.Element;
  children: JSX.Element;
}[] = [
  {
    key: 'Project',
    content: (
      <span>
        <BarsOutlined />
        Project
      </span>
    ),
    children: (
      <>
        <Project />
      </>
    ),
  },
  {
    key: 'Issue',
    content: (
      <span>
        <ExceptionOutlined />
        Violation Cases
      </span>
    ),
    children: (
      <>
        <div id="issueOverviewTable">
          <IssueTable ignoreManage />
        </div>
      </>
    ),
  },
  {
    key: 'StaticIssue',
    content: (
      <span>
        <FundProjectionScreenOutlined />
        Static Violation Analysis
      </span>
    ),
    children: (
      <>
        <div id="staticIssueAnalysisOverviewTable">
          <StaticIssueAnalysisTable />
        </div>
      </>
    ),
  },
];

const IndexPage: React.FC = () => {
  const { history, location } = useHistory();
  const HISTORY_SEARCH = (parse(location.search) as unknown) as IHistorySearch;
  const [activeKey, setActiveKey] = useState<string>(INDEX_TABS[1].key);
  // const [duration, setDuration] = useState<string>('day');
  // const [month, setMonth] = useState<string>('1');
  // const [type, setType] = useState<string>(
  //   sessionStorage.getItem('type') ?? 'sonarqube',
  // );

  useMemo(() => {
    sessionStorage.setItem('projectName', '');
  }, []);
  useEffect(() => {
    setActiveKey(HISTORY_SEARCH.activeKey ?? INDEX_TABS[1].key);
  }, [HISTORY_SEARCH.activeKey]);

  return (
    <Layout id="developerPanel">
      <Tabs
        activeKey={activeKey}
        centered
        animated={false}
        onChange={(activeKey) => {
          history.replace(
            `${window.location.pathname}?${stringify({ activeKey })}`,
          );
        }}
      >
        {INDEX_TABS.map(({ key, content, children }) => (
          <TabPane tab={content} key={key}>
            {key === activeKey ? children : null}
          </TabPane>
        ))}
      </Tabs>
    </Layout>
  );
};

export default IndexPage;
