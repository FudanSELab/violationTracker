import ProTable, {
  ActionType,
  ListToolBarProps,
  ProColumnType,
} from '@ant-design/pro-table';
import intl from 'react-intl-universal';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import transformIssueName from '@/utils/transformIssueName';
import {
  Button,
  DatePicker,
  FormInstance,
  Modal,
  Pagination,
  Select,
  Switch,
  Tooltip,
} from 'antd';
import { useStores } from '@/models';
import { useHistory } from '@/pages/historyContext';
import { parse, stringify } from 'query-string';
import moment from 'moment';
import StatusRadio from './components/StatusRadio';
import { IssueDescription } from './components/IssueDescription';
import { SortOrder } from 'antd/lib/table/interface';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { disabledDate } from '@/utils/time';
import { downloadExcel, getIssueTypesCount } from '@/services/issue';
import SideMenu from './components/SideMenu';
import { observer } from 'mobx-react';
import { QuestionCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { arr2str, str2arr } from '@/utils/conversion';
import IntroducerSelect from './components/IntroducerSelect';
import Filter from '@/components/Filter';
import DownloadButton from '@/components/DownloadButton';

import './styles.less';
import { ellipsisText } from '@/utils/utils';
import { filterRepoOption, mapRepoItem } from '@/utils/table';

interface IProps {
  ignoreManage: boolean;
  toolbar?: ListToolBarProps;
}
interface SearchParams extends Record<string, any> {
  page?: number;
  projectName?: string[];
  types?: string; // issue types
  startCommitDate?: string[];
  repoId?: string[];
  producer?: string[];
  status?: string[];
  priority?: string[];
  issueUuids?: string;
  solvedTypes?: string;
  tag?: string[];
  exclude?: boolean;
}
interface IHistorySearch extends API.IssueFilterSearchParams {}

const generateParams = (
  params: SearchParams,
  sorter?: { order?: string; asc?: boolean },
): API.IssueFilterSearchParams => {
  let currectOrder = undefined;
  const dataRange = (params.startCommitDate ?? []).map((data) =>
    moment(data).format('YYYY-MM-DD'),
  );
  if (sorter) {
    switch (sorter.order) {
      case 'displayId':
        currectOrder = 'id';
        break;
      case 'type':
        currectOrder = 'type';
        break;
      case 'issueCategory':
        currectOrder = 'issue_category';
        break;
      case 'startCommitDate':
        currectOrder = 'start_commit_date';
        break;
    }
  }
  return {
    order: currectOrder,
    asc: sorter?.asc,
    ps: params.pageSize,
    page: params.page,
    detail: false,
    since: dataRange[0],
    until: dataRange[1],
    repo_uuids: arr2str(params.repoId),
    project_names: arr2str(params.projectName),
    introducer: params.producer,
    status: params.status,
    priority: params.priority,
    types: params.types,
    issue_uuids: params.issueUuids,
    solved_types: params.solvedTypes,
    tag: arr2str(params.tag),
    exclude: params.exclude,
  };
};

const PAGE_SIZE = 10;

const IssueTable = observer(({ ignoreManage, toolbar }: IProps) => {
  const formRef = useRef<FormInstance>();
  const actionRef = useRef<ActionType>();
  const { projectStore, issueStore, userStore } = useStores();
  const { history, location } = useHistory();
  const [updateForm, setUpdateForm] = useState<boolean>(false);
  const [types, setTypes] = useState<string>();
  const [CurrType, setCurrType] = useState<string>();
  const [page, setPage] = useState<number>(1);
  const [pageTotal, setPageTotal] = useState<number>(0);
  const [issueUuids, setIssueUuids] = useState<string>();
  const [sideMenuOptions, setSideMenuOptions] = useState<API.SideMenuItem[]>();
  const [visible, setVisible] = useState<boolean>(false);
  const [showDetailNum, setShowDetailNum] = useState<number>(0);
  const [tagList] = useState<API.TagItems[]>([]);
  const [onExclude, setOnExclude] = useState<boolean>(false);
  const HISTORY_SEARCH = useMemo(
    () => (parse(location.search) as unknown) as IHistorySearch,
    [location.search],
  );
  const columns: ProColumnType<API.IssueItem>[] = useMemo(() => {
    return [
      {
        title: intl.get('number'),
        dataIndex: 'displayId',
        sorter: ({ displayId: a }, { displayId: b }) => a - b,
        search: false,
      },
      {
        title: intl.get('issue_name'),
        dataIndex: 'type',
        sorter: ({ type: a }, { type: b }) => {
          if (a > b) return 1;
          else if (a < b) return -1;
          else return 0;
        },
        render: (_, { type: text }) => ellipsisText(transformIssueName(text)),
        search: false,
      },
      {
        title: intl.get('issue_type'),
        dataIndex: 'issueCategory',
        sorter: ({ issueCategory: a }, { issueCategory: b }) => {
          if (a > b) return 1;
          else if (a < b) return -1;
          else return 0;
        },
        search: false,
      },
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
                form.resetFields(['repoId']);
                form.resetFields(['producer']);
                setUpdateForm(!updateForm);
              }}
            />
          );
        },
      },
      {
        title: intl.get('repo'),
        dataIndex: 'repoId',
        render: (_, { repoUuid: text }) =>
          ellipsisText(
            projectStore.repoList.find(({ repo_id }) => text === repo_id)
              ?.name ?? text,
          ),
        // ellipsisText(
        //   projectStore.repoList.find(({ repoUuid }) => text === repoUuid)
        //     ?.repoName ?? text,
        // ),
        colSize: 2,
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
              onChange={(v) => {
                form.setFieldsValue({ repoId: v });
                form.resetFields(['producer']);
                setUpdateForm(!updateForm);
              }}
            />
          );
        },
      },
      {
        title: intl.get('location'),
        dataIndex: 'targetFiles',
        sorter: false,
        render: (_, { targetFiles: text, type, uuid, repoUuid }) => {
          return (
            <Link
              to={{
                pathname: '/fileTrace',
                search: stringify({
                  repo_uuid: repoUuid,
                  issue_uuid: uuid,
                  type: 'issue',
                  issue_type: type,
                  level: 'file',
                }),
              }}
            >
              {text.split('/')[text.split('/').length - 1]}
            </Link>
            // </Button>
          );
        },
        search: false,
      },
      {
        title: intl.get('Adder'),
        dataIndex: 'producer',
        renderFormItem: (_, { type }, form) => {
          if (type === 'form') {
            return null;
          }
          const repoUuids = form.getFieldValue('repoId');
          const projectNames = form.getFieldValue('projectName');
          let filterRepoUuids = repoUuids;
          if (projectNames && (!repoUuids || repoUuids.length === 0)) {
            filterRepoUuids = projectStore
              .getRepoListByProjectNames(projectNames)
              .map(({ repo_id }) => repo_id);
          }
          const repoStr = (filterRepoUuids ?? []).join(',');
          return <IntroducerSelect repoUuidStr={repoStr} />;
        },
      },
      {
        title: intl.get('Commit Time'),
        dataIndex: 'startCommitDate',
        sorter: ({ startCommitDate: a }, { startCommitDate: b }) =>
          +moment(a) - +moment(b),
        // @ts-ignore
        renderFormItem: (_, { type }) => {
          if (type === 'form') {
            return null;
          }
          return (
            <DatePicker.RangePicker
              ranges={
                Cookies.get('lang') === 'zh-CN'
                  ? {
                      本周: [moment().isoWeekday(1), moment()],
                      本月: [moment().startOf('month'), moment()],
                      上周: [moment().isoWeekday(-6), moment().isoWeekday(0)],
                      上月: [
                        moment().subtract(1, 'months').date(1),
                        moment().startOf('month').date(0),
                      ],
                    }
                  : {
                      'this week': [moment().weekday(0), moment()],
                      'this month': [moment().startOf('month'), moment()],
                      'last week': [moment().weekday(-7), moment().weekday(-1)],
                      'last month': [
                        moment().subtract(1, 'months').date(1),
                        moment().startOf('month').date(0),
                      ],
                    }
              }
              allowClear={true}
              disabledDate={disabledDate}
              format="YYYY-MM-DD"
            />
          );
        },
      },
      {
        title: intl.get('status'),
        dataIndex: 'status',
        // sorter: ({ status: a }, { status: b }) => {
        //   if (a > b) return 1;
        //   else if (a < b) return -1;
        //   else return 0;
        // },
        render: (text: any, record: any) => {
          return ignoreManage && issueStore.ignore && text === 'Open' ? (
            <StatusRadio text={text} record={record} />
          ) : (
            text
          );
        },
        renderFormItem: (_, { type }, form) => {
          if (type === 'form') {
            return null;
          }
          return (
            <Filter
              placeholder={intl.get('status filter')}
              array={(issueStore.statusList ?? []).filter(
                (v) => v !== null && v !== 'Misinformation',
              )}
              // onChange={(v) => {
              //   setUpdateForm(!updateForm);
              //   form.resetFields(['solvedTypes']);
              // }}
            />
          );
        },
      },
      {
        title: intl.get('Solve Way'),
        dataIndex: 'solvedTypes',
        valueType: 'select',
        valueEnum: {
          deleted: intl.get('deleted'),
          notDeleted: intl.get('not deleted'),
        },
        render: (text: any) => {
          if (text !== null && text !== undefined && text !== '') {
            return text;
          }
        },
        hideInTable: true,
      },
      {
        title: intl.get('issue_priority'),
        dataIndex: 'priority',
        // sorter: ({ priority: a }, { priority: b }) => {
        //   if (a > b) return 1;
        //   else if (a < b) return -1;
        //   else return 0;
        // },
        valueType: 'select',
        valueEnum: (issueStore.priorityList ?? [])
          .filter((v) => v !== null)
          .reduce((acc, item) => ({ ...acc, [item]: { text: item } }), {}),
      },
      {
        title: intl.get('actions'),
        dataIndex: 'actions',
        render: (_: any, record, index: number) => {
          return (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setVisible(true);
                setShowDetailNum(index);
                setCurrType(record.type);
              }}
            >
              {intl.get('detail')}
            </Button>
          );
        },
        search: false,
      },
      {
        title: (
          <Switch
            defaultChecked={true}
            checkedChildren={
              <>
                <Tooltip title="Inverse Query" autoAdjustOverflow>
                  <span>
                    Labels in <QuestionCircleOutlined />
                  </span>
                </Tooltip>
              </>
            }
            unCheckedChildren={
              <>
                <Tooltip title="Inverse Query" autoAdjustOverflow>
                  <span>
                    Labels not in <QuestionCircleOutlined />
                  </span>
                </Tooltip>
              </>
            }
            onChange={(value) => {
              setOnExclude(!!!value);
            }}
          />
        ),
        dataIndex: 'tag',
        hideInTable: true,
        // render: (_, { tag: text }) => {
        //   return <Tag>{text}</Tag>;
        // },
        renderFormItem: (_, { type }, form) => {
          if (type === 'form') {
            return null;
          }
          return (
            <Select
              showSearch
              mode="multiple"
              maxTagCount="responsive"
              optionFilterProp="label"
              placeholder={'Label'}
              options={tagList?.map((resp) => ({
                label: resp.name,
                value: resp.id,
              }))}
              onChange={(v) => {
                form.setFieldsValue({ tag: v });
                setUpdateForm(!updateForm);
              }}
            />
          );
        },
      },
    ];
  }, [
    tagList,
    issueStore.priorityList,
    issueStore.ignore,
    issueStore.statusList,
    projectStore,
    updateForm,
    ignoreManage,
  ]);
  const queryList = async (
    params: SearchParams,
    sort: Record<string, SortOrder>,
  ) => {
    let sortParams = {} as { order?: string; asc?: boolean };
    const sortKey = Object.keys(sort)[0];
    if (Object.keys(sort).length === 0) {
      sortParams.order = 'startCommitDate';
      sortParams.asc = false;
    } else {
      sortParams.order = sortKey;
      sortParams.asc = sort[sortKey] ? sort[sortKey] === 'ascend' : undefined;
    }
    params.pageSize = PAGE_SIZE;
    params.exclude = onExclude;
    const totalParams = generateParams(params, sortParams);
    history.replace(
      `${window.location.pathname}?${stringify({
        ...HISTORY_SEARCH,
        ...sortParams,
        ...totalParams,
      })}`,
    );
    // menus data
    const sideMenuOptions = await getIssueTypesCount(
      totalParams,
      userStore?.userToken,
    );
    if (typeof sideMenuOptions !== 'boolean' && sideMenuOptions) {
      setSideMenuOptions(sideMenuOptions);
    }
    await issueStore?.search(totalParams);
    setPageTotal(issueStore?.issueTableTotalNumber);
    return {
      data: issueStore?.issueTableList,
      total: issueStore?.issueTableTotalNumber,
      success: true,
    };
  };
  const onReset = useCallback(() => {
    setTypes(undefined);
    setIssueUuids(undefined);
    setPage(1);
  }, []);
  const onIgnoreStart = useCallback(() => {
    issueStore.setIgnore(true);
  }, [issueStore]);
  const onIgnoreFinish = useCallback(() => {
    if (issueStore.ignoreMap.size === 0) {
      issueStore.setIgnore(false);
      return;
    }
    issueStore.putIgnoreIssueList(userStore.userToken).then(() => {
      issueStore.setIgnore(false);
      actionRef.current?.reload();
    });
  }, [issueStore, userStore.userToken]);
  const onDownload = useCallback(async () => {
    const totalParams = generateParams(
      {
        ...formRef.current?.getFieldsValue([
          'projectName',
          'repoId',
          'startCommitDate',
          'producer',
          'status',
          'priority',
          'solvedTypes',
          'tag',
        ]),
        types,
      },
      { order: HISTORY_SEARCH.order, asc: HISTORY_SEARCH.asc },
    );
    await downloadExcel(totalParams, userStore.userToken);
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, userStore.userToken]);
  useEffect(() => {
    setTypes(HISTORY_SEARCH.types);
    setIssueUuids(HISTORY_SEARCH.issue_uuids);
    formRef.current?.setFields([
      {
        name: 'projectName',
        value: str2arr(HISTORY_SEARCH.project_names),
      },
      {
        name: 'repoId',
        value: str2arr(HISTORY_SEARCH.repo_uuids),
      },
      {
        name: 'startCommitDate',
        value: HISTORY_SEARCH.since
          ? [moment(HISTORY_SEARCH.since), moment(HISTORY_SEARCH.until)]
          : [],
      },
      {
        name: 'producer',
        value: HISTORY_SEARCH.introducer,
      },
      {
        name: 'status',
        value: !HISTORY_SEARCH.status
          ? undefined
          : Array.isArray(HISTORY_SEARCH.status)
          ? HISTORY_SEARCH.status
          : [HISTORY_SEARCH.status],
      },
      {
        name: 'priority',
        value: HISTORY_SEARCH.priority,
      },
      {
        name: 'issueSolution',
        value: HISTORY_SEARCH.solved_types,
      },
      {
        name: 'tag',
        value: HISTORY_SEARCH.tag,
      },
    ]);
    formRef.current?.submit();
  }, [
    HISTORY_SEARCH.introducer,
    HISTORY_SEARCH.issue_uuids,
    HISTORY_SEARCH.priority,
    HISTORY_SEARCH.project_names,
    HISTORY_SEARCH.repo_uuids,
    HISTORY_SEARCH.since,
    HISTORY_SEARCH.solved_types,
    HISTORY_SEARCH.status,
    HISTORY_SEARCH.tag,
    HISTORY_SEARCH.types,
    HISTORY_SEARCH.until,
  ]);
  useEffect(() => {
    // console.log(HISTORY_SEARCH.page);
    setPage(Number.parseInt((HISTORY_SEARCH.page ?? '1') as string));
  }, [HISTORY_SEARCH.page]);
  useEffect(() => {
    if (projectStore.projects === undefined) {
      projectStore.getProjects();
    }
    if (!issueStore.statusList) {
      issueStore.getStatusList(userStore.userToken);
    }
    if (!issueStore.priorityList) {
      issueStore.getPriorityList(userStore.userToken);
    }
    if (tagList) {
      // getTagList({}, userStore.userToken).then((data) => {
      //   if (!data || typeof data === 'boolean') return;
      //   setTagList(data);
      // });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <ProTable<API.IssueItem>
        className="issue-table"
        rowClassName={(_, index) => (index % 2 === 0 ? '' : 'dark')}
        params={{
          types,
          page,
          issueUuids,
        }}
        rowKey="displayId"
        dateFormatter="string"
        headerTitle={intl.get('Static Overview Tables')}
        toolbar={{
          actions: [
            <DownloadButton onDownload={onDownload} />,
            <>
              {ignoreManage && userStore?.isMaintainer ? (
                <Button
                  shape="round"
                  danger
                  onClick={issueStore.ignore ? onIgnoreFinish : onIgnoreStart}
                >
                  <WarningOutlined />
                  {issueStore.ignore ? intl.get('ok') : intl.get('ignore')}
                </Button>
              ) : null}
            </>,
          ],
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        onReset={onReset}
        formRef={formRef}
        actionRef={actionRef}
        request={queryList}
        columns={columns}
        tableRender={(_, dom) => (
          <div
            style={{
              display: 'flex',
              width: '100%',
            }}
          >
            <div
              style={{
                width: '280px',
                marginRight: '10px',
                maxHeight: '100vh',
                overflow: 'auto',
              }}
            >
              <SideMenu
                options={sideMenuOptions ?? []}
                initialSelectedKeys={types}
                onMenuItemChange={(key) => {
                  setTypes(key);
                  setPage(1);
                }}
              />
            </div>
            <div style={{ flex: 1 }}>{dom}</div>
          </div>
        )}
        options={{
          fullScreen: false,
          density: false,
          reload: true,
          setting: true,
        }}
        pagination={false}
        footer={() => (
          <div style={{ textAlign: 'right' }}>
            <Pagination
              size="small"
              pageSize={PAGE_SIZE}
              showSizeChanger={false}
              current={page}
              total={pageTotal}
              showTotal={(total) => `Total ${total}`}
              onChange={(page) => setPage(page)}
            />
          </div>
        )}
      />
      <Modal
        title={intl.get('view-detail')}
        visible={visible}
        // width={'80%'}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        {CurrType ? (
          <IssueDescription
            data={
              issueStore?.issueTableList[
                issueStore?.issueTableList?.length <= showDetailNum
                  ? 0
                  : showDetailNum
              ]
            }
            types={CurrType}
          />
        ) : null}
      </Modal>
    </>
  );
});

export default IssueTable;
