import { useStores } from '@/models';
import { Select } from 'antd';
import intl from 'react-intl-universal';

interface IProps {
  value?: string[];
  onChange?: (v: string[]) => void;
}

const ProjectSelect: React.FC<IProps> = ({ value, onChange }) => {
  const { projectStore } = useStores();
  return (
    <Select
      mode="multiple"
      maxTagCount="responsive"
      placeholder={intl.get('project filter')}
      options={projectStore?.projectSimpleList.map(
        ({ projectName, projectId }) => ({
          label: projectName,
          value: `${projectId}`,
        }),
      )}
      value={value}
      onChange={onChange}
    />
  );
};

export default ProjectSelect;
