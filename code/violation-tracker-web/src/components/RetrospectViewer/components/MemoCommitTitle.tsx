import { memo } from 'react';
import intl from 'react-intl-universal';
import { Avatar, Descriptions, Divider, Typography } from 'antd';
import { COLORLIST } from '../../../color';
import ChangeStatusTag from '../../ChangeStatusTag';
import './MemoCommitTitle.less';
import { str2number } from '@/utils/conversion';

type Props = Partial<API.CommitCodeInfoTitle> & { level?: API.TLevel };
// 只有参数改变才重新运行该函数
const MemoCommitTitle = memo<Props>(
  ({
    commitId = '',
    committer = '',
    message = '',
    date = '',
    changeStatus,
    lineBegin = 1,
    level = 'method',
  }: Props) => {
    return (
      <Descriptions column={2}>
        <Descriptions.Item span={2}>
          <div className="summary-line">
            <div>
              <Avatar
                style={{
                  backgroundColor:
                    COLORLIST[str2number(committer) % COLORLIST.length],
                  verticalAlign: 'middle',
                }}
                size="small"
                gap={2}
              >
                {committer[0] ?? ''}
              </Avatar>
              <span style={{ marginLeft: '5px' }}>{committer ?? ''}</span>
            </div>
            <Divider type="vertical" />
            <Typography.Text code>{commitId}</Typography.Text>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label={intl.get('time')} span={2}>
          {date ?? ''}
        </Descriptions.Item>
        {level !== null ? (
          <Descriptions.Item span={2}>
            <details>
              <summary>说明</summary>
              <Typography.Paragraph
                style={{ margin: 0, paddingLeft: '15px' }}
                ellipsis={
                  message.length > 10
                    ? { rows: 2, expandable: true, symbol: 'more' }
                    : false
                }
              >
                "{message ?? '暂无'}"
              </Typography.Paragraph>
            </details>
          </Descriptions.Item>
        ) : null}
        {level !== 'file' && (
          <>
            <Descriptions.Item
              label="实际起始行号"
              style={{ paddingBottom: 0 }}
            >
              {lineBegin ?? 1}
            </Descriptions.Item>
            <Descriptions.Item
              label="与前一个 Commit 的变更关系"
              style={{ paddingBottom: 0 }}
            >
              <ChangeStatusTag status={changeStatus ?? '未知'} />
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    );
  },
);

export default MemoCommitTitle;
