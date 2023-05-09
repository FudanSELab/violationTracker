import {
  BugTwoTone,
  CheckCircleTwoTone,
  PlusCircleTwoTone,
  StopTwoTone,
} from '@ant-design/icons';
import { Tag, Typography } from 'antd';
import moment from 'moment';
import Graphin, { Behaviors } from '@antv/graphin';
import { changeStatementHistoryColor } from '@/color';
import React, { useCallback, useEffect, useState } from 'react';
import {
  calculateLineList,
  calculateOneLinePositionMap,
  calculatePositionMap,
} from './utils';
import ChooseDiffBehavior from './components/ChooseDiffBehavior';
import ChooseTwoBehavior from './components/ChooseTwoBehavior';
import RenderSelected from './components/RenderSelected';
import iconLoader from '@antv/graphin-icons';
import '@antv/graphin-icons/dist/index.css';
// @ts-ignore
import { INode, Item } from '@antv/graphin/node_modules/@antv/g6-core';

const { fontFamily } = iconLoader();
const GRAPHIN_ICON = Graphin.registerFontFamily(iconLoader);
const {
  DragNode,
  DragCanvas,
  ZoomCanvas,
  Hoverable,
  ClickSelect,
  FontPaint,
} = Behaviors;

const NODE_SEP = 58;
const OFFSET_X = 20;
const OFFSET_Y = 20;
const BRANCH_SEP = 30;
const changeStateTranslater = new Map([
  ['CHANGED', 'C'],
  ['ADD', 'A'],
  ['DELETE', 'D'],
]);

export type NodeItem = API.CommitNodeItem & {
  id: string;
  retrospect?: boolean;
  status?: any;
  style?: any;
  x?: number;
  y?: number;
};
export type EdgeItem = API.CommitEdgeItem & {
  style?: any;
};

type GitConfig = {
  nodeSep: number; // 同一部分的节点间距
  branchSep: number;
  nodeStyle: {
    keyshape?: {
      size: number;
      stroke?: string;
      fill?: string;
      fillOpacity?: number;
    };
  };
  // direction: 'verticle' | 'horizontal'; // 分布方向
};

Graphin.registerLayout('gitgraph-layout', {
  // 默认参数
  getDefaultCfg() {
    return {
      nodeSep: NODE_SEP, // 同一部分的节点间距
      branchSep: BRANCH_SEP,
      nodeStyle: {
        keyshape: {
          size: 10,
          fill: '#873bf4',
          stroke: '#873bf4',
        },
        halo: {
          size: 28,
        },
      },
      // direction: 'verticle', // 分布方向
    } as GitConfig;
  },
  /**
   * 初始化
   * @param {Object} dataSource 数据
   */
  init(dataSource: {
    nodes: any;
    edges: any;
    position: Map<string, { branch: number; parents: number }>;
  }) {
    this.cfg = this.getDefaultCfg();
    this.nodes = dataSource.nodes;
    this.edges = dataSource.edges;
    this.position = dataSource.position;
  },
  /**
   * 执行布局
   */
  execute() {
    if (this.position === undefined) return;
    const cfg: GitConfig = this.cfg;
    const map = this.position;
    const offsetX = OFFSET_X;
    const offsetY = OFFSET_Y;
    this.nodes.forEach((node: NodeItem, index: number) => {
      // 设置样式
      if (node.retrospect) {
        node.style = {
          keyshape: {
            size: 20,
            fill: 'red',
            stroke: 'red',
          },
          icon: {
            fontFamily,
            type: 'font',
            value: GRAPHIN_ICON.fire,
            fill: 'red',
          },
          halo: {
            size: 40,
          },
        };
      } else {
        node.style = {
          ...this.cfg.nodeStyle,
          icon: {
            visible: false,
          },
        };
      }
      // 设置位置
      node.x = cfg.branchSep * ((map.get(node.id)?.branch ?? 0) - 1) + offsetX;
      node.y = cfg.nodeSep * index + offsetY;
    });
    this.edges.forEach((edge: EdgeItem, index: number) => {
      let label = {};
      const labelValue = changeStateTranslater.get(edge.changeRelation);
      // if (labelValue !== undefined) {
      //   label = {
      //     value: labelValue,
      //     fill: '#fff',
      //     fontSize: 10,
      //     background: {
      //       fillOpacity: 0.8,
      //       width: 30,
      //       fill: changeStatementHistoryColor(edge.changeRelation),
      //     },
      //   };
      // }
      // edge.style.keyshape.type = 'poly';
      edge.style = {
        ...edge.style,
        label,
        keyshape: {
          // type: 'poly',
          lineDash: edge.type === 'indirect' ? [4, 4] : undefined,
          stroke: changeStatementHistoryColor(edge.changeRelation),
          lineWidth: labelValue !== undefined ? 1.5 : 1,
        },
      };
      edge.type = undefined;
    });
  },
  /**
   * 根据传入的数据进行布局
   * @param {Object} dataSource 数据
   */
  layout(dataSource: any) {
    const self = this;
    self.init(dataSource);
    self.execute();
  },
  // /**
  //  * 更新布局配置，但不执行布局
  //  * @param {Object} cfg 需要更新的配置项
  //  */
  // updateCfg(cfg: any) {
  //   const self = this;
  //   Utils.mix(self, cfg);
  // },
  /**
   * 销毁
   */
  destroy() {
    const self = this;
    self.cfg = null;
    self.positions = null;
    self.nodes = null;
    self.edges = null;
    self.destroyed = true;
  },
});
// const straight = '|';
// const left = '\\';
// const right = '/';

const GitGraph: React.FC<{
  dataSource: {
    nodes: NodeItem[];
    edges: EdgeItem[];
  };
  selectedCommitList?: string[];
  recommend: boolean;
  retrospectCommitList?: string[];
  onClick?: (
    target?: string,
    selected?: string[],
    selectedInfos?: API.CommitNodeItem[],
  ) => void;
}> = ({
  dataSource,
  recommend,
  retrospectCommitList,
  selectedCommitList,
  onClick,
}) => {
  const graphinRef = React.createRef<Graphin>();
  const [data, setData] = useState<{
    nodes: NodeItem[];
    edges: EdgeItem[];
    position?: Map<string, { branch: number; parents: number }>;
    lines?: {
      draw?: string;
      branch?: number;
      from: {
        source: string;
        target?: string;
        pos: number[];
      };
      to: {
        source: string;
        target?: string;
        pos: number[];
      };
    }[][];
  }>({
    nodes: [],
    edges: [],
    position: new Map(),
    lines: [],
  });
  const [graphWidth, setGraphWidth] = useState<number>(0);
  const onSequencedClick = useCallback(
    (target?: string, selected?: Item[]) => {
      const sortedNode = Array.isArray(selected)
        ? selected.sort(
            (a, b) =>
              +new Date(((b as INode).getModel().date as string) ?? '') -
              +new Date(((a as INode).getModel().date as string) ?? ''),
          )
        : undefined;
      const sortedCommitIds =
        sortedNode && sortedNode.map((node) => node.getID());
      onClick?.(
        target,
        sortedCommitIds,
        (sortedNode as unknown) as API.CommitNodeItem[],
      );
    },
    [onClick],
  );
  useEffect(() => {
    const position =
      Array.isArray(dataSource.edges) && dataSource.edges.length > 0
        ? calculatePositionMap(dataSource.nodes, dataSource.edges)
        : calculateOneLinePositionMap(dataSource.nodes);
    const lines = calculateLineList(
      dataSource.nodes,
      dataSource.edges,
      position,
    );
    let maxBranch = 0;
    position.forEach(({ branch }) => {
      maxBranch = Math.max(maxBranch, branch);
    });
    const nodeIds = dataSource.nodes.map(({ id }) => id);
    const edges = dataSource.edges.filter(({ source, target }: EdgeItem) => {
      return nodeIds.includes(source) && nodeIds.includes(target);
    });
    const nodes = dataSource.nodes.map((node) => {
      node.retrospect = retrospectCommitList?.includes(node.commitId);
      return { ...node };
    });
    setData({
      nodes,
      edges,
      position,
      lines,
    });
    graphinRef.current?.graph.changeSize(
      (maxBranch - 1) * BRANCH_SEP + 2 * OFFSET_X,
      position.size * NODE_SEP,
    );
    setGraphWidth((maxBranch - 1) * BRANCH_SEP + 2 * OFFSET_X);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, retrospectCommitList]);
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: graphWidth }}>
        <Graphin
          data={data}
          layout={{ type: 'gitgraph-layout' }}
          ref={graphinRef}
        >
          <FontPaint />
          <RenderSelected
            edges={data.edges}
            selectedCommitList={selectedCommitList ?? []}
          />
          {recommend ? (
            <ChooseDiffBehavior onClick={onSequencedClick} />
          ) : (
            <ChooseTwoBehavior onClick={onSequencedClick} />
          )}
          <ClickSelect disabled />
          <Hoverable />
          <DragNode disabled />
          <DragCanvas disabled />
          <ZoomCanvas disabled />
        </Graphin>
      </div>
      <div style={{ minWidth: '200px' }}>
        {dataSource.nodes.map(
          ({ id, commitId, commitTime, issueStatus }, idx) => {
            const commitDate = moment(commitTime);
            return (
              <div
                key={id}
                style={{
                  position: 'relative',
                  top: `${OFFSET_Y}px`,
                  height: `${NODE_SEP}px`,
                  // overflow: 'scroll',
                }}
              >
                <div
                  style={{
                    transform: 'translateY(-50%)',
                  }}
                >
                  <Typography.Text
                    code
                    title={commitId}
                    copyable={{ text: commitId }}
                    style={{
                      color: issueStatus === 'failed' ? '#de1c31' : 'initial',
                    }}
                  >
                    {((commitId as string) ?? '').substring(0, 10)}...
                  </Typography.Text>
                </div>
                <div
                  style={{
                    transform: `translateY(-${OFFSET_Y / 3}px)`,
                  }}
                >
                  {issueStatus === 'failed' && (
                    <StopTwoTone
                      style={{ margin: '0 3px' }}
                      twoToneColor="#de1c31"
                    />
                  )}
                  {issueStatus === 'bug_add' && (
                    <PlusCircleTwoTone
                      style={{ margin: '0 3px' }}
                      twoToneColor="#de1c31"
                    />
                  )}
                  {issueStatus === 'bug_changed' && (
                    <BugTwoTone
                      style={{ margin: '0 3px' }}
                      twoToneColor="#de1c31"
                    />
                  )}
                  {issueStatus === 'bug_may_changed' && (
                    <BugTwoTone style={{ margin: '0 3px' }} />
                  )}
                  {issueStatus === 'solved' && (
                    <CheckCircleTwoTone
                      style={{ margin: '0 3px' }}
                      twoToneColor="#52c41a"
                    />
                  )}
                  {idx === 0 && (
                    <Tag color="green" style={{ marginLeft: '0.2em' }}>
                      latest
                    </Tag>
                  )}
                  <Typography.Text
                    style={{
                      color: issueStatus === 'failed' ? '#de1c31' : 'initial',
                    }}
                  >
                    {commitDate.format('YYYY/MM/DD HH:mm')}
                  </Typography.Text>
                </div>
              </div>
            );
          },
        )}
      </div>
      {/* <div>
        {data.lines?.map((line) => (
          <div>
            {line
              .map(
                ({ from, to }) =>
                  to.pos[1] - from.pos[1] > 0
                    ? right
                    : to.pos[1] === from.pos[1]
                    ? straight
                    : left,
                // `[(${from.pos[0]}, ${from.pos[1]}) -> (${to.pos[0]}, ${to.pos[1]})]`,
              )
              .join(' ')}
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default GitGraph;
