import React, { useEffect, useState } from 'react';
import { useStores } from '@/models';
import { Card, Col, Row, Select } from 'antd';
import { Observer } from 'mobx-react';
import { useFetchState } from '@/utils/hooks';
import DimensionCard from './components/DimensionCard';
import { mapRepoItem } from '@/utils/table';

import './styles.less';

const EvaluateStandardManager: React.FC = () => {
  const { projectStore } = useStores();
  // 选择的project的值
  const [projectName, setProjectName] = useState<string>();
  const [repoUuid, setRepoUuid] = useState<string>();
  const [currentRepoList, setCurrentRepoList] = useFetchState<
    { label: string; value: string }[]
  >([]);

  const changeProjectName = (value: string) => {
    setProjectName(value);
  };

  const changeRepoName = (value: string) => {
    setRepoUuid(value);
  };

  useEffect(() => {
    if (projectStore.projects === undefined) {
      projectStore.getProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setRepoUuid(undefined);
    setCurrentRepoList(
      (projectName !== undefined
        ? projectStore.getRepoListByProjectName(projectName)
        : []
      ).map(mapRepoItem),
    );
  }, [projectName, projectStore, setCurrentRepoList]);
  return (
    <Observer>
      {() => (
        <>
          {/* <Card
            className="default-evaluate-standard-setting-card"
            title="默认评分标准"
            style={{
              marginBottom: 15,
            }}
          > */}
          <Row gutter={24}>
            <Col span={24}>
              <DimensionCard
                title={'默认评分标准'}
                repoUuid={'default_evaluate_standard'}
              />
            </Col>
          </Row>
          {/* </Card> */}
          <Card
            className="evaluate-standard-setting-card"
            title="评分修改设置"
            style={{
              marginBottom: 15,
            }}
          >
            <Select
              key="SelectProjectName"
              showSearch
              placeholder="项目名"
              style={{ width: 200 }}
              value={projectName}
              options={projectStore.projectNameList.map((name) => ({
                label: name,
                value: name,
              }))}
              onChange={changeProjectName}
            />
            <span>&nbsp;</span>
            <Select
              key="SelectRepoName"
              placeholder="库名"
              style={{ width: 200 }}
              allowClear
              value={repoUuid}
              options={currentRepoList}
              onChange={changeRepoName}
            />
          </Card>
          <Row gutter={24}>
            {currentRepoList
              .filter(({ value }) => (repoUuid ? value === repoUuid : true))
              .map(({ label, value }) => (
                <Col span={24} key={value}>
                  <DimensionCard title={label} repoUuid={value} />
                </Col>
              ))}
          </Row>
        </>
      )}
    </Observer>
  );
};

export default EvaluateStandardManager;
