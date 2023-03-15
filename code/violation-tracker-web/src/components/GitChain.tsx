import * as React from 'react';
import { Steps, Tag, Typography } from 'antd';
import {
  BugTwoTone,
  CheckCircleTwoTone,
  FireOutlined,
  PlusCircleTwoTone,
  StopTwoTone,
} from '@ant-design/icons';

const { Step } = Steps;

interface IProps {
  commitInfoList: API.HistoryCommitChain[];
  retrospectCommitList: string[];
  currentCommitIdx: number;
  onClick: (idx: number) => void;
}

const GitChain: React.FC<IProps> = ({
  commitInfoList,
  retrospectCommitList,
  currentCommitIdx,
  onClick,
}) => {
  return (
    <Steps
      style={{ paddingLeft: '4px' }}
      progressDot={(dot: any, { index }: { index: number }) => {
        return retrospectCommitList.includes(commitInfoList[index].commitId) ? (
          <FireOutlined
            style={{
              color: 'red',
              position: 'relative',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ) : (
          dot
        );
      }}
      current={currentCommitIdx}
      direction="vertical"
    >
      {commitInfoList.map(({ commitId, date, status }, idx) => (
        <Step
          key={`${commitId}-${idx}`}
          style={{ cursor: 'pointer' }}
          status={
            idx >= currentCommitIdx
              ? 'finish'
              : // : idx === currentCommitIdx
                // ? 'process'
                'wait'
          }
          description={
            <>
              <Typography.Text
                code
                title={commitId}
                copyable={{ text: commitId }}
                style={{ color: status === 'failed' ? '#de1c31' : 'initial' }}
              >
                {((commitId as string) ?? '').substr(0, 10)}...
              </Typography.Text>
              <Typography.Text
                style={{ color: status === 'failed' ? '#de1c31' : 'initial' }}
              >
                {date as string}
              </Typography.Text>
              {status === 'failed' && (
                <StopTwoTone
                  style={{ marginLeft: '7px' }}
                  twoToneColor="#de1c31"
                />
              )}
              {status === 'bug_add' && (
                <PlusCircleTwoTone
                  style={{ margin: '0 3px' }}
                  twoToneColor="#de1c31"
                />
              )}
              {status === 'bug_changed' && (
                <BugTwoTone
                  style={{ margin: '0 3px' }}
                  twoToneColor="#de1c31"
                />
              )}
              {status === 'bug_may_changed' && (
                <BugTwoTone style={{ margin: '0 3px' }} />
              )}
              {status === 'solved' && (
                <CheckCircleTwoTone
                  style={{ marginLeft: '7px' }}
                  twoToneColor="#52c41a"
                />
              )}
              {idx === 0 && (
                <>
                  <br />
                  <Tag color="green" style={{ marginLeft: '0.2em' }}>
                    latest
                  </Tag>
                </>
              )}
            </>
          }
          onClick={() => onClick(idx)}
        />
      ))}
    </Steps>
  );
};

export default GitChain;
