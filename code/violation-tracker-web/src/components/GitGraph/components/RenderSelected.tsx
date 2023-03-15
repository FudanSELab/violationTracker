import { INode } from '@antv/g6';
import { GraphinContext } from '@antv/graphin';
import { useContext, useEffect } from 'react';
import { getParents } from '../utils';

const RenderSelected: React.FC<{
  edges: API.CommitEdgeItem[];
  selectedCommitList: string[];
}> = ({ edges, selectedCommitList }) => {
  const { graph } = useContext(GraphinContext);
  useEffect(() => {
    // 清除所有状态
    graph.getEdges().forEach((item) => graph.clearItemStates(item));
    graph.getNodes().forEach((item) => graph.clearItemStates(item));
    graph.getNodes().forEach((node) => {
      if (selectedCommitList.includes(node.getID())) {
        graph.setItemState(node, 'selected', true);
      }
    });
    // 高亮边
    if (selectedCommitList.length === 1) {
      const child = (graph.findById(selectedCommitList[0]) as unknown) as INode;
      const nexts = getParents(edges as any, child.getID());
      // 高亮到父节点的边
      child.getEdges().forEach((edge) => {
        if (nexts.includes(edge.getSource().getID())) {
          graph.setItemState(edge.getID(), 'active', true);
        }
      });
    } else if (selectedCommitList.length === 2) {
      const child = (graph.findById(selectedCommitList[0]) as unknown) as INode;
      child.getEdges().forEach((edge) => {
        if (edge.getSource().getID() === selectedCommitList[1]) {
          graph.setItemState(edge.getID(), 'active', true);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.getNodes(), edges, selectedCommitList]);
  return null;
};

export default RenderSelected;
