import React from 'react';
import { Popover, Tag, Typography } from 'antd';
import { Avatar } from 'antd';
import { COLORLIST } from '../color';
import { UserDeleteButton } from './UserDeleteButton';
import { str2number } from '@/utils/conversion';
import intl from 'react-intl-universal';

interface IProps {
  leaders: API.AccountSimpleItem[];
  projectId?: string;
  onDidDelete?: () => void;
}

export const LeaderAvatar = React.memo<IProps>(
  ({ leaders, projectId, onDidDelete }) => {
    return (
      <>
        <Avatar.Group>
          {Array.isArray(leaders) && leaders.length > 0 ? (
            leaders.map(
              ({ account_name: accountName, account_uuid: accountUuid }) => (
                <Popover
                  key={accountUuid}
                  title={intl.get('project leader')}
                  content={
                    <>
                      <Typography.Text>{accountName}</Typography.Text>
                      {onDidDelete && projectId ? (
                        <UserDeleteButton
                          leaderId={accountUuid}
                          projectId={projectId}
                          onDeleteSuccess={onDidDelete}
                        />
                      ) : null}
                    </>
                  }
                  placement="top"
                >
                  <Avatar
                    style={{
                      backgroundColor:
                        COLORLIST[str2number(accountName) % COLORLIST.length],
                      verticalAlign: 'middle',
                    }}
                    gap={2}
                  >
                    {accountName[0] ?? ''}
                  </Avatar>
                </Popover>
              ),
            )
          ) : (
            <Tag color="purple">None</Tag>
          )}
        </Avatar.Group>
      </>
    );
  },
);
