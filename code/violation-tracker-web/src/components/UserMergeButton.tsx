import { useStores } from '@/models';
import {
  getAccountByName,
  mergeAccounts,
  postAccountList,
} from '@/services/user';
import { MergeCellsOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import { UserActionButton } from './UserActionButton';
import UserCreateButton from './UserCreateButton';

interface IProps {
  name: string;
  onMergeSuccess: () => void;
}

const UserMergeButton: React.FC<IProps> = ({ name, onMergeSuccess }) => {
  const { userStore } = useStores();
  const [searchValue, setSearchValue] = React.useState<string>();
  const searchUser = useCallback(
    async (value) => {
      return getAccountByName(
        { account_name: value, need_admin: true },
        userStore.userToken,
      );
    },
    [userStore.userToken],
  );

  const mergeUser = useCallback(
    (subAccountName: string) => async (user: API.Account) => {
      return mergeAccounts(
        { sub_name: subAccountName, major_name: user.accountName },
        userStore.userToken,
      ).then((data) => {
        return Array.isArray(data) ? data.includes(subAccountName) : false;
      });
    },
    [userStore.userToken],
  );

  return (
    <UserActionButton
      search={searchUser}
      action={mergeUser(name)}
      actionText="合并"
      onActionSuccess={onMergeSuccess}
      searchDefaultValue={searchValue}
      options={[
        <UserCreateButton
          key="user-create-btn"
          create={async (gitName) => {
            await postAccountList([gitName]);
            setSearchValue(gitName);
            // 不返回不会关闭弹框
            return true;
          }}
        />,
      ]}
    >
      <MergeCellsOutlined /> 合并到用户
    </UserActionButton>
  );
};

export default UserMergeButton;
