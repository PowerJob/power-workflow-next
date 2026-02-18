import dagre from 'dagre';
import { WorkflowNode, WorkflowEdge, NodeType } from '../types/workflow';

interface LayoutOptions {
  direction?: 'horizontal' | 'vertical';
  nodeSep?: number;
  rankSep?: number;
}

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  [NodeType.JOB]: { width: 200, height: 56 },
  [NodeType.DECISION]: { width: 80, height: 80 },
  [NodeType.NESTED_WORKFLOW]: { width: 200, height: 56 },
};

const DEFAULT_NODE_DIMENSION = { width: 200, height: 56 };

export const layoutNodes = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options: LayoutOptions = {},
): WorkflowNode[] => {
  const { direction = 'horizontal', nodeSep = 60, rankSep = 80 } = options;

  if (nodes.length === 0) return nodes;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction === 'horizontal' ? 'LR' : 'TB',
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    const nodeType = node.data?.type || NodeType.JOB;
    const dimensions = NODE_DIMENSIONS[nodeType] || DEFAULT_NODE_DIMENSION;
    dagreGraph.setNode(node.id, {
      width: dimensions.width,
      height: dimensions.height,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeType = node.data?.type || NodeType.JOB;
    const dimensions = NODE_DIMENSIONS[nodeType] || DEFAULT_NODE_DIMENSION;
    const dagreNode = dagreGraph.node(node.id);

    if (dagreNode) {
      return {
        ...node,
        position: {
          x: dagreNode.x - dimensions.width / 2,
          y: dagreNode.y - dimensions.height / 2,
        },
      };
    }

    return node;
  });
};

export default layoutNodes;
