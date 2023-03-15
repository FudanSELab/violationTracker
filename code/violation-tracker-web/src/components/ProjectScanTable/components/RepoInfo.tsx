import intl from 'react-intl-universal';
import { useStores } from '@/models';
import {
  postDownloadRepository,
  putProjectOfRepository,
  putRepository,
} from '@/services/repository';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Descriptions,
  Divider,
  Input,
  message,
  Modal,
  Select,
  Tooltip,
  Typography,
} from 'antd';
import { stringify } from 'query-string';
import ScanCheckbox from './ScanCheckbox';
import {
  DownloadOutlined,
  EditOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import './RepoInfo.less';
import {
  getRepositoryServiceScanValues,
  postRepositoryScanTools,
} from '@/services/scan';
import moment from 'moment';

interface IRepoInfoProps {
  record: {
    leaders?: API.AccountSimpleItem[];
    repoUuid?: string;
    branch?: string;
    scanStatus?: string;
    endScanTime?: string;
    totalCommitCount?: number;
    scannedCommitCount?: number;
    scanTime?: number;
    toolStatuses?: {
      service: string;
      scanStatus: string;
      // toolName: string;
    }[];
    overStock?: number;
  };
  onReload: () => void;
}

const RepoInfo: React.FC<IRepoInfoProps> = ({ record, onReload }) => {
  const { userStore, projectStore } = useStores();
  const [currScanValues, setCurrScanValues] = useState<{
    startCommitTime: string | null;
    usedTool: string[];
  }>();
  const [originalScanValues, setOriginalScanValues] = useState<{
    startCommitTime: string | null;
    usedTool: string[];
  }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [showProjectNameChange, setShowProjectNameChange] = useState<boolean>();
  const [showRepoNameChange, setShowRepoNameChange] = useState<boolean>();
  const [redownloading, setRedownloading] = useState<boolean>(false);
  const onScanFinish = useCallback(
    (startCommitTime: string | null, selected: string[]) => {
      return postRepositoryScanTools(
        {
          repoUuid: record.repoUuid,
          startCommitTime: startCommitTime,
          toolNames: selected,
        },
        userStore.userToken,
      ).then((resp) => {
        if (resp) {
          setCurrScanValues({
            startCommitTime: startCommitTime,
            usedTool: selected,
          });
          setOriginalScanValues({
            startCommitTime: startCommitTime,
            usedTool: selected,
          });
          setLoading(false);
        } else {
          message.error('修改失败');
        }
      });
    },
    [record.repoUuid, userStore.userToken],
  );
  const redownloadRepository = useCallback(
    (value) => {
      setRedownloading(true);
      postDownloadRepository(
        {
          url: value.url,
          branch: value.branch,
        },
        userStore.userToken ?? '',
      ).then((d) => {
        setRedownloading(false);
        if (typeof d === 'boolean' && d) {
          message.success(intl.get('success'));
          onReload();
        } else {
          message.warning('failed');
        }
      });
    },
    [onReload, userStore.userToken],
  );
  useEffect(() => {
    getRepositoryServiceScanValues(
      {
        repo_uuid: record.repoUuid,
      },
      userStore.userToken ?? '',
    ).then((currScanValues) => {
      if (currScanValues === null || typeof currScanValues === 'boolean') {
        setCurrScanValues(undefined);
        setOriginalScanValues(undefined);
      } else {
        setCurrScanValues(currScanValues);
        setOriginalScanValues(currScanValues);
      }
    });
  }, [record.repoUuid, userStore.userToken, onReload]);
  return (
    <>
      <Descriptions column={2}>
        <Descriptions.Item label={intl.get('project name')}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setShowProjectNameChange(true);
            }}
          >
            {/*{record.projectName}*/}
            {userStore?.isMaintainer && (
              <span className="editIcon" id={'projectName' + record.repoUuid}>
                <EditOutlined />
              </span>
            )}
          </Button>
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('repo name')}>
          <Button
            type="link"
            size="small"
            title={intl.get('change')}
            onClick={() => {
              setShowRepoNameChange(true);
            }}
          >
            {/*{(record.repoName ?? '') !== '' && record.repoName !== ' '*/}
            {/*  ? record.repoName*/}
            {/*  : '-'}*/}
            {userStore?.isMaintainer && (
              <span className="editIcon" id={'repoName' + record.repoUuid}>
                <EditOutlined />
              </span>
            )}
          </Button>
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('branch')} span={2}>
          {record.branch}
        </Descriptions.Item>
        {/*<Descriptions.Item label={intl.get('url')} span={2}>*/}
        {/*  <Typography.Text copyable>{record.url}</Typography.Text>*/}
        {/*</Descriptions.Item>*/}
        {/*{record.downloadStatus === 'Downloaded' && (*/}
        {/*  <Descriptions.Item label="文件搜索" span={2}>*/}
        {/*    <Link*/}
        {/*      to={{*/}
        {/*        pathname: '/query/retrospect',*/}
        {/*        search: `?${stringify({*/}
        {/*          repoUuid: record.repoUuid,*/}
        {/*        })}`,*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      <SearchOutlined />*/}
        {/*      点击进入文件追溯搜索*/}
        {/*    </Link>*/}
        {/*    <Link*/}
        {/*      to={{*/}
        {/*        pathname: '/query/change/files',*/}
        {/*        search: `?${stringify({*/}
        {/*          repoUuid: record.repoUuid,*/}
        {/*          url: record.url,*/}
        {/*        })}`,*/}
        {/*      }}*/}
        {/*      // target="_blank"*/}
        {/*    >*/}
        {/*      <SearchOutlined />*/}
        {/*      点击进入 Commit 修改文件搜索*/}
        {/*    </Link>*/}
        {/*  </Descriptions.Item>*/}
        {/*)}*/}
        <Descriptions.Item label={intl.get('update-time')} span={2}>
          {record.endScanTime ?? ''}
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('overStock')} span={2}>
          {record.overStock ?? 0} 个
        </Descriptions.Item>
        {/*<Descriptions.Item label="操作" span={2}>*/}
        {/*  <Button*/}
        {/*    size="small"*/}
        {/*    onClick={() => redownloadRepository(record)}*/}
        {/*    loading={redownloading}*/}
        {/*  >*/}
        {/*    <DownloadOutlined />*/}
        {/*    {record.downloadStatus === 'Downloaded' ||*/}
        {/*    record.downloadStatus === 'Downloading'*/}
        {/*      ? 're'*/}
        {/*      : ''}*/}
        {/*    download the repository*/}
        {/*  </Button>*/}
        {/*</Descriptions.Item>*/}
        {userStore.isMaintainer && (
          <>
            <Descriptions.Item span={2}>
              <Divider style={{ margin: '10px 0' }} />
            </Descriptions.Item>
            <Descriptions.Item
              label="Scan Commit Time"
              span={2}
              labelStyle={{ marginTop: 5 }}
            >
              <DatePicker
                getPopupContainer={() => document.body}
                value={
                  currScanValues?.startCommitTime === null
                    ? undefined
                    : moment(currScanValues?.startCommitTime)
                }
                onChange={(v) => {
                  setCurrScanValues({
                    startCommitTime: v?.format('YYYY-MM-DD') ?? null,
                    usedTool: currScanValues?.usedTool ?? [],
                  });
                }}
                allowClear={true}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Scan Service" span={2}>
              <ScanCheckbox
                value={currScanValues?.usedTool}
                onChange={(v) =>
                  setCurrScanValues({
                    startCommitTime: currScanValues?.startCommitTime ?? null,
                    usedTool: v,
                  })
                }
              />
            </Descriptions.Item>
            {currScanValues?.startCommitTime !==
              originalScanValues?.startCommitTime ||
            currScanValues?.usedTool.length !==
              originalScanValues?.usedTool.length ? (
              <Descriptions.Item>
                <Button
                  type="primary"
                  onClick={() => {
                    setLoading(true);
                    onScanFinish(
                      currScanValues?.startCommitTime ?? null,
                      currScanValues?.usedTool ?? [],
                    );
                  }}
                  shape="round"
                  loading={loading}
                  icon={<UploadOutlined />}
                  // disabled={currScanValues === originalScanValues}
                >
                  Sure?
                </Button>
              </Descriptions.Item>
            ) : null}
          </>
        )}
      </Descriptions>
      {userStore.isMaintainer}
    </>
  );
};

export default RepoInfo;
