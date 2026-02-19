/**
 * 根据布局方向为边计算 sourceHandle / targetHandle：横向 right→left，纵向 bottom→top
 * @author Echo009
 */
import { WorkflowNode, WorkflowEdge } from '../types/workflow';

type SourceHandleId = 'right' | 'bottom';
type TargetHandleId = 'left' | 'top';

export interface EdgeHandlesOptions {
  direction?: 'horizontal' | 'vertical';
}

/**
 * 为单条边根据布局方向返回固定的 sourceHandle / targetHandle
 * - horizontal：源 right，目标 left
 * - vertical：源 bottom，目标 top
 */
export function getOptimalHandlesForEdge(
  _sourceNode: WorkflowNode,
  _targetNode: WorkflowNode,
  options: EdgeHandlesOptions = {},
): { sourceHandleId: SourceHandleId; targetHandleId: TargetHandleId } {
  const direction = options.direction ?? 'horizontal';
  if (direction === 'vertical') {
    return { sourceHandleId: 'bottom', targetHandleId: 'top' };
  }
  return { sourceHandleId: 'right', targetHandleId: 'left' };
}

/**
 * 为所有边根据布局方向赋予 sourceHandle / targetHandle，不修改原数组
 */
export function assignOptimalHandles(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  options: EdgeHandlesOptions = {},
): WorkflowEdge[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (!sourceNode || !targetNode) return edge;

    const { sourceHandleId, targetHandleId } = getOptimalHandlesForEdge(
      sourceNode,
      targetNode,
      options,
    );
    return {
      ...edge,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId,
    };
  });
}
