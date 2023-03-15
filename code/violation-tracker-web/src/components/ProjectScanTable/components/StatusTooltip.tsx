import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  QuestionCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import intl from 'react-intl-universal';
import { Popover } from 'antd';
import { transformScanType } from '@/utils/transformScanType';

const StatusTooltip: React.FC<{ record: API.ProjectScanItem }> = ({
  record,
}) => {
  if (record.scanStatus) {
    let statusContetnt;
    if (record.toolStatuses) {
      statusContetnt = (
        <div>
          {(record.toolStatuses ?? []).map(
            ({ scanStatus, service }, k: number) => {
              let toolStatusType;
              if (scanStatus === 'waiting for scan') {
                toolStatusType = <ClockCircleOutlined />;
              } else if (
                scanStatus === 'analyze failed' ||
                scanStatus === 'invoke tool failed'
              ) {
                toolStatusType = <WarningOutlined />;
              } else if (scanStatus === 'complete') {
                toolStatusType = <CheckCircleOutlined />;
              } else if (scanStatus === 'scanning') {
                toolStatusType = <LoadingOutlined />;
              } else if (scanStatus === 'stop') {
                toolStatusType = <PauseCircleOutlined />;
              } else {
                toolStatusType = <QuestionCircleOutlined />;
              }
              return (
                <table key={`${record.repoUuid}-${k}`}>
                  <tbody>
                    {service !== null ? (
                      <tr>
                        <td>{transformScanType(service)}:</td>
                        {scanStatus !== null ? (
                          <td>{scanStatus}</td>
                        ) : (
                          <td>no data</td>
                        )}
                        <td>{toolStatusType}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              );
            },
          )}
        </div>
      );
    }
    let status = record.scanStatus;
    if (status === undefined || status === null) {
      status = 'not scanned';
    }
    if (status === 'invoke tool failed' || status === 'analyze failed') {
      return (
        <Popover content={statusContetnt} title={intl.get('scan status')}>
          <span>
            <span>{intl.get(status)}</span>
            <WarningOutlined style={{ marginLeft: 10, color: 'red' }} />
          </span>
        </Popover>
      );
    } else if (status === 'waiting for scan') {
      return (
        <Popover content={statusContetnt} title={intl.get('scan status')}>
          <span>
            <span>{intl.get(status)}</span>
            <ClockCircleOutlined style={{ marginLeft: 10 }} />
          </span>
        </Popover>
      );
    } else if (status === 'scanning') {
      return (
        <Popover content={statusContetnt} title={intl.get('scan status')}>
          <span>
            <span>{intl.get('Scanning')}</span>
            <LoadingOutlined style={{ marginLeft: 10 }} />
          </span>
        </Popover>
      );
    } else if (status === 'complete') {
      return (
        <Popover content={statusContetnt} title={intl.get('scan status')}>
          <span>
            {intl.get('scanned') + intl.get('at')}
            <br />
            {record.endScanTime ?? ''}
            <CheckOutlined style={{ marginLeft: 10 }} />
            <br />
            Cost: {record.scanTime + ' s' ?? ''}
          </span>
        </Popover>
      );
    } else {
      return (
        <Popover content={intl.get(status)} title={intl.get('scan status')}>
          <span>{intl.get(status)}</span>
        </Popover>
      );
    }
  } else {
    return (
      <Popover content={intl.get('no data')} title={intl.get('scan status')}>
        <span>{intl.get('no data')}</span>
      </Popover>
    );
  }
};

export default StatusTooltip;
