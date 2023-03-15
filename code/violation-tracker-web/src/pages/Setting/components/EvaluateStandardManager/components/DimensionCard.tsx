import React, { useEffect } from 'react';
import { Card } from 'antd';
import { useStores } from '@/models';
import DimensionItem from './DimensionItem';
import { getRepoMetricStandard } from '@/services/setting';

interface IProps {
  title: string;
  repoUuid: string;
}

const PLUS_N = (n: number) => (a: number): number => a + n;
const MINUS_N = (n: number) => (a: number): number => a - n;

const metricTranslater = new Map<
  string,
  {
    title: string;
    relation: (a: number) => number;
    step: number;
    operator: 'gt' | 'lt';
    precision: number;
  }
>([
  [
    'BigMethodNum',
    {
      title: '超大方法数',
      relation: MINUS_N(1),
      step: 1,
      operator: 'gt',
      precision: 0,
    },
  ],
  [
    'CloneLine',
    {
      title: '克隆率',
      relation: MINUS_N(0.01),
      step: 0.01,
      operator: 'gt',
      precision: 2,
    },
  ],
  [
    'CodeStability',
    {
      title: '代码稳定性',
      relation: PLUS_N(0.01),
      step: 0.01,
      operator: 'lt',
      precision: 2,
    },
  ],
  [
    'CommitStandard',
    {
      title: '提交规范性',
      relation: PLUS_N(0.01),
      step: 0.01,
      operator: 'lt',
      precision: 2,
    },
  ],
  [
    'CyclomaticComplexity',
    {
      title: '圈复杂度',
      relation: MINUS_N(1),
      step: 1,
      operator: 'gt',
      precision: 0,
    },
  ],
  [
    'DesignContribution',
    {
      title: '设计贡献',
      relation: PLUS_N(0.01),
      step: 0.01,
      operator: 'lt',
      precision: 2,
    },
  ],
  [
    'LivingStaticIssue',
    {
      title: '留存静态缺陷',
      relation: MINUS_N(1),
      step: 1,
      operator: 'gt',
      precision: 0,
    },
  ],
  [
    'WorkLoad',
    {
      title: '工作量',
      relation: PLUS_N(1),
      step: 1,
      operator: 'lt',
      precision: 0,
    },
  ],
]);

const DimensionCard: React.FC<IProps> = ({ title, repoUuid }) => {
  const { userStore } = useStores();
  const [metricList, setMetricList] = React.useState<
    API.RepoMetricStandardDetailItem[]
  >([]);

  useEffect(() => {
    getRepoMetricStandard(
      {
        repo_uuid: repoUuid,
      },
      userStore.userToken,
    ).then((d) => {
      setMetricList(Array.isArray(d) ? d : []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="evaluate-standard-card" title={title}>
      {metricList.map((metric, index) => {
        const dimension = metricTranslater.get(metric.tag);
        return (
          <DimensionItem
            {...dimension}
            key={`${metric.tag}-${index}`}
            initialValue={metric}
            repoUuid={repoUuid}
          />
        );
      })}
    </Card>
  );
};

export default DimensionCard;
