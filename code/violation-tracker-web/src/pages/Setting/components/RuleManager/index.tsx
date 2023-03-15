import React from 'react';
import intl from 'react-intl-universal';

const RuleManager: React.FC = () => {
  return (
    <div className={'block2'}>
      <div id={'rule-title'} className={'title'}>
        {intl.get('rules repo management')}
      </div>
      <div className={'block2'}>
        {/* TODO */}
        <div>{intl.get('under development')}</div>
      </div>
    </div>
  );
};

export default RuleManager;
