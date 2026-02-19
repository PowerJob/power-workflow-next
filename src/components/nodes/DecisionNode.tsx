import { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import WorkflowHandle from './WorkflowHandle';
import { WorkflowNode, NodeStatus } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { clsx } from 'clsx';
import { Split } from 'lucide-react';
import NodeTooltip from '../common/NodeTooltip';

const MAX_LABEL_LENGTH = 14;

const truncateLabel = (label: string, maxLen: number): string => {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen) + '...';
};

const DecisionNode = ({ data, selected }: NodeProps<WorkflowNode>) => {
  const { t } = useLocale();
  const label = data.label || t('workflow.node.decision');

  return (
    <div className="relative w-20 h-14 flex items-center justify-center" style={{ width: 80, height: 56 }}>
      <WorkflowHandle type="target" position={Position.Top} id="top" className="z-10" />
      <WorkflowHandle type="target" position={Position.Left} id="left" className="z-10" />

      <div
        className={clsx(
          'absolute w-14 h-14 bg-white border-2 transition-all transform rotate-45 flex items-center justify-center',
          selected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300',
          data.status === NodeStatus.SUCCESS && 'border-green-500 bg-green-50',
          data.status === NodeStatus.FAILED && 'border-red-500 bg-red-50',
          data.status === NodeStatus.RUNNING && 'border-blue-500 bg-blue-50 animate-pulse',
        )}
      >
        <div className="-rotate-45">
          <Split size={20} className="text-gray-600" />
        </div>
      </div>

      <div className="absolute -bottom-6 w-32 text-center">
        <NodeTooltip content={label} maxLength={MAX_LABEL_LENGTH}>
          <div className="text-xs text-gray-600 truncate">
            {truncateLabel(label, MAX_LABEL_LENGTH)}
          </div>
        </NodeTooltip>
      </div>

      <WorkflowHandle type="source" position={Position.Right} id="right" className="z-10" />
      <WorkflowHandle type="source" position={Position.Bottom} id="bottom" className="z-10" />
    </div>
  );
};

export default memo(DecisionNode);
