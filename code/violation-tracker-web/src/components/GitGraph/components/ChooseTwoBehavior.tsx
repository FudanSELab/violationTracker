import { GraphinContext, IG6GraphEvent } from '@antv/graphin';
import { Item } from '@antv/graphin/node_modules/@antv/g6-core';
import { message } from 'antd';
import { useContext, useEffect } from 'react';

const ChooseTwoBehavior = ({
  onClick,
}: {
  onClick: (target?: string, selected?: Item[]) => void;
}) => {
  const { graph } = useContext(GraphinContext);
  useEffect(() => {
    const handleClick = (evt: IG6GraphEvent) => {
      const target = evt.item;
      if (target === null) return;
      const beforeSelecteds = graph.findAllByState('node', 'selected');
      // 若点击的是已选中的点
      if (beforeSelecteds.some((node) => node.getID() === target.getID())) {
        graph.clearItemStates(target.getID());
        onClick(
          target.getID(),
          beforeSelecteds.filter((node) => node.getID() !== target.getID()),
        );
        return;
      }
      if (beforeSelecteds.length >= 2) {
        message.warn('已选中两次提交记录，不可再选');
      } else {
        const selected = beforeSelecteds.concat([target]);
        onClick(target.getID(), selected);
      }
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

export default ChooseTwoBehavior;
