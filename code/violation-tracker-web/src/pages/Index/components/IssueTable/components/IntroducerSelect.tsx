import React, { useEffect } from 'react';
import { Select } from 'antd';
import intl from 'react-intl-universal';
import { useStores } from '@/models';
import { getIssueIntroducers } from '@/services/issue';
import { useDebounce, useFetchState } from '@/utils/hooks';

const IntroducerSelect: React.FC<{
  repoUuidStr: string;
  value?: string;
  onChange?: (v: string) => void;
}> = ({ repoUuidStr, value, onChange }) => {
  const { userStore } = useStores();
  const [introducerList, setIntroducerList] = useFetchState<string[]>([]);
  const getDebounceIssueIntroducers = useDebounce(
    (repoUuidStr, userToken) => {
      getIssueIntroducers(repoUuidStr, userToken).then((introducer) => {
        setIntroducerList(Array.isArray(introducer) ? introducer : []);
      });
    },
    100,
    [setIntroducerList],
  );
  useEffect(() => {
    getDebounceIssueIntroducers(repoUuidStr, userStore.userToken);
  }, [getDebounceIssueIntroducers, repoUuidStr, userStore.userToken]);
  return (
    <Select
      placeholder={intl.get('adder filter')}
      value={value}
      options={introducerList
        .filter((v) => v !== null)
        .map((name) => ({
          label: name,
          value: name,
        }))}
      onChange={onChange}
    />
  );
};

export default IntroducerSelect;
