import { Avatar, Button, Input, message, Popover } from 'antd';
import React, {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { COLORLIST } from '@/color';
import { str2number } from '@/utils/conversion';

interface IProps {
  options?: ReactNode[];
  search: (value: string) => Promise<API.Account | null>;
  action: (user: API.Account) => Promise<boolean | null>;
  actionText: string;
  onActionSuccess?: () => void;
  searchDefaultValue?: string;
}

export const UserActionButton: React.FC<IProps> = ({
  options,
  children,
  search,
  action,
  actionText,
  onActionSuccess,
  searchDefaultValue,
}) => {
  const [value, setValue] = useState<string>();
  const [account, setAccount] = useState<API.Account>();
  const [searching, setSearching] = useState<boolean>(false);
  const [hoverd, setHoverd] = useState<boolean>(false);
  const [actioning, setActioning] = useState<boolean>(false);
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value ?? '');
  }, []);
  const onSearch = useCallback(
    (value?: string) => {
      if (!value || value === '') return;
      setSearching(true);
      search(value)
        .then((account) => {
          setSearching(false);
          if (!account) {
            message.error('未查找到用户');
            setAccount(undefined);
          } else {
            setAccount(account);
          }
        })
        .catch((err) => console.error(err));
    },
    [search],
  );
  const onActionUser = useCallback(
    (user: API.Account) => {
      setActioning(true);
      action(user)
        .then((result) => {
          setActioning(false);
          if (result) {
            message.success('成功');
            if (onActionSuccess) onActionSuccess();
            setHoverd(false);
          }
        })
        .catch((err) => console.error(err));
    },
    [action, onActionSuccess],
  );
  useEffect(() => {
    if (searchDefaultValue) setValue(searchDefaultValue);
  }, [searchDefaultValue]);
  useEffect(() => {
    onSearch(searchDefaultValue);
  }, [onSearch, searchDefaultValue]);
  return (
    <>
      <Popover
        content={
          <>
            <div style={{ textAlign: 'right' }}>{options}</div>
            <Input.Search
              placeholder="请输入用户名"
              allowClear
              value={value}
              onChange={onChange}
              loading={searching}
              onSearch={onSearch}
              style={{ width: 220 }}
            />
            {account ? (
              <div style={{ margin: '4px', marginTop: '10px' }}>
                <Avatar
                  style={{
                    backgroundColor:
                      COLORLIST[
                        str2number(account?.accountName) % COLORLIST.length
                      ],
                    verticalAlign: 'middle',
                  }}
                  size="small"
                  gap={2}
                >
                  {account?.accountName ? account?.accountName[0] : ''}
                </Avatar>
                <span style={{ marginLeft: '4px' }}>
                  {account.accountName ?? '获取不到内容'}
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => onActionUser(account)}
                  loading={actioning}
                >
                  {actionText}
                </Button>
              </div>
            ) : null}
          </>
        }
        title={children}
        trigger="click"
        visible={hoverd}
        onVisibleChange={(visible) => setHoverd(visible)}
      >
        <Button type="link" size="small">
          {children}
        </Button>
      </Popover>
    </>
  );
};
