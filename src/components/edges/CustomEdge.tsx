import { memo, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
  useReactFlow,
  Position,
} from '@xyflow/react';
import { WorkflowEdge, WorkflowEdgeData, NodeType, NodeStatus } from '@/types';
import { EDGE_STROKE, EDGE_STROKE_DASHARRAY_DISABLED } from '../../constants/edgeColors';
import { clsx } from 'clsx';

type PropertyType = '' | 'true' | 'false';
/** 边线相对锚点中心的偏移（像素），越小边越贴近锚点 */
const ANCHOR_GAP = 2;

/** 判断节点状态是否为终态（已执行完成） */
const isTerminalStatus = (status?: NodeStatus): boolean => {
  return status === NodeStatus.SUCCESS ||
         status === NodeStatus.FAILED ||
         status === NodeStatus.STOPPED ||
         status === NodeStatus.CANCELED;
};

const offsetFromAnchor = (x: number, y: number, position: Position | undefined, gap: number) => {
  switch (position) {
    case Position.Left:
      return { x: x - gap, y };
    case Position.Right:
      return { x: x + gap, y };
    case Position.Top:
      return { x, y: y - gap };
    case Position.Bottom:
      return { x, y: y + gap };
    default:
      return { x, y };
  }
};

const cycleProperty = (current: PropertyType): PropertyType => {
  if (current === '') return 'true';
  if (current === 'true') return 'false';
  return '';
};

type CustomEdgeProps = EdgeProps<WorkflowEdge> & {
  mode?: 'edit' | 'view';
  onToggleProperty?: (edgeId: string) => void;
};

const CustomEdge = ({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
  mode = 'edit',
  onToggleProperty,
}: CustomEdgeProps) => {
  const { setEdges, getNode } = useReactFlow();
  const sourceNode = getNode(source);
  const isFromDecisionNode = sourceNode?.data?.type === NodeType.DECISION;

  const property = (data?.property as PropertyType) || '';
  const isTrue = property === 'true';
  const isFalse = property === 'false';
  const hasProperty = isTrue || isFalse;

  /** 未执行路径（如判断节点未选中分支）：置灰 + 虚线 */
  const isDisabledEdge = data?.enable === false;

  /** 视图模式：根据 source 节点终态判断是否已执行 */
  const sourceNodeData = sourceNode?.data as { status?: NodeStatus } | undefined;
  const isExecuted = mode === 'view' &&
                     isTerminalStatus(sourceNodeData?.status) &&
                     !isDisabledEdge;

  const strokeColor = isDisabledEdge
    ? EDGE_STROKE.disabled
    : mode === 'view'
      ? (isExecuted ? EDGE_STROKE.executed : EDGE_STROKE.disabled)
      : !isFromDecisionNode
        ? (selected ? EDGE_STROKE.selected : EDGE_STROKE.default)
        : selected
          ? EDGE_STROKE.selected
          : isTrue
            ? EDGE_STROKE.propertyTrue
            : isFalse
              ? EDGE_STROKE.propertyFalse
              : EDGE_STROKE.default;
  const strokeWidth = selected ? 2.5 : 2;
  const edgeStyle = {
    ...style,
    strokeWidth,
    stroke: strokeColor,
    ...(isDisabledEdge && { strokeDasharray: EDGE_STROKE_DASHARRAY_DISABLED }),
  };

  const sourcePoint = offsetFromAnchor(sourceX, sourceY, sourcePosition, ANCHOR_GAP);
  const targetPoint = offsetFromAnchor(targetX, targetY, targetPosition, ANCHOR_GAP);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    sourcePosition,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    targetPosition,
  });

  const handlePropertyToggle = useCallback(() => {
    if (onToggleProperty) {
      onToggleProperty(id);
      return;
    }

    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          const currentProperty = ((edge.data as WorkflowEdgeData)?.property as PropertyType) || '';
          const newProperty = cycleProperty(currentProperty);
          return {
            ...edge,
            data: {
              ...(edge.data as WorkflowEdgeData),
              property: newProperty,
            },
          };
        }
        return edge;
      }),
    );
  }, [id, onToggleProperty, setEdges]);

  const canEditEdge = mode === 'edit';
  const showPropertyLabel = isFromDecisionNode && (canEditEdge || hasProperty);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

      {showPropertyLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: canEditEdge ? 'all' : 'none',
            }}
            className="nodrag nopan"
          >
            {hasProperty ? (
              canEditEdge ? (
                <button
                  onClick={handlePropertyToggle}
                  className={clsx(
                    'px-1.5 py-0.5 rounded text-white font-bold text-xs shadow-sm cursor-pointer transition-all',
                    'hover:scale-110',
                    isTrue ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600',
                  )}
                >
                  {isTrue ? 'Y' : 'N'}
                </button>
              ) : (
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded text-white font-bold text-xs shadow-sm',
                    isTrue ? 'bg-green-500' : 'bg-red-500',
                  )}
                >
                  {isTrue ? 'Y' : 'N'}
                </span>
              )
            ) : canEditEdge ? (
              <button
                onClick={handlePropertyToggle}
                className={clsx(
                  'w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs',
                  'flex items-center justify-center cursor-pointer',
                  'hover:bg-gray-300 transition-all',
                  selected && 'ring-2 ring-blue-300',
                )}
              >
                +
              </button>
            ) : null}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);
