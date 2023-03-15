import { useStores } from '@/models';
import { transformScanType } from '@/utils/transformScanType';
import { Checkbox, Divider } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useCallback, useEffect, useState } from 'react';

interface IProps {
  value?: string[];
  onChange?: (selected: string[]) => void; // 用于修改扫描服务
}

const ScanCheckbox: React.FC<IProps> = ({ value, onChange }) => {
  const { userStore } = useStores();
  const [scanOptions, setScanOptions] = useState<string[]>([]);
  // const [checkedList, setCheckedList] = useState<string[]>([]);
  // const [modified, setModified] = useState<boolean>(false);
  const [disable, setDisable] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);
  const [checkAll, setCheckAll] = useState<boolean>(false);

  const queryList = async () => {
    // todo fixme: only issue for FSE
    const allScanTools = ['Issue'];
    if (allScanTools === null || typeof allScanTools === 'boolean') {
      setDisable(true);
      setScanOptions([]);
      setCheckAll(false);
    } else {
      setScanOptions(allScanTools);
      // setCheckedList(defaultValue ?? []);
      setIndeterminate(
        (value ?? []).length < allScanTools.length && (value ?? []).length > 0,
      );
      setCheckAll((value ?? []).length === allScanTools.length);
    }
  };

  const onCheckAllChange = useCallback(
    (e: CheckboxChangeEvent) => {
      const result = e.target.checked ? scanOptions : [];
      // setCheckedList(result);
      setIndeterminate(false);
      setCheckAll(e.target.checked);
      onChange?.(result);
      // setModified(true);
    },
    [onChange, scanOptions],
  );

  const onCheckboxChange = useCallback(
    (list) => {
      // setCheckedList(list);
      setIndeterminate(!!list.length && list.length < scanOptions.length);
      setCheckAll(list.length === scanOptions.length);
      onChange?.(list);
      // setModified(true);
    },
    [onChange, scanOptions.length],
  );

  useEffect(() => {
    queryList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // setCheckedList(defaultValue ?? []);
    setCheckAll((value ?? []).length === scanOptions.length);
    setIndeterminate(
      (value ?? []).length < scanOptions.length && (value ?? []).length > 0,
    );
  }, [value, scanOptions.length]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Checkbox
          indeterminate={indeterminate}
          onChange={onCheckAllChange}
          checked={checkAll}
        >
          All
        </Checkbox>
      </div>
      <Divider style={{ margin: '10px 0' }} />
      <Checkbox.Group
        options={
          scanOptions
            ? scanOptions.map((d) => {
                return {
                  label: transformScanType(d),
                  value: d,
                };
              })
            : ['no scan tools']
        }
        value={value}
        disabled={disable}
        onChange={onCheckboxChange}
      />
    </div>
  );
};

export default ScanCheckbox;
