import GitGraph, { EdgeItem, NodeItem } from '@/components/GitGraph';
import { getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation } from '@/services/method';
import { Button, Card, Col, Row } from 'antd';
import { useCallback, useState } from 'react';

const DEFAULT: {
  nodes: NodeItem[];
  edges: EdgeItem[];
  position?: Map<string, { branch: number; parents: number }>;
} = {
  nodes: [
    {
      id: '0',
      commitId: 'fasefda1243aefea',
      committer: 'deverloper',
      commitTime: '2021-10-10',
      issueStatus: 'bug_changed',
      parentCommit: [],
      // trackerStatus: '',
    },
    {
      id: '1',
      commitId: '12efda1243aefea',
      committer: 'deverloper',
      commitTime: '2021-10-09',
      parentCommit: [],
      issueStatus: 'bug_add',
      // trackerStatus: '',
    },
    {
      id: '2',
      commitId: 'afefda1243aefea',
      committer: 'deverloper',
      commitTime: '2021-10-07',
      parentCommit: [],
      issueStatus: '',
      // trackerStatus: '',
    },
    {
      id: '3',
      commitId: '12eefda1243aefea',
      committer: 'deverloper',
      commitTime: '2021-10-01',
      parentCommit: [],
      issueStatus: '',
      // trackerStatus: '',
    },
  ],
  edges: [
    {
      source: '1',
      target: '0',
      changeRelation: 'UNCHANGED',
      comparable: true,
    },
    {
      source: '2',
      target: '0',
      changeRelation: 'CHANGED',
      comparable: true,
    },
    {
      source: '3',
      target: '1',
      changeRelation: 'DELETE',
      comparable: true,
    },
    {
      source: '3',
      target: '2',
      changeRelation: 'ADD',
      comparable: true,
    },
  ],
};

const Test3 = () => {
  const [current, setCurrent] = useState<number>(0);
  const [dataSource, setDataSource] = useState<{
    nodes: NodeItem[];
    edges: EdgeItem[];
    position?: Map<string, { branch: number; parents: number }>;
  }>(DEFAULT);
  const getValue = useCallback((current: number) => {
    getMetaInfoAndMethodInfosAndCommitMapsAndIssueLocation({
      issue_type: '',
      level: '',
      type: 'issue',
      issue_uuid: '9f970245-62f4-444a-8295-3ef0c055c937',
      repo_uuid: 'a140dc46-50db-11eb-b7c3-394c0d058805',
      page: current,
    }).then((data) => {
      if (typeof data === 'boolean' || data === null) return;
      const nodes = data.node.rows.map((item) => ({
        ...item,
        id: item.commitId,
      }));
      setDataSource((dataSource) => {
        if (dataSource?.nodes === undefined || current === 1) {
          return {
            nodes,
            edges: data.edge,
          };
        } else {
          return {
            nodes: dataSource?.nodes.concat(nodes),
            edges: dataSource?.edges.concat(data.edge),
          };
        }
      });
    });
  }, []);
  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Card
            title="关系数据"
            bodyStyle={{ height: '554px', overflow: 'scroll' }}
          >
            <Button
              type="primary"
              onClick={() => {
                getValue(1);
                setCurrent(1);
              }}
            >
              获取接口数据
            </Button>
            <pre>{JSON.stringify(dataSource, null, 2)}</pre>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="可视化结果">
            {dataSource && (
              <GitGraph
                recommend
                dataSource={dataSource}
                retrospectCommitList={['fasefda1243aefea']}
              />
            )}
            <Button
              hidden={current === 0}
              onClick={() => {
                getValue(current + 1);
                setCurrent((cur) => cur + 1);
              }}
            >
              加载更多
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Test3;
