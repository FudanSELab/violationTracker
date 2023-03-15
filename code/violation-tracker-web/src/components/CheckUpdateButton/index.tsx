import { useState } from 'react';
import { Button } from 'antd';
import intl from 'react-intl-universal';

export default function CheckUpdateButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => Promise<boolean>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      type="link"
      size="small"
      onClick={() => {
        setLoading(true);
        onClick().then(() => setLoading(false));
      }}
      disabled={disabled}
      loading={loading}
    >
      {`${intl.get('check update')} | ${intl.get('scanned')}`}
    </Button>
  );
}
