import { INode } from '@antv/g6-core';
import { GraphinContext, IG6GraphEvent } from '@antv/graphin';
import { Item } from '@antv/graphin/node_modules/@antv/g6-core';
import { useContext, useEffect } from 'react';
import { getDifferentParents, getParents } from '../utils';

const ChooseDiffBehavior = ({
  onClick,
}: {
  onClick: (target?: string, selected?: Item[]) => void;
}) => {
  const { graph } = useContext(GraphinContext);
  useEffect(() => {
    const handleClick = (evt: IG6GraphEvent) => {
      // 清除边状态
      graph.getEdges().forEach((item) => graph.clearItemStates(item));
      const node = evt.item;
      const beforeSelecteds = graph.findAllByState('node', 'selected');
      if (node === null) return;
      const modelId = node.getID();
      // 若点击的是已选中的点
      if (beforeSelecteds.some((node) => node.getID() === modelId)) {
        graph.clearItemStates(modelId);
        onClick(
          modelId,
          // .map((node) => node.getID())
          beforeSelecteds.filter((node) => node.getID() !== modelId),
        );
        return;
      }
      let target = '';
      let selected = [] as Item[];
      if (beforeSelecteds.length >= 2) {
        graph.getNodes().forEach((item) => graph.clearItemStates(item));
        selected = [];
        target = modelId;
      } else if (beforeSelecteds.length === 1) {
        const edges = ((beforeSelecteds[0] as unknown) as INode)
          .getEdges()
          .map((edge) => edge.getModel());
        const nexts = getParents(edges as any, beforeSelecteds[0].getID());
        if (!nexts.includes(modelId)) {
          selected = [];
          target = modelId;
          graph.getNodes().forEach((item) => graph.clearItemStates(item));
        } else {
          selected = [beforeSelecteds[0], node];
          target = modelId;
        }
      }
      if (selected.length === 0) {
        const edges = ((node as unknown) as INode)
          .getEdges()
          .map((edge) => edge.getModel());
        const nexts = getParents(edges as any, modelId);
        const nextsChanged = getDifferentParents(edges as any, modelId);
        target = modelId;
        /**
         * 推荐：
         * 1. 只有一个父节点时，直接选中两个
         * 2. 有多个父节点，但只有一个变化的父节点时，直接选中两个
         *  */
        if (nexts.length === 1) {
          graph.setItemState(nexts[0], 'selected', true);
          selected = [node, graph.findById(nexts[0])];
        } else if (nextsChanged.length === 1) {
          graph.setItemState(nextsChanged[0], 'selected', true);
          selected = [node, graph.findById(nextsChanged[0])];
        } else {
          // 高亮到父节点的边
          ((node as unknown) as INode).getEdges().forEach((edge) => {
            if (nexts.includes(edge.getSource().getID())) {
              graph.setItemState(edge.getID(), 'active', true);
            }
          });
          // 高亮父节点
          nexts.forEach((next) => graph.setItemState(next, 'hover', true));
          selected = [node];
        }
      }
      // 高亮已选中相连的两个节点
      if (selected.length === 2) {
        const child = (selected[0] as unknown) as INode;
        child.getEdges().forEach((edge) => {
          if (edge.getSource().getID() === selected[1].getID()) {
            graph.setItemState(edge.getID(), 'active', true);
          }
        });
      }
      graph.setItemState(modelId, 'selected', true);
      onClick(target, selected);
    };
    const handleCanvasClick = (evt: IG6GraphEvent) => {
      graph.getNodes().forEach((item) => graph.clearItemStates(item));
      graph.getEdges().forEach((item) => graph.clearItemStates(item));
      onClick();
    };
    // 每次点击聚焦到点击节点上
    graph.on('node:click', handleClick);
    graph.on('canvas:click', handleCanvasClick);
    return () => {
      graph.off('node:click', handleClick);
      graph.off('canvas:click', handleCanvasClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

export default ChooseDiffBehavior;
