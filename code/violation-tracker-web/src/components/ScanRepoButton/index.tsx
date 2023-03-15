import { FolderAddOutlined } from '@ant-design/icons';
import { ModalForm, ProFormText } from '@ant-design/pro-form';
import {
  Button,
  Descriptions,
  Divider,
  FormInstance,
  message,
  Typography,
} from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { postScanRepo } from '@/services/issue';
import { useStores } from '@/models';

const ScanRepoButton: React.FC<{
  onFinish: () => void;
}> = ({ onFinish }) => {
  const formRef = useRef<FormInstance>();
  const { userStore } = useStores();
  const [result, setResult] = useState<
    {
      path: string;
      info: string;
    }[]
  >([]);
  const scanIssue = useCallback(async (data, token) => {
    const loadResp = await postScanRepo(data, token);
    if (loadResp !== null) {
      return true;
    } else {
      message.error('Scan failed');
      return false;
    }
  }, []);
  return (
    <ModalForm<{
      repoPath: string;
      repoUuid: string;
      branch: string;
      beginCommit: string;
      endCommit?: string;
    }>
      formRef={formRef}
      title={<>Scan A New Repo</>}
      trigger={
        <Button type="primary" onClick={() => formRef.current?.resetFields()}>
          <FolderAddOutlined /> Scan A New Repo
        </Button>
      }
      onFinish={async (values) => {
        const scanResult = await scanIssue(values, userStore.userToken);
        if (scanResult) {
          message.success('Send Request Success');
        } else {
          message.error('Send Request Failed');
        }
      }}
      onVisibleChange={(visible) => {
        if (visible) {
          setResult([]);
          formRef.current?.setFields([
            {
              name: 'repoPath',
              value: undefined,
            },
            {
              name: 'repoUuid',
              value: undefined,
            },
            {
              name: 'branch',
              value: 'master',
            },

            {
              name: 'beginCommit',
              value: undefined,
            },
            {
              name: 'endCommit',
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
      <ProFormText
        label="Repository Path"
        placeholder="Please enter the path of the repository"
        tooltip={{
          title: 'Tips: Make sure if the repository is in a docker',
          getPopupContainer: () => document.body,
        }}
        name="repoPath"
        rules={[
          {
            required: true,
            message: 'Relative/Absolute path of the repository',
          },
        ]}
      />
      <ProFormText
        label="Repository Uuid"
        placeholder="Please enter the uuid of the repository"
        name="repoUuid"
        tooltip={{
          title: 'Tips: The repository uuid is the repository name',
          getPopupContainer: () => document.body,
        }}
        rules={[
          {
            required: true,
            message: 'Repository uuid is the repo name',
          },
        ]}
      />
      <ProFormText
        label="Branch Name"
        placeholder="Please enter the branch that will be scanned"
        name="branch"
        initialValue="master"
        rules={[
          {
            required: true,
            message: 'The branch of the repository',
          },
        ]}
      />
      <ProFormText
        label="Begin Commit"
        placeholder="Please enter the first revision that you want to start scanning"
        tooltip={{
          title:
            'Tips: The revision you choose is preferably an aggregation point',
          getPopupContainer: () => document.body,
        }}
        name="beginCommit"
        rules={[
          {
            required: true,
            message: 'The revision of the repository',
          },
        ]}
      />
      <ProFormText
        label="End Commit"
        placeholder="Please enter the last revision that you want to end scanning"
        tooltip={{
          title:
            'Tips: The default value is the HEAD revision if you enter nothing',
          getPopupContainer: () => document.body,
        }}
        name="endCommit"
        rules={[
          {
            required: false,
            message: 'The revision of the repository',
          },
        ]}
      />
      {/*<ProForm.Item name="toolNames" label="Tool">*/}
      {/*  <ScanCheckbox />*/}
      {/*</ProForm.Item>*/}
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

export default ScanRepoButton;
