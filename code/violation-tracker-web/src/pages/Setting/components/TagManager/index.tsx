import { useStores } from '@/models';
import { deleteExistTag, getTagList } from '@/services/tag';
import { filterRepoOption, mapRepoItem } from '@/utils/table';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import ProTable, { ProColumns } from '@ant-design/pro-table';
import {
  Button,
  Col,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Tag,
} from 'antd';
import { Observer } from 'mobx-react';
import { useCallback, useEffect, useState } from 'react';
import { useMemo } from 'react';
import intl from 'react-intl-universal';
import AddNewTabRule from './components/AddNewTagRule';
import EditTagPage from './components/EditTagPage';
import TagRulesTree from './components/TagRulesTree';
import './styles.less';

// interface SearchParams extends Record<string, any> {
//   tagName: string;
//   page: number;
// }
// interface IHistorySearch {}

// const generateParams = (
//   params: SearchParams,
//   sorter?: { order?: string; asc?: boolean },
// ): { tag_name: string; ps: number; page: number } => {
//   return { tag_name: params.tagName, ps: params.pageSize, page: params.page };
// };

// const PAGE_SIZE = 10;

function getRandomColor() {
  // const COLORLIST = [
  //   '#ff4d4f',
  //   '#ff7a45',
  //   '#ffa940',
  //   '#ffc53d',
  //   '#ffec3d',
  //   '#bae637',
  //   '#73d13d',
  //   '#36cfc9',
  //   '#40a9ff',
  //   '#597ef7',
  //   '#9254de',
  //   '#f759ab',
  //   '#254000',
  //   '#002766',
  //   '#613400',
  //   '#520339',
  // ];
  const COLORLIST = [
    'magenta',
    'red',
    'volcano',
    'orange',
    'gold',
    'lime',
    'green',
    'cyan',
    'blue',
    'geekblue',
    'purple',
  ];
  const MAXNUM = COLORLIST.length;
  const num = Math.round(Math.random() * MAXNUM);
  return COLORLIST[num];
}

const TabManager: React.FC<any> = () => {
  const { userStore, projectStore } = useStores();
  const [visible, setVisible] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [currTagId, setCurrTagId] = useState<string>();
  const [currTagName, setCurrTagName] = useState<string>();
  const [currTagDescription, setCurrTagDescription] = useState<string>();
  const [tagList, setTagList] = useState<API.TagItems[]>([]);
  // const { history, location } = useHistory();
  // const HISTORY_SEARCH = useMemo(
  //   () => (parse(location.search) as unknown) as IHistorySearch,
  //   [location.search],
  // );

  const tagColumns: ProColumns<API.TagItems | any>[] = useMemo(
    () => [
      {
        title: intl.get('repo'),
        dataIndex: 'repoUuid',
        search: false,
        render: (_, { repoUuid }) => {
          const text =
            projectStore.repoList.find(({ repo_id }) => repoUuid === repo_id)
              ?.name ?? repoUuid;
          return text;
        },
        colSize: 2,
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
        title: '标签ID',
        dataIndex: 'id',
        search: false,
        hideInTable: true,
      },
      {
        title: '标签名',
        dataIndex: 'name',
        width: 200,
        // search: false,
        render: (_, record) => {
          return <Tag color={getRandomColor()}>{record.name}</Tag>;
        },
        renderFormItem: (_, { type }, form) => {
          if (type === 'form') {
            return null;
          }
          return (
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={'请选择标签名'}
              options={tagList.map((resp) => {
                return {
                  label: resp.name,
                  value: resp.id,
                };
              })}
            />
          );
        },
      },
      {
        title: '标签描述',
        dataIndex: 'description',
        search: false,
      },
      {
        title: '相关路径',
        dataIndex: 'relativeFilePath',
        search: false,
      },
      {
        title: '操作',
        dataIndex: 'actions',
        search: false,
        width: 200,
        render: (_, record) => {
          return (
            <>
              <Button
                type="link"
                onClick={() => {
                  setShowEdit(true);
                  setCurrTagId(record.id);
                  setCurrTagName(record.name);
                  setCurrTagDescription(record.description);
                }}
              >
                编辑
              </Button>
              <Popconfirm
                title={
                  <>
                    <div>确定要删除这个标签吗?</div>
                    <div>删除标签会使所有含有该标签的缺陷失去改标签</div>
                  </>
                }
                onConfirm={() => {
                  if (userStore?.isMaintainer) {
                    deleteExistTag(record.id, userStore.userToken);
                    reload();
                  } else message.error('无权限删除');
                }}
                okText={intl.get('yes')}
                cancelText={intl.get('no')}
              >
                <Button type="link" danger size="small">
                  <DeleteOutlined />
                </Button>
              </Popconfirm>
            </>
          );
        },
      },
    ],
    // eslint-disable-next-line
    [projectStore, userStore],
  );

  // const queryList = async (
  //   params: SearchParams,
  //   sort: Record<string, SortOrder>,
  //   filter: Record<string, React.ReactText[]>,
  // ) => {
  //   let sortParams = {} as { order?: string; asc?: boolean };
  //   const sortKey = Object.keys(sort)[0];
  //   sortParams.order = sortKey;
  //   sortParams.asc = sort[sortKey] ? sort[sortKey] === 'ascend' : undefined;
  //   params.pageSize = PAGE_SIZE;
  //   const totalParams = generateParams(params, sortParams);
  //   history.replace(
  //     `${window.location.pathname}?${stringify({
  //       ...HISTORY_SEARCH,
  //       ...sortParams,
  //       ...totalParams,
  //     })}`,
  //   );
  // 设置边栏数据
  // const sideMenuOptions = await getIssueTypesCount(
  //   totalParams,
  //   userStore?.userToken,
  // );
  // if (typeof sideMenuOptions !== 'boolean' && sideMenuOptions) {
  //   setSideMenuOptions(sideMenuOptions);
  // }
  // await issueStore?.search(totalParams);
  // setPageTotal(issueStore?.issueTableTotalNumber);
  // return {
  //   data: issueStore?.issueTableList,
  //   total: issueStore?.issueTableTotalNumber,
  //   success: true,
  // };
  // };
  function wait(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, ms);
    });
  }
  const reload = useCallback(async () => {
    await wait(1000);
    getTagList({}, userStore.userToken).then((data) => {
      if (!data || typeof data === 'boolean') return;
      setTagList(data);
    });
  }, [userStore]);

  useEffect(() => {
    if (projectStore.projects === undefined) {
      projectStore.getProjects();
    }
    getTagList({}, userStore.userToken).then((data) => {
      if (!data || typeof data === 'boolean') return;
      setTagList(data);
    });
  }, [projectStore, userStore]);

  return (
    <Observer>
      {() => (
        <>
          <Row gutter={24}>
            <Col span={24}>
              <ProTable<API.TagItems | any>
                className="tab-management-table"
                rowClassName={(_, index) => (index % 2 === 0 ? '' : 'dark')}
                rowKey="id"
                dateFormatter="string"
                headerTitle="标签管理"
                columns={tagColumns}
                dataSource={tagList}
                // request={queryList}
                search={false}
                onReset={reload}
                options={{
                  setting: false,
                  reload: () => reload(),
                }}
                toolbar={{
                  actions: [
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setVisible(true);
                      }}
                    >
                      新建标签
                    </Button>,
                  ],
                }}
                pagination={{
                  pageSize: 10,
                  showTotal: (total: any) =>
                    intl.get('total:') + `${total}` + intl.get('items'),
                  showSizeChanger: false,
                }}
                style={{
                  marginBottom: 15,
                }}
              />
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <TagRulesTree
                tagList={tagList}
                onReload={() => {
                  reload();
                }}
              />
            </Col>
          </Row>
          <Modal
            key="add-new-tag-modal"
            title="新建标签"
            width="40%"
            visible={visible}
            onCancel={() => setVisible(false)}
            footer={false}
          >
            <AddNewTabRule onReload={reload} onDone={() => setVisible(false)} />
          </Modal>
          <Modal
            key="edit-tag-modal"
            title="修改标签"
            width="40%"
            visible={showEdit}
            onCancel={() => setShowEdit(false)}
            footer={null}
          >
            {currTagId && currTagName && currTagDescription ? (
              <EditTagPage
                tagId={currTagId}
                tagName={currTagName}
                tagDescription={currTagDescription}
                onReload={reload}
                onDone={() => setShowEdit(false)}
              />
            ) : null}
          </Modal>
        </>
      )}
    </Observer>
  );
};

export default TabManager;
