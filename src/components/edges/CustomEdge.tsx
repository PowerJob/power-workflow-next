import { memo, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  EdgeProps,
  useReactFlow,
} from '@xyflow/react';
import { WorkflowEdge, WorkflowEdgeData } from '../../types/workflow';
import { clsx } from 'clsx';

type PropertyType = '' | 'true' | 'false';

const cycleProperty = (current: PropertyType): PropertyType => {
  if (current === '') return 'true';
  if (current === 'true') return 'false';
  return '';
};

const CustomEdge = ({
  id,
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
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const property = (data?.property as PropertyType) || '';
  const isTrue = property === 'true';
  const isFalse = property === 'false';
  const hasProperty = isTrue || isFalse;

  const edgeStyle = {
    ...style,
    strokeWidth: selected ? 2.5 : 2,
    stroke: selected ? '#3B82F6' : isTrue ? '#52C41A' : isFalse ? '#EF4444' : '#94A3B8',
  };

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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

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
    </>
  );
};

export default memo(CustomEdge);
