import { useStores } from '@/models';
import { withSkeleton } from '@/utils/utils';
import ProTable, { ProColumns } from '@ant-design/pro-table';
import React, { useEffect } from 'react';
import intl from 'react-intl-universal';

import './styles.less';

const pageSize = 10;
export type ProjectNumericItem = {
  projectId: string;
  projectName: string;
  commitStandard: string;
  cloneRate: string;
  dependencyRate: string;
  retainedStaticBug: string;
  ccnMethods: string;
  highChangeFiles: string;
  largeFiles: string;
  cycleDependency: string;
};

interface IProps {
  className?: string;
  dataSource: ProjectNumericItem[];
}

const ProjectNumericTable: React.FC<IProps> = ({ className, dataSource }) => {
  // const { userStore } = useStores();
  const { projectStore } = useStores();
  const columns: ProColumns<ProjectNumericItem>[] = [
    {
      title: intl.get('project name'),
      dataIndex: 'projectName',
    },
    {
      title: intl.get('Submission specification'),
      dataIndex: 'commitStandard',
      sorter: ({ commitStandard: a }, { commitStandard: b }) => +a - +b,
      render: (_, { commitStandard }) => {
        return withSkeleton(commitStandard);
      },
    },
    {
      title: 'Living Issues',
      dataIndex: 'retainedStaticBug',
      sorter: ({ retainedStaticBug: a }, { retainedStaticBug: b }) => +a - +b,
      render: (_, { retainedStaticBug }) => {
        return withSkeleton(retainedStaticBug);
      },
    },
  ];
  useEffect(() => {
    if (projectStore.projects === undefined) {
      projectStore.getProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // const search
  return (
    <div className={className}>
      <ProTable<ProjectNumericItem>
        className="project-numeric-table"
        rowClassName={(_, index) => (index % 2 === 0 ? '' : 'dark')}
        rowKey={'projectId'}
        dateFormatter="string"
        headerTitle="Project Detail"
        search={false}
        dataSource={dataSource}
        columns={columns}
        options={{
          fullScreen: true,
          density: true,
          reload: false,
          setting: true,
        }}
        pagination={{ pageSize, showSizeChanger: false }}
      />
    </div>
  );
};

export default ProjectNumericTable;
