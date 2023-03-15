import DownloadButton from '@/components/DownloadButton';
import { useStores } from '@/models';
import { useHistory } from '@/pages/historyContext';
import {
  downloadStaticIssueAnalysisListExcel,
  getStaticIssueAnalysisList,
} from '@/services/issue';
import { arr2str, str2arr } from '@/utils/conversion';
import { filterRepoOption, mapRepoItem } from '@/utils/table';
import ProTable, { ActionType, ProColumnType } from '@ant-design/pro-table';
import { FormInstance, Select } from 'antd';
import { SortOrder } from 'antd/lib/table/interface';
import { observer } from 'mobx-react';
import { parse, stringify } from 'query-string';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';

const pageSize = 10;

interface SearchParams extends Record<string, any> {
  asc?: boolean;
  order?: string;
  page: number;
  ps: number;
  projectName?: string[];
  repoUuid?: string[];
  developer?: string;
}

interface IHistorySearch extends SearchParams {
  developer?: string;
  project_name?: string;
  repo_uuid?: string;
}

const generateParams = (
  params: SearchParams,
): API.StaticIssueAnalysisSearchParams => {
  return {
    project_names: arr2str(params.projectName),
    repo_uuids: arr2str(params.repoUuid),
    developer: params.developer,
    page: params.current,
    ps: params.pageSize,
  };
};

const StaticIssueAnalysisTable = observer(() => {
  const formRef = useRef<FormInstance>();
  const actionRef = useRef<ActionType>();
  const [updateForm, setUpdateForm] = useState<boolean>(false);
  const { userStore, projectStore } = useStores();
  const { history, location } = useHistory();
  const HISTORY_SEARCH = parse(location.search) as IHistorySearch;

  const columns: ProColumnType<API.StaticIssueAnalysisItem>[] = useMemo(
    () => [
      {
        title: intl.get('project name'),
        dataIndex: 'projectName',
        hideInTable: true,
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
                form.resetFields(['repoUuid']);
                setUpdateForm(!updateForm);
              }}
            />
          );
        },
      },
      {
        title: intl.get('repo'),
        dataIndex: 'repoUuid',
        hideInTable: true,
        renderFormItem: (_, { type }, form) => {
          if (type === 'form') {
            return null;
          }
          const projectNames = form.getFieldValue('projectName');
          return (
            <Select
              showSearch
              mode="multiple"
              maxTagCount="responsive"
              placeholder={intl.get('repo filter')}
              options={(Array.isArray(projectNames) && projectNames.length > 0
                ? projectStore.getRepoListByProjectNames(projectNames)
                : projectStore.repoList
              ).map(mapRepoItem)}
              filterOption={filterRepoOption as any}
            />
          );
        },
      },
      {
        title: intl.get('developer'),
        dataIndex: 'developer',
        width: 200,
      },
      {
        title: intl.get('inserted issues') + 'times',
        dataIndex: 'introduceNum',
        width: 200,
        search: false,
      },
      {
        title: intl.get('unsolved inserted issues') + 'times',
        dataIndex: 'selfIntroduceOpenNum',
        width: 200,
        search: false,
      },
      {
        // 解决自己引入缺陷数
        title: intl.get('Solved self') + intl.get('inserted issues') + 'times',
        dataIndex: 'selfIntroduceSelfSolvedNum',
        search: false,
      },
      {
        title: intl.get('others solve') + 'times',
        dataIndex: 'selfIntroduceOthersSolveNum',
        search: false,
      },
      {
        // 引入缺陷生存周期（天）
        title: intl.get('inserted issues') + intl.get('lifeCycle') + '(days)',
        dataIndex: 'selfIntroduceSelfSolvedMiddleNum',
        width: 300,
        search: false,
      },
      {
        title: intl.get('latest inserted issues date'),
        dataIndex: 'lastIntroduceTime',
        width: 200,
        search: false,
      },
      {
        title: intl.get('risk level'),
        dataIndex: 'riskLevel',
        search: false,
        width: 100,
        render: (_, { riskLevel: num }) => {
          if (num !== undefined && typeof num === 'number') {
            return num.toFixed(2);
          } else {
            return 'None';
          }
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      projectStore,
      projectStore.projectNameList,
      projectStore.repoList,
      updateForm,
    ],
  );

  const queryList = async (
    params: SearchParams & {
      pageSize?: number | undefined;
      current?: number | undefined;
      keyword?: string | undefined;
    },
    sort: Record<string, SortOrder>,
  ) => {
    let sortParams = {} as { order?: string; asc?: boolean };
    const sortKey = Object.keys(sort)[0];
    sortParams.order = sortKey;
    sortParams.asc = sort[sortKey] ? sort[sortKey] === 'ascend' : undefined;
    const totalParams = {
      ...sortParams,
      ...generateParams(params),
    };
    history.replace(
      `${window.location.pathname}?${stringify({
        ...HISTORY_SEARCH,
        ...totalParams,
      })}`,
    );
    const resp = await getStaticIssueAnalysisList(
      totalParams,
      userStore.userToken,
    );
    if (resp === null || typeof resp === 'boolean')
      return {
        data: [],
        success: true,
        total: 0,
      };
    return {
      data: resp.rows,
      success: true,
      total: resp.records,
    };
  };

  const onDownload = useCallback(async () => {
    const totalParams = generateParams({
      ...formRef.current?.getFieldsValue([
        'developer',
        'introduceNum',
        'selfIntroduceOpenNum',
        'selfIntroduceSelfSolvedMiddleNum',
        'selfIntroduceOthersSolveNum',
        'selfIntroduceSelfSolvedNum',
        'lastIntroduceTime',
        'riskLevel',
      ]),
    });
    await downloadStaticIssueAnalysisListExcel(
      totalParams,
      userStore.userToken,
    );
    return true;
  }, [userStore.userToken]);

  useEffect(() => {
    formRef.current?.setFields([
      {
        name: 'projectName',
        value: str2arr(HISTORY_SEARCH.project_name),
      },
      {
        name: 'repoUuid',
        value: str2arr(HISTORY_SEARCH.repo_uuid),
      },
      {
        name: 'developer',
        value: HISTORY_SEARCH.developer,
      },
    ]);
  }, [
    HISTORY_SEARCH.developer,
    HISTORY_SEARCH.project_name,
    HISTORY_SEARCH.repo_uuid,
  ]);
  useEffect(() => {
    if (projectStore.projects === undefined) {
      projectStore.getProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ProTable<API.StaticIssueAnalysisItem>
        className="static-issue-analysis-table"
        rowClassName={(_, index) => (index % 2 === 0 ? '' : 'dark')}
        rowKey="developer"
        dateFormatter="string"
        headerTitle="Static defect analysis table"
        actionRef={actionRef}
        columns={columns}
        formRef={formRef}
        // @ts-ignore
        request={queryList}
        // onReset={onReset}
        toolbar={{
          actions: [<DownloadButton onDownload={onDownload} />],
        }}
        options={{
          fullScreen: false,
          density: false,
          reload: true,
          setting: true,
        }}
        pagination={{
          pageSize,
          showSizeChanger: false,
          current: +HISTORY_SEARCH.page,
        }}
      />
    </>
  );
});

export default StaticIssueAnalysisTable;
