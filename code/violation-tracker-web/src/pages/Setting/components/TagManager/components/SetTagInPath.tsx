import { useStores } from '@/models';
import { postSetTagAtFilePaths } from '@/services/tag';
import { Button, Divider, List, message, Modal, Select } from 'antd';
import { DataNode } from 'antd/lib/tree';
import { observer } from 'mobx-react';
import { useState } from 'react';
import AddNewTabRule from './AddNewTagRule';

interface IProps {
  pathList: DataNode[];
  tagList: API.TagItems[];
  repoUuid: string;
  // onSelectedTags: (tag: string | undefined) => void;
  onDone: () => void;
  onRefresh: () => void;
}

const SetTagInPath: React.FC<any> = observer(
  ({ pathList, tagList, repoUuid, onDone, onRefresh }: IProps) => {
    const { userStore } = useStores();
    const [selectedTag, setSelectedTag] = useState<string>();
    const [visible, setVisible] = useState<boolean>(false);

    const onOkForSettingTags = async () => {
      const result = await postSetTagAtFilePaths(
        {
          tagId: selectedTag ?? '',
          repoUuid: repoUuid ?? '',
          filePathList: pathList.map((resp) => resp.title) ?? [],
        },
        userStore.userToken,
      );
      if (result !== null && typeof result !== 'boolean') {
        message.success('标签设置成功！');
        onDone();
      }
    };

    return (
      <>
        <List
          header={<div>已选择以下路径</div>}
          dataSource={pathList}
          // bordered
          renderItem={(item: DataNode, index) => (
            <List.Item>
              <List.Item.Meta title={`路径${index + 1}：${item.title}`} />
            </List.Item>
          )}
          rowKey={(item) => item.key.toString()}
        />
        <Divider />
        <span>
          请选择标签（单个）：
          <Select
            showSearch
            showArrow
            optionFilterProp="label"
            style={{ width: '60%' }}
            options={tagList.map((resp) => {
              return {
                label: resp.name,
                value: resp.id,
              };
            })}
            onSelect={(value) => {
              setSelectedTag(value?.toString());
            }}
          />
        </span>
        <div style={{ marginLeft: '26%' }}>
          <Button type="link" onClick={() => setVisible(true)}>
            没有适合的标签？
          </Button>
        </div>
        <Divider />
        <div style={{ marginLeft: '80%' }}>
          <Button type="primary" onClick={onOkForSettingTags}>
            设置标签
          </Button>
        </div>
        <Modal
          key="add-new-tag-modal"
          title="新建标签"
          width="40%"
          visible={visible}
          onCancel={() => setVisible(false)}
          footer={false}
        >
          <AddNewTabRule
            onReload={() => {
              onRefresh();
            }}
            onDone={() => setVisible(false)}
          />
        </Modal>
      </>
    );
  },
);

export default SetTagInPath;
