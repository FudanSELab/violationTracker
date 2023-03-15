import D3DeveloperRadar, {
  IDeveloperRadarItem,
} from '@/components/graph/D3DeveloperRadar';
import { Button, Card, Col, Input, message, Row } from 'antd';
import { useState } from 'react';

const DEFAULT = [
  {
    name: '代码行数',
    children: [
      {
        name: '删除代码行数',
        type: 'good',
        level: 1,
      },
      {
        name: '新增代码行数',
        level: 1,
      },
    ],
  },
  {
    name: '代码稳定性',
    type: 'good',
    level: 2,
  },
  {
    name: '设计贡献',
    level: 3,
  },
  {
    name: '测试',
    type: 'bad',
    level: 5,
  },
  {
    name: '5',
    level: 4,
  },
] as IDeveloperRadarItem[];

const Test4 = () => {
  const [dataSource, setDataSource] = useState<IDeveloperRadarItem[]>(DEFAULT);
  const [plainText, setPlainText] = useState<string>(
    JSON.stringify(dataSource, null, 2),
  );
  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card
          title="关系数据"
          bodyStyle={{ height: '554px', overflow: 'scroll' }}
        >
          <Button
            type="primary"
            onClick={() => {
              try {
                const a = JSON.parse(plainText);
                setDataSource((a as unknown) as IDeveloperRadarItem[]);
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
          {dataSource && <D3DeveloperRadar name="123" data={dataSource} />}
        </Card>
      </Col>
    </Row>
  );
};

export default Test4;
