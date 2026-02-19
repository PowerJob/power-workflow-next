/**
 * 根据节点位置为边计算最优 sourceHandle / targetHandle，使连线尽量直线
 * @author Echo009
 */
import { WorkflowNode, WorkflowEdge, NodeType } from '../types/workflow';

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  [NodeType.JOB]: { width: 200, height: 56 },
  [NodeType.DECISION]: { width: 80, height: 80 },
  [NodeType.NESTED_WORKFLOW]: { width: 200, height: 56 },
};

const DEFAULT_DIMENSION = { width: 200, height: 56 };

type SourceHandleId = 'right' | 'bottom';
type TargetHandleId = 'left' | 'top';

function getDimensions(node: WorkflowNode): { width: number; height: number } {
  const type = node.data?.type || NodeType.JOB;
  return NODE_DIMENSIONS[type] ?? DEFAULT_DIMENSION;
}

/** 源节点出口：right 中心、bottom 中心 */
function getSourceHandlePositions(
  node: WorkflowNode,
): { right: { x: number; y: number }; bottom: { x: number; y: number } } {
  const { width, height } = getDimensions(node);
  const { x, y } = node.position;
  return {
    right: { x: x + width, y: y + height / 2 },
    bottom: { x: x + width / 2, y: y + height },
  };
}

/** 目标节点入口：left 中心、top 中心 */
function getTargetHandlePositions(
  node: WorkflowNode,
): { left: { x: number; y: number }; top: { x: number; y: number } } {
  const { width, height } = getDimensions(node);
  const { x, y } = node.position;
  return {
    left: { x, y: y + height / 2 },
    top: { x: x + width / 2, y },
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * 为单条边计算最优的 sourceHandle / targetHandle（欧几里得距离最短的一对）
 */
export function getOptimalHandlesForEdge(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode,
): { sourceHandleId: SourceHandleId; targetHandleId: TargetHandleId } {
  const src = getSourceHandlePositions(sourceNode);
  const tgt = getTargetHandlePositions(targetNode);

  const candidates: { sourceHandleId: SourceHandleId; targetHandleId: TargetHandleId; d: number }[] = [
    { sourceHandleId: 'right', targetHandleId: 'left', d: distance(src.right, tgt.left) },
    { sourceHandleId: 'right', targetHandleId: 'top', d: distance(src.right, tgt.top) },
    { sourceHandleId: 'bottom', targetHandleId: 'left', d: distance(src.bottom, tgt.left) },
    { sourceHandleId: 'bottom', targetHandleId: 'top', d: distance(src.bottom, tgt.top) },
  ];

  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].d < best.d) best = candidates[i];
  }
  return {
    sourceHandleId: best.sourceHandleId,
    targetHandleId: best.targetHandleId,
  };
}

/**
 * 为所有边根据当前节点位置赋予最优的 sourceHandle / targetHandle，不修改原数组
 */
export function assignOptimalHandles(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): WorkflowEdge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) return edge;

    const { sourceHandleId, targetHandleId } = getOptimalHandlesForEdge(sourceNode, targetNode);
    return {
      ...edge,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId,
    };
  });
}
