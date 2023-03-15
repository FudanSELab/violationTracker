import G6, { EdgeConfig } from '@antv/g6';
import { Row, Col, Card, Button, message, Input } from 'antd';
import { useEffect, useState } from 'react';
import relationMock from './developerRelation.json';

function getNodesAndEdges(
  relations: {
    importer: string;
    solver: string;
    num: number;
  }[],
) {
  const importers = relations.map(({ importer }) => importer);
  const solvers = relations.map(({ solver }) => solver);
  const developers = Array.from(new Set([...importers, ...solvers]));
  const nodes = developers.map((developer, index) => ({
    id: '' + index,
    label: developer,
    solveNum: 0,
    beSolved: '',
  }));
  const edges: EdgeConfig[] = [];
  relations.forEach(({ importer, solver, num }) => {
    const importIdx = nodes.findIndex(({ label }) => label === importer);
    const solverIdx = nodes.findIndex(({ label }) => label === solver);
    if (importIdx === undefined || solverIdx === undefined) {
      console.error('Error: No Found Developer');
      return;
    }
    nodes[solverIdx].solveNum += num;
    nodes[importIdx].beSolved = '' + solverIdx;
    edges.push({
      source: nodes[solverIdx].id,
      target: nodes[importIdx].id,
      type: 'line',
      label: '' + num,
    });
  });
  return {
    nodes: nodes.sort(({ solveNum: a }, { solveNum: b }) => b - a),
    edges: edges.map((edge, _, arr) => {
      if (
        arr.find(
          ({ source, target }) =>
            source === edge.target && target === edge.source,
        ) !== undefined
      ) {
        return {
          ...edge,
          type: 'arc',
        };
      }
      return edge;
    }),
  };
}

const NODE_SIZE = 20;
const unit_radius = 160;

const Test6 = () => {
  const [dataSource, setDataSource] = useState<
    { importer: string; solver: string; num: number }[]
  >(relationMock);
  const [plainText, setPlainText] = useState<string>(
    JSON.stringify(relationMock, null, 2),
  );
  useEffect(() => {
    const data = getNodesAndEdges(dataSource);
    if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
      return;
    }
    const container = document.getElementById('container');
    if (container === null) return;
    const width = container.scrollWidth;
    const height = container.scrollHeight || 1000;
    container.querySelector('canvas')?.remove();
    const graph = new G6.Graph({
      container: 'container',
      width,
      height,
      modes: {
        default: ['drag-canvas', 'drag-node'],
      },
      layout: {
        type: 'radial',
        unitRadius: unit_radius,
        maxIteration: 1000,
        linkDistance: 70,
        preventOverlap: true,
        strictRadial: true,
        nodeSize: NODE_SIZE,
        nodeSpacing: NODE_SIZE,
        sortBy: 'beSolved',
        sortStrength: 50,
      },
      animate: true,
      defaultEdge: {
        style: {
          endArrow: {
            path: 'M 0,0 L 8,4 L 8,-4 Z',
            fill: '#e2e2e2',
          },
        },
      },
    });

    const maxSolveNum = (data.nodes?.[0].solveNum as number) ?? 0;
    const colors = ['grey', 'pink', 'green', 'orange'];
    // const colorsObj = { a: 'steelblue', b: 'green', c: 'pink', d: 'grey' };
    data.nodes?.forEach((node: any) => {
      const range = node.solveNum / maxSolveNum;
      node.size = NODE_SIZE;
      node.style = {
        lineWidth: 4,
        fill: '#fff',
        stroke:
          colors[range > 0.75 ? 3 : range > 0.5 ? 2 : range > 0.25 ? 1 : 0],
      };
    });
    graph.data(data);
    graph.render();
  }, [dataSource]);
  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card
          title="关系数据"
          bodyStyle={{ height: '90vh', overflow: 'scroll' }}
        >
          <Button
            type="primary"
            onClick={() => {
              try {
                const a = JSON.parse(plainText);
                setDataSource(a as any);
              } catch (e) {
                message.error('格式错误，无法修改');
              }
            }}
          >
            修改
          </Button>
          <Input.TextArea
            autoSize
            value={plainText}
            onChange={(v) => setPlainText(v.target.value)}
          />
        </Card>
      </Col>
      <Col span={16}>
        <Card title="可视化结果">
          <div id="container" />
        </Card>
      </Col>
    </Row>
  );
};

export default Test6;
