import { useStores } from '@/models';
import intl from 'react-intl-universal';
import ProTable, { ActionType, ProColumns } from '@ant-design/pro-table';
import { Select } from 'antd';
import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { OverStockButton } from './components/OverStockButton';
import { useHistory } from '@/pages/historyContext';
import StatusTooltip from './components/StatusTooltip';
import { filterRepoOption } from '@/utils/table';
import ScanRepoButton from '../ScanRepoButton';
import { withSkeleton } from '@/utils/utils';
import ScanRestartDrawer from '../ScanRestartDrawer';
import { getRepositoryScanStatus, getProjectList } from '@/services/issue';
import { arr2str } from '@/utils/conversion';

interface SearchParams extends Record<string, any> {
  projectName?: string[];
  repoName?: string[];
  leaders?: string;
}

interface IProps {
  className?: string;
}

const generateParams = (params: SearchParams): API.ProjectScanSearchParams => {
  return {
    project_name: arr2str(params.projectName),
    repo_name: arr2str(params.repoName),
    leaders: params.leaders,
    page: params.current,
    ps: params.pageSize,
  };
};

const pageSize = 10;
const ProjectScanTable: React.FC<IProps> = ({ className }) => {
  const controllerProjectListRef = useRef(new AbortController());
  const actionRef = useRef<ActionType>();
  const { history, location } = useHistory();
  const { projectStore, userStore } = useStores();
  const [updateForm, setUpdateForm] = useState<boolean>();
  const [currentRecord, setCurrentRecord] = useState<string>('');

  const [current, setCurrent] = useState<number>(1);
  const [searchParams, setSearchParams] = useState<any>();
  const [total] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<API.ProjectScanItem[]>([]);
  const showModal = useCallback((v) => {
    setCurrentRecord(v);
  }, []);
  const clearModal = useCallback(() => {
    setCurrentRecord('');
  }, []);
  const loadDataSource = useCallback(
    async (
      params: SearchParams & {
        pageSize?: number | undefined;
        current?: number | undefined;
        keyword?: string | undefined;
      },
    ) => {
      controllerProjectListRef.current.abort();
      controllerProjectListRef.current = new AbortController();
      setLoading(true);
      setDataSource([]);
      const totalParams = generateParams(params);
      // projectStore?.getSearchProjectData(
      //   totalParams,
      //   userStore?.userToken ?? '',
      // );
      const projectsWithLeader = getProjectList(
        { ...totalParams, life_status: 1 },
        userStore?.userToken ?? '',
        controllerProjectListRef.current.signal,
      );
      if (!Array.isArray(projectsWithLeader)) {
        // do nothing
        return;
      }
      const scanStatusResp = await getRepositoryScanStatus(
        {
          page: params.current,
          ps: params.pageSize,
        },
        userStore?.userToken ?? '',
        controllerProjectListRef.current.signal,
      );
      const scanStatusList = Array.isArray(scanStatusResp)
        ? scanStatusResp
        : [];
      const resultList = scanStatusList.map((item) => {
        const project = projectsWithLeader?.find(
          ({ projectName }) => projectName === item.tool,
        );
        // todo 解析 repoScan
        // todo fixme only issue service for FSE
        return {
          ...item,
          projectName: project?.projectName,
          repoUuid: item?.repoUuid,
          totalCommitCount: item?.totalCommitCount,
          scannedCommitCount: item?.scannedCommitCount,
          scanStatus: item?.scanStatus,
          endScanTime: item?.endScanTime,
          scanTime: item?.scanTime,
          overStock:
            (item?.totalCommitCount === undefined
              ? 0
              : item?.totalCommitCount) -
            (item?.scannedCommitCount === undefined
              ? 0
              : item?.scannedCommitCount),
          toolStatuses: [
            {
              service: 'issue',
              scanStatus: item?.scanStatus,
            },
          ],
        };
      });
      // 显示 scan 信息
      setDataSource(resultList as API.ProjectScanItem[]);
      setLoading(false);
    },
    [userStore?.userToken],
  );

  const reload = useCallback(
    (resetPage: boolean = true) => {
      setSearchParams({});
      if (resetPage) {
        setCurrent(1);
      }
      loadDataSource({
        pageSize,
        current: resetPage ? 1 : current,
      });
    },
    [current, loadDataSource],
  );
  const columns: ProColumns<API.ProjectScanItem>[] = useMemo(
    () => [
      {
        title: intl.get('project group'),
        dataIndex: 'tool',
        renderFormItem: (_, { type }, form) => {
          if (type === 'form') {
            return null;
          }
          return (
            <Select
              mode="multiple"
              maxTagCount="responsive"
              placeholder={intl.get('project filter')}
              options={projectStore.projectNameList.map((name) => ({
                label: name,
                value: name,
              }))}
              onChange={(v) => {
                form.setFieldsValue({ projectName: v });
                form.resetFields(['repoName']);
                setUpdateForm(!updateForm);
              }}
            />
          );
        },
      },
      {
        title: intl.get('repo uuid'),
        dataIndex: 'repoUuid',
        colSize: 2,
        renderFormItem: (_, { type }, form) => {
          if (type === 'form') {
            return null;
          }
          const projectNames = form.getFieldValue('repoUuid');
          return (
            <Select
              showSearch
              mode="multiple"
              maxTagCount="responsive"
              placeholder={intl.get('repo filter')}
              options={(Array.isArray(projectNames) && projectNames.length > 0
                ? projectStore.getRepoListByProjectNames(projectNames)
                : projectStore.repoList
              ).map(({ name, repo_id }: API.RepoItem, index: number) =>
                repo_id === null
                  ? {
                      label: `${name}(代码库为空)`,
                      value: `${name}-${index}`,
                    }
                  : {
                      label: name,
                      value: name,
                    },
              )}
              filterOption={filterRepoOption as any}
            />
          );
        },
      },
      {
        title: intl.get('branch'),
        dataIndex: 'branch',
        search: false,
        render: (text) => {
          return <span> {text}</span>;
        },
      },
      {
        title: intl.get('total commits'),
        dataIndex: 'totalCommits',
        search: false,
        render: (_, record) => {
          if (record.totalCommitCount) {
            return record.totalCommitCount;
          } else {
            return intl.get('no data');
          }
        },
      },
      {
        title: intl.get('scanned commits'),
        dataIndex: 'scannedCommits',
        search: false,
        render: (_, record) => {
          if (record.scannedCommitCount) {
            return record.scannedCommitCount;
          } else {
            return intl.get('no data');
          }
        },
      },
      {
        title: intl.get('overStock'),
        dataIndex: 'overStock',
        search: false,
        render: (_, record) => {
          const text = record.overStock;
          return withSkeleton(
            text !== undefined ? (
              <OverStockButton
                data={text}
                onReload={() => {
                  // actionRef.current?.reload(false);
                  reload(false);
                }}
                record={record}
              />
            ) : null,
          );
        },
      },
      {
        title: intl.get('scan status'),
        search: false,
        dataIndex: 'scanStatus',
        colSize: 2,
        render: (_, record) => <StatusTooltip record={record} />,
      },
      {
        title: intl.get('action'),
        key: 'action',
        width: 20,
        className: 'projectList',
        search: false,
        render: (_, record) => {
          return (
            <span>
              <ScanRestartDrawer
                repoUuid={record.repoUuid}
                branch={record.branch}
                scanStatus={record.toolStatuses}
              />
            </span>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      clearModal,
      currentRecord,
      history,
      location.search,
      projectStore,
      projectStore.projectNameList,
      projectStore.repoList,
      showModal,
      updateForm,
      userStore?.isMaintainer,
    ],
  );
  useEffect(() => {
    if (projectStore.projects === undefined) {
      projectStore.getProjects();
    }
    setCurrent(1);
    setSearchParams({});
    loadDataSource({
      pageSize,
      current: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const queryList = useCallback(
  //   async (
  //     params: SearchParams & {
  //       pageSize?: number | undefined;
  //       current?: number | undefined;
  //       keyword?: string | undefined;
  //     },
  //     sort: Record<string, SortOrder>,
  //   ) => {
  //     const totalParams = generateParams(params);
  //     const resp = await projectStore?.getSearchProjectData(
  //       totalParams,
  //       userStore?.userToken ?? '',
  //     );
  //     if (resp === null || typeof resp === 'boolean')
  //       return {
  //         data: [],
  //         success: true,
  //         total: 0,
  //       };
  //     return {
  //       data: resp.rows,
  //       success: true,
  //       total: resp.records,
  //     };
  //   },
  //   [projectStore, userStore?.userToken],
  // );
  return (
    <div className={className}>
      <ProTable<API.ProjectScanItem>
        className="project-scan-table"
        rowClassName={(_, index) => (index % 2 === 0 ? '' : 'dark')}
        rowKey="repoUuid"
        dateFormatter="string"
        headerTitle="Repository List"
        toolBarRender={() => [
          // <Button onClick={() => reload(false)}>test</Button>,
          <ScanRepoButton key="scan-repo" onFinish={() => reload()} />,
          // <AddRepoButton key="add-repo" tick={() => reload()} />,
        ]}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        onSubmit={(params) => {
          setSearchParams(params);
          loadDataSource({
            ...params,
            pageSize,
            current: 1,
          });
        }}
        onReset={reload}
        actionRef={actionRef}
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        options={{
          fullScreen: true,
          density: true,
          reload: () => reload(),
          setting: false,
        }}
        pagination={{
          total,
          current,
          pageSize,
          showSizeChanger: false,
          onChange: (page) => {
            setCurrent(page);
            loadDataSource({
              ...searchParams,
              pageSize,
              current: page,
            });
          },
        }}
      />
    </div>
  );
};

export default ProjectScanTable;
