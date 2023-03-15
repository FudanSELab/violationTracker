import { useStores } from '@/models';
import { filterRepoOption, mapRepositoryItem } from '@/utils/table';
import { Select } from 'antd';
import intl from 'react-intl-universal';

interface IProps {
  projectIds: string[];
  value?: string[];
  onChange?: (v: string[]) => void;
}

const RepositorySelect: React.FC<IProps> = ({
  projectIds,
  value,
  onChange,
}) => {
  const { projectStore } = useStores();
  return (
    <Select
      showSearch
      mode="multiple"
      maxTagCount="responsive"
      placeholder={intl.get('repo filter')}
      options={(Array.isArray(projectIds) && projectIds.length > 0
        ? projectStore.getRepoListByProjectIds(projectIds)
        : projectStore.repositoryList
      ).map(mapRepositoryItem)}
      filterOption={filterRepoOption as any}
      value={value}
      onChange={onChange}
    />
  );
};

export default RepositorySelect;
