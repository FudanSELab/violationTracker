import { CloudUploadOutlined } from '@ant-design/icons';
import ProForm, { ModalForm, ProFormText } from '@ant-design/pro-form';
import {
  Button,
  DatePicker,
  Descriptions,
  Divider,
  FormInstance,
  message,
  Select,
  Typography,
  // Upload,
} from 'antd';
import { useCallback, useRef, useState } from 'react';
import {
  // postLocalImportMultiRepo,
  postLocalImportRepo,
} from '@/services/repository';
import { useStores } from '@/models';
import ScanCheckbox from '../ProjectScanTable/components/ScanCheckbox';
import { postInitialScanTools } from '@/services/scan';

// const normFile = (e: any) => {
//   if (Array.isArray(e)) {
//     return e[0];
//   }
//   return e && e.fileList[0];
// };

const LocalImportRepoButton: React.FC<{
  onFinish: () => void;
}> = ({ onFinish }) => {
  const formRef = useRef<FormInstance>();
  const { projectStore, userStore } = useStores();
  const [result, setResult] = useState<
    {
      path: string;
      info: string;
    }[]
  >([]);
  // const [multi, setMulti] = useState<boolean>(false);
  // const multiLocalImport = useCallback(
  //   async ({ project_name, file }, token) => {
  //     const data = new FormData();
  //     data.append('file', file.originFileObj);
  //     const resp = await postLocalImportMultiRepo(
  //       {
  //         project_name,
  //       },
  //       data,
  //       token,
  //     );
  //     if (resp !== null && typeof resp !== 'boolean') {
  //       const result = Object.keys(resp).map((key) => ({
  //         path: key,
  //         info: resp[key],
  //       }));
  //       setResult(result);
  //       onFinish();
  //     } else {
  //       message.error('本地导入失败');
  //     }
  //     return false;
  //   },
  //   [onFinish],
  // );
  const localImport = useCallback(
    async ({ project_name, path }, startCommitTime, token) => {
      const loadResp = await postLocalImportRepo(
        {
          project_name,
          path,
          addCommitTime: startCommitTime,
        },
        token,
      );
      if (loadResp !== null) {
        onFinish();
        return true;
      } else {
        message.error('本地导入失败');
        return false;
      }
    },
    [onFinish],
  );
  const onSubmit = useCallback(
    async ({ toolNames, startCommitTime, ...rest }) => {
      const setScanToolResp = await postInitialScanTools(
        {
          address: rest.path,
          startCommitTime,
          toolNames,
        },
        userStore.userToken ?? '',
      );
      if (setScanToolResp === null) {
        message.error('Scan failed, please retry later!');
        return false;
      }
      // if (multi) {
      //   return multiLocalImport(rest, userStore.userToken);
      // } else {
      return localImport(rest, startCommitTime, userStore.userToken);
      // }
    },
    [localImport, userStore.userToken],
  );
  return (
    <ModalForm<{
      project_name: string;
      startCommitTime: string;
      toolNames: string[];
      path: string;
    }>
      formRef={formRef}
      title={
        <>
          Add Local Repo
          {/* <Radio.Group
            style={{ marginLeft: 10 }}
            options={[
              { label: '批量加库', value: true },
              { label: '单独加库', value: false },
            ]}
            onChange={({ target: { value } }: RadioChangeEvent) =>
              setMulti(value)
            }
            value={multi}
          /> */}
        </>
      }
      trigger={
        <Button type="dashed" onClick={() => formRef.current?.resetFields()}>
          <CloudUploadOutlined /> Add Local Repo
        </Button>
      }
      onFinish={onSubmit}
      onVisibleChange={(visible) => {
        if (visible) {
          setResult([]);
          formRef.current?.setFields([
            {
              name: 'project_name',
              value: undefined,
            },
          ]);
        }
      }}
      modalProps={{
        getContainer: 'body',
        okText: 'Done',
      }}
    >
      <ProForm.Item
        label="Select the project group"
        name="project_name"
        style={{ width: '60%' }}
        rules={[
          {
            required: true,
            message: 'Please select the group',
          },
        ]}
      >
        <Select
          getPopupContainer={() => document.body}
          options={projectStore?.projectNameList.map((projectName) => ({
            label: projectName,
            value: projectName,
          }))}
          placeholder="Please select the group"
        />
      </ProForm.Item>
      <ProForm.Item name="startCommitTime" label="Start Commit Time">
        <DatePicker getPopupContainer={() => document.body} />
      </ProForm.Item>
      <ProForm.Item name="toolNames" label="Tool">
        <ScanCheckbox />
      </ProForm.Item>
      {/* {multi ? (
        <ProForm.Item
          label={
            <>
              选择导入文件
              <a
                href={demo}
                download="repo_path模版"
                style={{ marginLeft: '10px' }}
              >
                下载模版文件
              </a>
            </>
          }
          name="file"
          rules={[
            {
              required: true,
              message: '请选择导入文件',
            },
          ]}
          getValueFromEvent={normFile}
        >
          <Upload accept=".txt" maxCount={1} beforeUpload={() => false}>
            <Button>点击导入</Button>
          </Upload>
        </ProForm.Item>
      ) : ( */}
      <ProFormText
        label="Absolute path of the repository"
        tooltip={{
          title: 'Tips: make sure if the repository is in a docker',
          getPopupContainer: () => document.body,
        }}
        name="path"
        rules={[
          {
            required: true,
            message: 'Absolute path of the repository',
          },
        ]}
      />
      {/* )} */}
      {Array.isArray(result) && result.length > 0 && (
        <>
          <Divider />
          <Descriptions
            title="Result"
            column={2}
            style={{ maxHeight: 200, overflow: 'auto' }}
          >
            {result.map(({ path, info }, index) => (
              <>
                <Descriptions.Item key={path + index} label="Path">
                  <Typography.Text code>{path}</Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item key={info + index} label="Result">
                  {info}
                </Descriptions.Item>
              </>
            ))}
          </Descriptions>
        </>
      )}
    </ModalForm>
  );
};

export default LocalImportRepoButton;
