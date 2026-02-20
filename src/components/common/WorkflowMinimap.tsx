import { memo } from 'react';
import { MiniMap } from '@xyflow/react';
import { WorkflowNode, NodeStatus } from '../../types/workflow';

const getNodeColor = (node: WorkflowNode): string => {
  const status = node.data?.status;

  switch (status) {
    case NodeStatus.SUCCESS:
      return '#52C41A';
    case NodeStatus.FAILED:
      return '#FF4D4F';
    case NodeStatus.RUNNING:
      return '#1890FF';
    case NodeStatus.WAITING:
      return '#FFA940';
    case NodeStatus.STOPPED:
      return '#8C8C8C';
    case NodeStatus.CANCELED:
      return '#BFBFBF';
    default:
      return '#E5E7EB';
  }
};

interface WorkflowMinimapProps {
  visible?: boolean;
}

export const WorkflowMinimap = memo(({ visible = true }: WorkflowMinimapProps) => {
  if (!visible) return null;

  return (
    <MiniMap
      nodeColor={getNodeColor}
      style={{
        width: 200,
        height: 150,
        backgroundColor: '#F9FAFB',
      }}
      maskColor="rgba(0, 0, 0, 0.1)"
      pannable
      zoomable
    />
  );
});

WorkflowMinimap.displayName = 'WorkflowMinimap';

export default WorkflowMinimap;
