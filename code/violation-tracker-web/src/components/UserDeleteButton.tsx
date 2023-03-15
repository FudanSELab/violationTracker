import { Button } from 'antd';
import React, { useState } from 'react';
import { useStores } from '@/models';
import { deleteAccountForProject } from '@/services/project';

interface IProps {
  leaderId: string;
  projectId: string;
  onDeleteSuccess?: () => void;
}

export const UserDeleteButton: React.FC<IProps> = ({
  leaderId,
  projectId,
  onDeleteSuccess,
}) => {
  const { userStore } = useStores();
  const [deleting, setDeleting] = useState<boolean>(false);
  const onDelete = (leaderId: string, projectId: string) => {
    setDeleting(true);
    deleteAccountForProject(
      { LeaderId: leaderId, projectId },
      userStore.userToken,
    )
      .then((result) => {
        setDeleting(false);
        if (onDeleteSuccess) onDeleteSuccess();
      })
      .catch((err) => console.error(err));
  };
  return (
    <>
      <Button
        type="link"
        danger
        size="small"
        onClick={() => onDelete(leaderId, projectId)}
        loading={deleting}
      >
        删除
      </Button>
    </>
  );
};
