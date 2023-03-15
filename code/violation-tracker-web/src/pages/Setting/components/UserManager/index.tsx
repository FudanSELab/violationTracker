import React, { useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { Button, Select, message, FormInstance, Switch } from 'antd';
import { useStores } from '@/models';
import { getUsers, putUsers } from '@/services/setting';
import { Observer } from 'mobx-react-lite';
import UserMergeButton from '@/components/UserMergeButton';
import ProTable, { ActionType, ProColumns } from '@ant-design/pro-table';
import { SortOrder } from 'antd/lib/table/interface';
import { useHistory } from '@/pages/historyContext';
import { parse, stringify } from 'query-string';
import { camel2underline } from '@/utils/conversion';

const { Option } = Select;

interface SearchParams extends Record<string, any> {
  status?: boolean;
}

interface IHistorySearch extends SearchParams {
  account_status?: 0 | 1;
}

const generateParams = (params: SearchParams): API.UserDetailSearchParams => {
  return {
    account_status: params?.status ? 0 : 1,
    page: params.current,
    ps: params.pageSize,
  };
};

const mapChangeField = <T, U>(
  field: string,
  transformer: (value: T) => U = (v) => (v as unknown) as U,
) => (list: any[], record: any, value: T) => {
  return list.map((item) => {
    if (item.accountName === record.accountName) {
      return {
        ...item,
        [field]: transformer(value),
      };
    } else {
      return item;
    }
  });
};

const departmentList = [
  { department: '工程开发部' },
  { department: '中科创达' },
  { department: '新致软件' },
];
const statusList = [{ status: '在职' }, { status: '离职' }];
const roleList = [
  { role: '项目负责人' },
  { role: 'Java程序员' },
  { role: '开发经理' },
];

const pageSize = 10;

const UserManager = () => {
  const formRef = useRef<FormInstance>();
  const actionRef = useRef<ActionType>();
  const { userStore, settingStore } = useStores();
  const [changed, setChanged] = useState<boolean>();
  const [changeUserData, setChangeUserData] = useState<any[]>([]);
  const { history, location } = useHistory();
  const HISTORY_SEARCH = parse(location.search) as IHistorySearch;

  // 根据名字搜索人员
  // const onSearch = (value: string) => {
  //   setSearchedAccountName(value);
  // };

  // 修改人员信息
  const updateUser = () => {
    let change = !changed,
      newList: any[] = [];
    for (let item of changeUserData) {
      let needItem = {} as {
        accountName: string;
        role: string;
        dep: string;
        status: number;
      };
      needItem.accountName = item.accountName;
      needItem.role = item.role;
      needItem.dep = item.dep;
      needItem.status = item.status;
      newList.push(needItem);
    }
    setChanged(change);
    putUsers(newList, userStore?.userToken).then((d) => {
      if (d) {
        message.success(intl.get('change successfully'));
        actionRef.current?.reload();
      }
    });
  };

  // 点击或取消 修改人员信息
  const changeUser = () => {
    setChanged(!changed);
  };

  // 显示离职开关
  const filterUser = () => {
    settingStore.setShowDimission(!settingStore.showDimission);
  };

  // 修改人员信息
  const handleChangeStatus = (value: any, record: { accountName: any }) => {
    setChangeUserData(
      mapChangeField('status', (value) => {
        if (value === '在职') {
          return '1';
        } else if (value === '离职') {
          return '0';
        }
      })(changeUserData, record, value),
    );
  };

  const handleChangeRole = (value: any, record: { role: any }) => {
    setChangeUserData(
      mapChangeField('role', (value) => {
        if (value === '项目负责人') {
          return 'LEADER';
        } else if (value === 'Java程序员') {
          return 'DEVELOPER';
        } else if (value === '开发经理') {
          return 'MANAGER';
        }
      })(changeUserData, record, value),
    );
  };

  const handleChangeDepartment = (value: any, record: { dep: any }) => {
    setChangeUserData(mapChangeField('role')(changeUserData, record, value));
  };

  const personColumns: ProColumns<API.UserItem>[] = [
    {
      title: intl.get('Name'),
      dataIndex: 'accountName',
      search: false,
      sorter: (a, b) => {
        if (a.accountName > b.accountName) {
          return 1;
        } else if (a.accountName < b.accountName) {
          return -1;
        } else {
          return 0;
        }
      },
      render: (v) => {
        return <span>{v ? v : intl.get('no data')}</span>;
      },
    },
    {
      title: intl.get('department'),
      dataIndex: 'dep',
      search: false,
      sorter: (a, b) => {
        if ((a.dep ?? 0) > (b.dep ?? 0)) {
          return 1;
        } else if ((a.dep ?? 0) < (b.dep ?? 0)) {
          return -1;
        } else {
          return 0;
        }
      },
      render: (_, record) => {
        return !changed ? (
          <span>{record.dep ? record.dep : intl.get('no data')}</span>
        ) : (
          <Select
            style={{ width: 120 }}
            defaultValue={record.dep ? record.dep : intl.get('no data')}
            onChange={(value) => handleChangeDepartment(value, record)}
          >
            {departmentList.map((element) => (
              <Option value={element.department} title={element.department}>
                {element.department}
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: intl.get('email'),
      dataIndex: 'email',
      search: false,
      render: (v) => {
        return <span>{v ? v : intl.get('no data')}</span>;
      },
    },
    {
      title: intl.get('working status'),
      dataIndex: 'status',
      search: false,
      sorter: (a, b) => {
        if (a.status === intl.get('on the job')) {
          a.status = '1';
        } else if (a.status === intl.get('dimission')) {
          a.status = '0';
        }
        if (b.status === intl.get('on the job')) {
          b.status = '1';
        } else if (b.status === intl.get('dimission')) {
          b.status = '0';
        }
        return (a.status ? +a.status : 0) - (b.status ? +b.status : 0);
      },
      render: (_, record) => {
        return !changed ? (
          <span>
            {record.status
              ? record.status === '1' ||
                record.status === intl.get('on the job')
                ? intl.get('on the job')
                : intl.get('dimission')
              : intl.get('no data')}
          </span>
        ) : (
          <Select
            style={{ width: 80 }}
            defaultValue={
              record.status
                ? record.status === '1' ||
                  record.status === intl.get('on the job')
                  ? intl.get('on the job')
                  : intl.get('dimission')
                : intl.get('no data')
            }
            onChange={(value) => handleChangeStatus(value, record)}
          >
            {statusList.map((element) => (
              <Option value={element.status} title={element.status}>
                {element.status}
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: intl.get('role'),
      dataIndex: 'role',
      search: false,
      sorter: (a, b) => {
        if (a.role === intl.get('Java programmer')) {
          a.role = 'DEVELOPER';
        } else if (a.role === intl.get('project leader')) {
          a.role = 'LEADER';
        } else if (a.role === intl.get('development manager')) {
          a.role = 'MANAGER';
        }
        if (b.role === intl.get('Java programmer')) {
          b.role = 'DEVELOPER';
        } else if (b.role === intl.get('project leader')) {
          b.role = 'LEADER';
        } else if (b.role === intl.get('development manager')) {
          b.role = 'MANAGER';
        }
        return (
          (a.role ? a.role.charCodeAt(0) : 0) -
          (b.role ? b.role.charCodeAt(0) : 0)
        );
      },
      render: (_, record) => {
        let m = '';
        if (
          record.role === 'DEVELOPER' ||
          record.role === intl.get('Java programmer')
        ) {
          m = intl.get('Java programmer');
        } else if (
          record.role === 'LEADER' ||
          record.role === intl.get('project leader')
        ) {
          m = intl.get('project leader');
        } else if (
          record.role === 'MANAGER' ||
          record.role === intl.get('development manager')
        ) {
          m = intl.get('development manager');
        } else {
          m = intl.get('no data');
        }
        return !changed ? (
          <span>{m}</span>
        ) : (
          <Select
            style={{ width: 120 }}
            defaultValue={m}
            onChange={(value) => handleChangeRole(value, record)}
          >
            {roleList.map((element) => (
              <Option value={element.role} title={element.role}>
                {element.role}
              </Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: intl.get('action'),
      render: (_, record) => {
        return (
          <UserMergeButton
            name={record.accountName}
            onMergeSuccess={() => actionRef.current?.reload()}
          />
        );
      },
    },
  ];

  const queryList = async (
    params: SearchParams & {
      pageSize?: number | undefined;
      current?: number | undefined;
      keyword?: string | undefined;
    },
    sort: Record<string, SortOrder>,
  ) => {
    let sortParams = {} as { order?: string; asc?: boolean };
    const sortKey = Object.keys(sort)[0] as string | undefined;
    if (sortKey !== undefined) {
      sortParams.order = camel2underline(sortKey);
      sortParams.asc = sort[sortKey] ? sort[sortKey] === 'ascend' : undefined;
    }

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
    const resp = await getUsers(totalParams, userStore.userToken);
    if (resp === null || typeof resp === 'boolean') {
      setChangeUserData([]);
      return {
        data: [],
        success: true,
        total: 0,
      };
    }
    setChangeUserData(resp.rows);
    return {
      data: resp.rows,
      success: true,
      total: resp.records,
    };
  };

  useEffect(() => {
    formRef.current?.setFields([
      {
        name: 'status',
        value: HISTORY_SEARCH.account_status,
      },
    ]);
  }, [HISTORY_SEARCH.account_status]);
  return (
    <Observer>
      {() => (
        // <div id={'personTable'}>
        <ProTable<API.UserItem>
          rowKey="accountName"
          formRef={formRef}
          actionRef={actionRef}
          headerTitle={intl.get('person list')}
          params={{
            status: settingStore.showDimission,
          }}
          search={false}
          toolbar={{
            actions: [
              <span className={'enabledItem'}>
                <Switch
                  checkedChildren="显示离职人员"
                  unCheckedChildren="显示在职人员"
                  checked={settingStore.showDimission}
                  onChange={() => filterUser()}
                />
              </span>,
              <>
                {changed ? (
                  <>
                    <Button type="primary" onClick={updateUser}>
                      {intl.get('ok')}
                    </Button>
                    <span>&nbsp;</span>
                    <Button onClick={changeUser}>{intl.get('cancel')}</Button>
                  </>
                ) : (
                  <Button onClick={changeUser}>{intl.get('Changed')}</Button>
                )}
              </>,
            ],
          }}
          columns={personColumns}
          // dataSource={(settingStore.showDimission
          //   ? personData
          //   : personData.filter(({ status }) => status === '1')
          // ).filter(({ accountName }) =>
          //   searchedAccountName
          //     ? accountName.includes(searchedAccountName)
          //     : true,
          // )}
          request={queryList}
          options={{
            fullScreen: false,
            density: false,
            reload: true,
            setting: true,
          }}
          pagination={{
            pageSize,
            showSizeChanger: false,
            current: +(HISTORY_SEARCH?.page ?? 1),
          }}
        />
      )}
    </Observer>
  );
};

export default UserManager;
