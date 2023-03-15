import { postRescanIssue, ScanServiceParams } from '@/services/issue';
import { ScanServiceType, transformScanType } from '@/utils/transformScanType';
import { MoreOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Button, Drawer, message } from 'antd';
import { useState } from 'react';

async function restartScanTool(data: ScanServiceParams, type: ScanServiceType) {
  // return Promise.resolve(null);
  switch (type) {
    case 'issue':
      return postRescanIssue(data);
    //   case 'clone':
    //     return scanCloneSerivce(data);
    // case 'codeTracker':
    //   return scanCodeTrackerSerivce(data);
    //   case 'measure':
    //     return scanMeasureSerivce(data);
    //   case 'dependency':
    //     return scanCycleDependSerivce(data);
    //   case 'taskManage':
    //     return scanTaskManageSerivce(data);
    //   case 'tripartiteDependency':
    //     return scanTripartiteDependencySerivce(data);
    default:
      message.warn('该功能未对接完整后端服务');
      return Promise.resolve(null);
  }
}

const ScanRestartDrawer: React.FC<{
  repoUuid?: string;
  repoName?: string;
  branch?: string;
  scanStatus?: {
    service: string;
    scanStatus:
      | 'waiting for scan'
      | 'analyze failed'
      | 'invoke tool failed'
      | 'complete'
      | 'scanning'
      | 'stop'
      | 'failed'
      | 'interrupt';
    // toolName: string;
  }[];
}> = ({ repoName, repoUuid, branch, scanStatus }) => {
  const [visible, setVisible] = useState<boolean>(false);
  // const { userStore } = useStores();
  // const [scanTools, setScanTools] = useState<string[]>([]);
  // const queryList = async () => {
  //   const allScanTools = await getScanTools(userStore.userToken ?? '');
  //   if (allScanTools === null || typeof allScanTools === 'boolean') {
  //     setScanTools([]);
  //   } else {
  //     setScanTools(allScanTools);
  //   }
  // };
  // useEffect(() => {
  //   queryList();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <>
      <Button size="small" type="text" onClick={() => setVisible(true)}>
        <MoreOutlined />
      </Button>
      <Drawer
        title={
          <div>
            Re-scan the repository. Notice: This operate will delete the data of
            the repository.
            <br />
            <i>({repoName})</i>
          </div>
        }
        placement="right"
        width={300}
        onClose={() => setVisible(false)}
        visible={visible}
        getContainer="body"
      >
        <div style={{ margin: '-10px 0' }}>
          {Array.isArray(scanStatus) && scanStatus.length > 0
            ? scanStatus.map(({ service: type, scanStatus }) => {
                return (
                  <div key={type} style={{ margin: '10px 0' }}>
                    <Button
                      size="small"
                      icon={<PoweroffOutlined />}
                      loading={
                        scanStatus === 'waiting for scan' ||
                        scanStatus === 'scanning'
                      }
                      onClick={() =>
                        restartScanTool(
                          {
                            repoUuid,
                            branch,
                          },
                          type as ScanServiceType,
                        )
                      }
                    >
                      Re scan {transformScanType(type)}
                    </Button>
                  </div>
                );
              })
            : 'None'}
        </div>
      </Drawer>
    </>
  );
};

export default ScanRestartDrawer;
