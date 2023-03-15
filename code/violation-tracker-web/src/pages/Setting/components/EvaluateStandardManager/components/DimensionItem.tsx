import NumberPicker from '@/components/NumberPicker';
import { useStores } from '@/models';
import { postMetricValueDetail } from '@/services/setting';
import { convData2underline } from '@/utils/conversion';
import { Button, Col, Row, Typography } from 'antd';
import React from 'react';

const SPAN = 8;
const DEFAULT_NUM = 0;
const defaultRelation = (a: number) => a + 1;
const MAX_SERVER_INT = 2147483647;
const MIN_SERVER_INT = -2147483648;

const infiniteFormatter = (num?: number) => {
  if (num === undefined) return '';
  return num >= MAX_SERVER_INT ? '+∞' : num <= MIN_SERVER_INT ? '-∞' : `${num}`;
};

const DimensionItem: React.FC<{
  repoUuid: string;
  title?: string;
  initialValue?: API.RepoMetricStandardDetailItem;
  relation?: (a: number) => number;
  step?: number;
  operator?: 'gt' | 'lt';
  precision?: number;
}> = ({
  title,
  initialValue,
  relation,
  step,
  operator,
  precision,
  repoUuid,
}) => {
  const [value, setValue] = React.useState<
    API.RepoMetricStandardDetailItem | undefined
  >(initialValue);
  const [hide, setHide] = React.useState<boolean>(true);
  const { userStore } = useStores();
  const [updateLoading, setUpdateLoading] = React.useState<boolean>(false);

  const updateMetricStandard = () => {
    setUpdateLoading(true);
    postMetricValueDetail(
      convData2underline({
        ...value,
        repoUuid,
      }) as API.RepoMetricStandardUpdateParams,
      userStore.userToken,
    )
      .then(() => {
        setUpdateLoading(false);
      })
      .then(() => {
        setHide(true);
      });
  };

  return (
    <>
      <div style={{ display: 'flex' }}>
        <Typography.Title
          level={5}
          style={{ flexBasis: '15%', textAlign: 'right', lineHeight: '2' }}
        >
          {title + ' :' ?? '维度范围'}
        </Typography.Title>
        <Row style={{ flex: 1 }}>
          {/* {JSON.stringify(value)} */}
          <Col span={SPAN}>
            <Typography.Text className="dimension-evaluate-title">
              Worst:{' '}
            </Typography.Text>
            <NumberPicker
              disabled={'Min'}
              value={value ? [value.worstMin, value.worstMax] : undefined}
              min={MIN_SERVER_INT}
              max={MAX_SERVER_INT}
              step={step}
              formatter={infiniteFormatter}
              operator={operator}
              precision={precision}
              onChange={([_, max]) => {
                setValue({
                  ...value,
                  worstMax: max ?? DEFAULT_NUM,
                  worseMin: (relation ?? defaultRelation)(max ?? DEFAULT_NUM),
                } as API.RepoMetricStandardDetailItem);
                setHide(false);
              }}
            />
          </Col>
          <Col span={SPAN}>
            <Typography.Text className="dimension-evaluate-title">
              Worse:{' '}
            </Typography.Text>
            <NumberPicker
              value={value ? [value.worseMin, value.worseMax] : undefined}
              disabled={'Min'}
              step={step}
              formatter={infiniteFormatter}
              min={MIN_SERVER_INT}
              max={MAX_SERVER_INT}
              operator={operator}
              precision={precision}
              onChange={([_, max]) => {
                setValue({
                  ...value,
                  worseMax: max ?? DEFAULT_NUM,
                  normalMin: (relation ?? defaultRelation)(max ?? DEFAULT_NUM),
                } as API.RepoMetricStandardDetailItem);
                setHide(false);
              }}
            />
          </Col>
          <Col span={SPAN}>
            <Typography.Text className="dimension-evaluate-title">
              Normal:{' '}
            </Typography.Text>
            <NumberPicker
              value={value ? [value.normalMin, value.normalMax] : undefined}
              disabled={'Min'}
              step={step}
              formatter={infiniteFormatter}
              min={MIN_SERVER_INT}
              max={MAX_SERVER_INT}
              operator={operator}
              precision={precision}
              onChange={([_, max]) => {
                setValue({
                  ...value,
                  normalMax: max ?? DEFAULT_NUM,
                  betterMin: (relation ?? defaultRelation)(max ?? DEFAULT_NUM),
                } as API.RepoMetricStandardDetailItem);
                setHide(false);
              }}
            />
          </Col>
          <Col span={SPAN}>
            <Typography.Text className="dimension-evaluate-title">
              Better:{' '}
            </Typography.Text>
            <NumberPicker
              value={value ? [value.betterMin, value.betterMax] : undefined}
              disabled={'Min'}
              step={step}
              formatter={infiniteFormatter}
              min={MIN_SERVER_INT}
              max={MAX_SERVER_INT}
              operator={operator}
              precision={precision}
              onChange={([_, max]) => {
                setValue({
                  ...value,
                  betterMax: max ?? DEFAULT_NUM,
                  bestMin: (relation ?? defaultRelation)(max ?? DEFAULT_NUM),
                } as API.RepoMetricStandardDetailItem);
                setHide(false);
              }}
            />
          </Col>
          <Col span={SPAN}>
            <Typography.Text className="dimension-evaluate-title">
              Best:{' '}
            </Typography.Text>
            <NumberPicker
              value={value ? [value.bestMin, value.bestMax] : undefined}
              disabled={'Both'}
              step={step}
              formatter={infiniteFormatter}
              min={MIN_SERVER_INT}
              max={MAX_SERVER_INT}
              operator={operator}
              precision={precision}
              onChange={([_, max]) => {
                setValue({
                  ...value,
                  bestMax: max ?? DEFAULT_NUM,
                  // bestMin: (relation ?? defaultRelation)(max ?? DEFAULT_NUM),
                } as API.RepoMetricStandardDetailItem);
              }}
            />
          </Col>
        </Row>
        <div style={{ width: '100px', textAlign: 'center' }}>
          <Button
            type="primary"
            hidden={hide}
            loading={updateLoading}
            onClick={() => {
              updateMetricStandard();
            }}
          >
            更新
          </Button>
        </div>
      </div>
    </>
  );
};

export default DimensionItem;
