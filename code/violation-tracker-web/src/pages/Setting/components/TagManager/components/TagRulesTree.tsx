import intl from 'react-intl-universal';
import { mapRepoItem } from '@/utils/table';
import {
  Button,
  Card,
  Empty,
  Modal,
  Select,
  Space,
  Tree,
  Typography,
} from 'antd';
import { DataNode, EventDataNode } from 'antd/lib/tree';
import { observer } from 'mobx-react';
import { getCodeAddressByRepo } from '@/services/tag';
import { useStores } from '@/models';
import React, { useState } from 'react';
import {
  CloseSquareOutlined,
  EditOutlined,
  FolderOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import SetTagInPath from './SetTagInPath';

interface IProps {
  tagList: API.TagItems[];
  onReload: () => void;
}

interface WorkFocusTreeItem {
  node: string;
  name: string;
  uuid: string;
  children: DataNode[];
}

function updateTreeData(
  list: DataNode[],
  key: React.Key,
  children: DataNode[],
): DataNode[] {
  return list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });
}

const TagRulesTree: React.FC<any> = observer(
  ({ tagList, onReload }: IProps) => {
    const { userStore, projectStore } = useStores();
    const [currRepoUuid, setCurrRepoUuid] = useState<string>();
    const [visible, setVisible] = useState<boolean>(false);
    // const [currFilePath, setcurrFilePath] = useState<string>();
    const [fileCounts, setFileCounts] = useState<number>(0);
    const [formedTreeList, setFormedTreeList] = useState<WorkFocusTreeItem[]>(
      [],
    );
    const [treeData, setTreeData] = useState<DataNode[]>([]);
    const [checkedNodes, setCheckedNodes] = useState<DataNode[]>([]);
    // const [selectedTag, setSelectedTag] = useState<string>();
    const [disable, setDisable] = useState<boolean>(true);

    const transformTreeNode = (
      workfocusList: WorkFocusTreeItem[],
    ): DataNode[] => {
      return Array.isArray(workfocusList)
        ? workfocusList.map(({ name, uuid, ...rest }) => ({
            key: uuid,
            title: name,
            ...rest,
          }))
        : [];
    };
    const onSelectRepo = (value: string) => {
      setCheckedNodes([]);
      setDisable(true);
      setCurrRepoUuid(value);
      setDisable(false);
      if (value) {
        getCodeAddressByRepo(
          {
            repo_uuid: value,
            file_path: '',
          },
          userStore.userToken,
        ).then((data) => {
          let children = [] as any[];
          if (typeof data !== 'boolean' && data) {
            setFileCounts(data.file_counts);
            for (const [key, value] of Object.entries(data.file_list)) {
              const newList = formedTreeList.splice(formedTreeList.length, 0, {
                uuid: key,
                node: value,
                name: value,
                children: children,
              });
              setFormedTreeList(newList);
            }
            setTreeData(transformTreeNode(formedTreeList));
          }
        });
      }
    };
    const loadTreeNode = (treeNode: EventDataNode) => {
      const { key: metaUuid, node: level } = treeNode as EventDataNode & {
        node: string;
      };
      return getCodeAddressByRepo(
        {
          repo_uuid: currRepoUuid ?? '',
          file_path: level,
        },
        userStore.userToken,
      ).then((data) => {
        let children = [] as any[];
        if (typeof data !== 'boolean' && data) {
          for (const [key, value] of Object.entries(data.file_list)) {
            const newList = formedTreeList.splice(formedTreeList.length, 0, {
              uuid: key,
              node: value,
              name: value,
              children: children,
            });
            setFormedTreeList(newList);
          }
          children = transformTreeNode(formedTreeList);
        }
        setTreeData(updateTreeData(treeData, metaUuid, children));
      });
    };
    const onCheck = (
      Checked:
        | {
            checked: React.Key[];
            halfChecked: React.Key[];
          }
        | React.Key[],
      Info: any,
    ) => {
      if (Info.checkedNodes) {
        setCheckedNodes(Info.checkedNodes);
      }
    };

    return (
      <>
        <Card
          title={`文件树图 (总文件数: ${fileCounts})`}
          extra={
            <Select
              style={{ width: 400 }}
              onChange={onSelectRepo}
              placeholder={intl.get('repo filter')}
              options={projectStore.repoList.map(mapRepoItem)}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          }
          actions={[
            <Button
              key="setTagAction"
              size="large"
              type="link"
              disabled={disable}
              onClick={() => {
                setVisible(true);
              }}
            >
              <EditOutlined />
              设置标签
            </Button>,
            <Button key="removeTagAction" disabled={true} type="link">
              <CloseSquareOutlined />
              取消标签 (待开发...)
            </Button>,
          ]}
          style={{
            marginBottom: 15,
          }}
        >
          {disable ? (
            <Empty
              description={
                <Typography.Text type="danger">
                  请先在右上角选择库
                </Typography.Text>
              }
            />
          ) : (
            <Tree
              showLine
              checkable={true}
              height={600}
              titleRender={({ title }: any) =>
                title ? (
                  <Space>
                    {title.at(-1) !== '/' ? null : <FolderOutlined />}
                    {title}
                    {/* <Tag color="geekblue" style={{ marginLeft: '10px' }}></Tag> */}
                  </Space>
                ) : (
                  <LoadingOutlined />
                )
              }
              treeData={treeData}
              loadData={loadTreeNode}
              onCheck={onCheck}
            />
          )}
        </Card>
        <Modal
          visible={visible}
          onCancel={() => setVisible(false)}
          footer={false}
        >
          <SetTagInPath
            pathList={checkedNodes}
            tagList={tagList}
            repoUuid={currRepoUuid}
            onDone={() => {
              onReload();
              setVisible(false);
            }}
            onRefresh={() => {
              onReload();
            }}
          />
        </Modal>
      </>
    );
  },
);

export default TagRulesTree;
