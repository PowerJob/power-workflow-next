/**
 * 根据布局方向为边计算 sourceHandle / targetHandle：横向 right→left，纵向 bottom→top
 * @author Echo009
 */
import { WorkflowNode, WorkflowEdge } from '@/types';
import type { Connection } from '@xyflow/react';

type SourceHandleId = 'right' | 'bottom';
type TargetHandleId = 'left' | 'top';

export interface EdgeHandlesOptions {
  direction?: 'horizontal' | 'vertical';
}

export interface SnapEdgeHandlesOptions extends EdgeHandlesOptions {
  /**
   * true: 优先采用 direction；当节点相对位置与方向明显不一致时兜底到相对位置
   * false: 仅按相对位置选择
   */
  preferDirection?: boolean;
}

const AXIS_SWITCH_THRESHOLD = 1.15;
const OUTPUT_HANDLES = new Set(['right', 'bottom']);
const INPUT_HANDLES = new Set(['left', 'top']);

/**
 * 归一化连接方向：保证 source 来自输出锚点（right/bottom），target 落在输入锚点（left/top）。
 * 这样即使用户从输入锚点起手拖拽，也会得到符合语义的边方向。
 */
export function normalizeConnectionDirection(connection: Connection): Connection {
  const { source, sourceHandle, target, targetHandle } = connection;
  if (!source || !target) return connection;

  const sourceIsInput = !!sourceHandle && INPUT_HANDLES.has(sourceHandle);
  const targetIsOutput = !!targetHandle && OUTPUT_HANDLES.has(targetHandle);

  const shouldReverse =
    (sourceIsInput && targetIsOutput) ||
    (sourceIsInput && !targetHandle) ||
    (!sourceHandle && targetIsOutput);

  if (!shouldReverse) {
    return connection;
  }

  return {
    ...connection,
    source: target,
    sourceHandle: targetHandle,
    target: source,
    targetHandle: sourceHandle,
  };
}

const getRelativeHandlesForEdge = (
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode,
): { sourceHandleId: SourceHandleId; targetHandleId: TargetHandleId } => {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return { sourceHandleId: 'right', targetHandleId: 'left' };
  }

  return { sourceHandleId: 'bottom', targetHandleId: 'top' };
};

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
 * 连线吸附用锚点选择：
 * - 优先 direction（与自动布局保持一致）
 * - 当节点相对位置明显偏离方向时，自动切换到相对位置结果
 */
export function getSnapHandlesForEdge(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode,
  options: SnapEdgeHandlesOptions = {},
): { sourceHandleId: SourceHandleId; targetHandleId: TargetHandleId } {
  const { direction, preferDirection = true } = options;
  const relative = getRelativeHandlesForEdge(sourceNode, targetNode);

  if (!preferDirection || !direction) {
    return relative;
  }

  const byDirection = getOptimalHandlesForEdge(sourceNode, targetNode, { direction });
  const dx = Math.abs(targetNode.position.x - sourceNode.position.x);
  const dy = Math.abs(targetNode.position.y - sourceNode.position.y);

  if (direction === 'horizontal' && dy > dx * AXIS_SWITCH_THRESHOLD) {
    return relative;
  }

  if (direction === 'vertical' && dx > dy * AXIS_SWITCH_THRESHOLD) {
    return relative;
  }

  return byDirection;
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
