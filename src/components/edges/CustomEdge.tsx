import { memo, useCallback, useEffect, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
  useReactFlow,
  useStore,
  Position,
  MarkerType,
} from '@xyflow/react';
import { WorkflowEdge, WorkflowEdgeData, NodeType } from '../../types/workflow';
import { clsx } from 'clsx';

type PropertyType = '' | 'true' | 'false';
/** 边线相对锚点中心的偏移（像素），越小边越贴近锚点 */
const ANCHOR_GAP = 2;

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
}: EdgeProps<WorkflowEdge>) => {
  const { setEdges, getNode } = useReactFlow();
  const defaultMarkerEnd = useStore((s) => s.defaultEdgeOptions?.markerEnd);
  const currentMarkerColor = useStore((s) => {
    const e = s.edges.find((edge) => edge.id === id);
    if (!e?.markerEnd || typeof e.markerEnd !== 'object' || !('color' in e.markerEnd))
      return undefined;
    return (e.markerEnd as { color: string }).color;
  });
  const sourceNode = getNode(source);
  const isFromDecisionNode = sourceNode?.data?.type === NodeType.DECISION;

  const property = (data?.property as PropertyType) || '';
  const isTrue = property === 'true';
  const isFalse = property === 'false';
  const hasProperty = isTrue || isFalse;

  const strokeColor = !isFromDecisionNode
    ? (selected ? '#3B82F6' : '#94A3B8')
    : selected
      ? '#3B82F6'
      : isTrue
        ? '#52C41A'
        : isFalse
          ? '#EF4444'
          : '#94A3B8';
  const strokeWidth = selected ? 2.5 : 2;
  const edgeStyle = {
    ...style,
    strokeWidth,
    stroke: strokeColor,
  };

  const markerEndWithColor = useMemo(
    () =>
      defaultMarkerEnd && typeof defaultMarkerEnd === 'object'
        ? { ...defaultMarkerEnd, color: strokeColor }
        : { type: MarkerType.ArrowClosed, width: 11, height: 11, color: strokeColor },
    [defaultMarkerEnd, strokeColor],
  );

  useEffect(() => {
    if (currentMarkerColor !== strokeColor) {
      setEdges((edges) =>
        edges.map((e) => (e.id === id ? { ...e, markerEnd: markerEndWithColor } : e)),
      );
    }
  }, [id, strokeColor, currentMarkerColor, markerEndWithColor, setEdges]);

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

  const coloredMarkerEnd =
    markerEnd && typeof markerEnd !== 'string'
      ? {
          ...markerEnd,
          color: strokeColor,
        }
      : markerEnd;

  const handlePropertyToggle = useCallback(() => {
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
  }, [id, setEdges]);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={coloredMarkerEnd} style={edgeStyle} />

      {isFromDecisionNode && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {hasProperty ? (
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
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);
