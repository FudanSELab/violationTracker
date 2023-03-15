import { DownloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useState } from 'react';

const DownloadButton: React.FC<{
  onDownload: () => Promise<boolean>;
}> = ({ onDownload }) => {
  const [downloading, setDownloading] = useState<boolean>(false);
  const onDownloadClick = () => {
    setDownloading(true);
    onDownload().then(() => setDownloading(false));
  };
  return (
    <Button shape="round" onClick={onDownloadClick} loading={downloading}>
      <DownloadOutlined />
      Download
    </Button>
  );
};

export default DownloadButton;
