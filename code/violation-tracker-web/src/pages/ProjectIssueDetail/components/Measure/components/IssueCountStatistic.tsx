import { DatePicker, Tabs } from 'antd';
import intl from 'react-intl-universal';
import React, { useState } from 'react';
import { disabledDate, disabledRangeTime } from '../../../../../utils/time';
import MeasureIssue from './MeasureIssue';
import {
  getCurrentDateForLastWeek,
  getDateforLastNMonth,
  getDateForLastNYear,
} from '../../../../../utils/getDuration';

const { TabPane } = Tabs;

interface IProps {
  repoUuid: string;
}

export const IssueCountStatistic: React.FC<IProps> = ({ repoUuid }) => {
  const [currentDateRange, setCurrentDateRange] = useState<string[]>(
    getCurrentDateForLastWeek(),
  );
  const onChangeTabs = (activeKey: string) => {
    if (activeKey === 'recent week') {
      setCurrentDateRange(getCurrentDateForLastWeek());
    } else if (activeKey === 'recent month') {
      setCurrentDateRange(getDateforLastNMonth(1));
    } else if (activeKey === 'recent year') {
      setCurrentDateRange(getDateForLastNYear(1));
    }
  };
  const onChangeDate = (_: any, dateString: string[]) => {
    setCurrentDateRange(dateString);
  };
  return (
    <div>
      <Tabs
        animated={false}
        defaultActiveKey={'recent week'}
        onChange={onChangeTabs}
        tabPosition={'top'}
      >
        {['recent week', 'recent month', 'recent year', 'more'].map((key) => {
          return (
            <TabPane tab={intl.get(key)} key={key}>
              {key === 'more' ? (
                <DatePicker.RangePicker
                  disabledDate={disabledDate}
                  disabledTime={disabledRangeTime}
                  format="YYYY-MM-DD"
                  onChange={onChangeDate}
                />
              ) : null}
            </TabPane>
          );
        })}
      </Tabs>
      <MeasureIssue
        dateRange={currentDateRange}
        repoUuids={repoUuid}
        // changeDate={this.changeDate.bind(this)}
      />
    </div>
  );
};
