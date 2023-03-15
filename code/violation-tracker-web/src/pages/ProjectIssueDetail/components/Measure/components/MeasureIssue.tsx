import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import intl from 'react-intl-universal';
import { getCodeQualityData } from '../../../../../services/measure';
import { useStores } from '../../../../../models';

const originalSetItem = sessionStorage.setItem;
sessionStorage.setItem = function (key, newValue) {
  const setItemEvent = new Event('update');
  //@ts-ignore
  setItemEvent.key = key;
  //@ts-ignore
  setItemEvent.newValue = newValue;
  window.dispatchEvent(setItemEvent);
  //@ts-ignore
  originalSetItem.apply(this, arguments);
};
// let loading = true;

interface IProps {
  // changeDate: (dateString: string[]) => void;
  dateRange: string[];
  repoUuids: string;
}

export const MeasureIssue: React.FC<IProps> = ({ dateRange, repoUuids }) => {
  const { userStore } = useStores();
  // const controller: AbortController = new window.AbortController();
  const [loading, setLoading] = useState<boolean>(false);
  const [allCodeQuality, setAllCodeQuality] = useState<
    API.DeveloperAllCodeQuality | undefined
  >();

  const getData = useCallback(
    (dateRange: string[]) => {
      setLoading(true);
      getCodeQualityData<API.DeveloperAllCodeQuality>(
        {
          repo_uuids: repoUuids,
          since: dateRange[0] ?? '',
          until: dateRange[1] ?? '',
        },
        true,
        (userStore ?? {}).userToken,
        // controller?.signal,
      ).then((allCodeQuality) => {
        setLoading(false);
        if (!allCodeQuality || typeof allCodeQuality === 'boolean') return;
        setAllCodeQuality(allCodeQuality);
      });
    },
    [repoUuids, userStore],
  );

  useEffect(() => {
    getData(dateRange);
    // return () => {
    //   controller?.abort();
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // const onChange = useCallback(
  //   (_: any, dateString: string[]) => {
  //     // this.props.changeDate(dateString);
  //     getData(dateString);
  //   },
  //   [getData],
  // );
  const newCount = useMemo(
    () =>
      isNumber(allCodeQuality?.addedIssueCount)
        ? allCodeQuality?.addedIssueCount
        : '-',
    [allCodeQuality?.addedIssueCount],
  );
  const eliminateCount = useMemo(
    () =>
      isNumber(allCodeQuality?.solvedIssueCount)
        ? allCodeQuality?.solvedIssueCount
        : '-',
    [allCodeQuality?.solvedIssueCount],
  );
  const el = useMemo(
    () =>
      (allCodeQuality?.eliminatedIssuePerHundredLine ||
        allCodeQuality?.eliminatedIssuePerHundredLine === 0) &&
      isNumber(allCodeQuality?.eliminatedIssuePerHundredLine)
        ? allCodeQuality?.eliminatedIssuePerHundredLine === 0
          ? '0'
          : allCodeQuality?.eliminatedIssuePerHundredLine.toFixed(2)
        : '-',
    [allCodeQuality?.eliminatedIssuePerHundredLine],
  );
  const nl = useMemo(
    () =>
      (allCodeQuality?.notedIssuePreHundredLine ||
        allCodeQuality?.notedIssuePreHundredLine === 0) &&
      isNumber(allCodeQuality?.notedIssuePreHundredLine)
        ? allCodeQuality?.notedIssuePreHundredLine === 0
          ? '0'
          : allCodeQuality?.notedIssuePreHundredLine.toFixed(2)
        : '-',
    [allCodeQuality?.notedIssuePreHundredLine],
  );
  return (
    <div id={'measureIssueBox'}>
      <div style={{ width: '100%' }}>
        <div className="measureIssueSubBox">
          <div style={{ fontSize: '12px' }}>
            {dateRange[0] && dateRange[1]
              ? dateRange[0] + ' ' + intl.get('time to') + ' ' + dateRange[1]
              : ''}
          </div>
          <div>
            <div id={'issueCountDetails'}>
              <div>
                <span>
                  <div className="issueCountTitle">{intl.get('new')}</div>
                </span>
                <span>{loading ? <LoadingOutlined /> : newCount}</span>
              </div>
              <div>
                <span>
                  <div className="issueCountTitle">
                    {intl.get('eliminated')}
                  </div>
                </span>
                <span>{loading ? <LoadingOutlined /> : eliminateCount}</span>
              </div>
              <div>
                <span>
                  <div className="issueCountTitle">
                    E/L
                    <Tooltip
                      placement="topLeft"
                      title={intl.get(
                        'It means how many lines(hundreds) eliminate an issue on average',
                      )}
                    >
                      <QuestionCircleOutlined style={{ fontSize: '10px' }} />
                    </Tooltip>
                  </div>
                </span>
                <span>{loading ? <LoadingOutlined /> : el}</span>
              </div>
              <div>
                <span>
                  <div className="issueCountTitle">
                    N/L
                    <Tooltip
                      placement="topLeft"
                      title={intl.get(
                        'It means how many lines(hundreds) produce an issue on average',
                      )}
                    >
                      <QuestionCircleOutlined style={{ fontSize: '10px' }} />
                    </Tooltip>
                  </div>
                </span>
                <span>{loading ? <LoadingOutlined /> : nl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function isNumber(val: any) {
  const regPos = /^\d+(\.\d+)?$/; //非负浮点数
  const regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
  if (
    (regPos.test(val) || regNeg.test(val)) &&
    val !== 'Infinity' &&
    val !== 'NaN'
  ) {
    return true;
  } else {
    return false;
  }
}

export default MeasureIssue;
