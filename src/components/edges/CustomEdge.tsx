import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, EdgeProps } from '@xyflow/react';
import { WorkflowEdge } from '../../types/workflow';

const CustomEdge = ({
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const property = data?.property;
  const isTrue = property === 'true';
  const isFalse = property === 'false';

  const edgeStyle = {
    ...style,
    strokeWidth: selected ? 2.5 : 2,
    stroke: selected ? '#3B82F6' : (isTrue ? '#52C41A' : isFalse ? '#EF4444' : '#94A3B8'),
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {(isTrue || isFalse) && (
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
            <div className={`px-1.5 py-0.5 rounded text-white font-bold text-xs shadow-sm ${isTrue ? 'bg-green-500' : 'bg-red-500'}`}>
              {isTrue ? 'Y' : 'N'}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);
