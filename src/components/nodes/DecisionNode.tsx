import { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import WorkflowHandle from './WorkflowHandle';
import { WorkflowNode, NodeStatus } from '@/types';
import { useLocale } from '../../hooks/useLocale';
import { clsx } from 'clsx';
import { Split } from 'lucide-react';
import NodeTooltip from '../common/NodeTooltip';
import { getNodeStatusText, getNodeStatusTone } from './statusVisuals';

const MAX_LABEL_LENGTH = 14;

const truncateLabel = (label: string, maxLen: number): string => {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen) + '...';
};

interface DecisionNodeProps extends NodeProps<WorkflowNode> {
  mode?: 'edit' | 'view';
}

const DecisionNode = ({ data, selected, mode = 'edit' }: DecisionNodeProps) => {
  const { t } = useLocale();
  const label = data.label || t('workflow.node.decision');
  const isView = mode === 'view';
  const sideHandleType = mode === 'edit' ? 'source' : 'target';
  const statusStyles = getNodeStatusTone(data.status);
  const statusText = getNodeStatusText(data.status, t);
  const isRunning = data.status === NodeStatus.RUNNING;
  const isDisabled = data.enable === false || data.disableByControlNode;

  return (
    <div className={clsx("relative w-20 h-14 flex items-center justify-center", isDisabled && "opacity-60")} style={{ width: 80, height: 56 }}>
      <WorkflowHandle type={sideHandleType} position={Position.Top} id="top" className="z-10" />
      <WorkflowHandle type={sideHandleType} position={Position.Left} id="left" className="z-10" />

      {statusText && (
        <div
          className={clsx(
            'absolute -top-3 left-1/2 -translate-x-1/2 z-20 max-w-[72px] px-2 py-0.5 rounded-full text-[10px] font-semibold truncate',
            statusStyles.pill,
          )}
          title={statusText}
        >
          {statusText}
        </div>
      )}

      <div
        className={clsx(
          'absolute w-14 h-14 border-2 transition-all transform rotate-45 flex items-center justify-center',
          statusStyles.bg,
          isDisabled ? 'border-dashed' : 'border-solid',
          !isDisabled && statusStyles.border,
          selected && 'ring-2 ring-blue-200 shadow-md',
          !selected && !isView && !isDisabled && 'hover:border-blue-300',
          isRunning && 'node-running',
        )}
      >
        <div className="-rotate-45 relative">
          {isRunning && <span className="node-running-halo" aria-hidden />}
          <div className="relative z-10 p-1 rounded">
            <Split size={18} className={clsx('text-gray-600', data.status && statusStyles.iconText)} />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 w-32 text-center">
        <NodeTooltip content={label} maxLength={MAX_LABEL_LENGTH}>
          <div className={clsx('text-xs truncate', data.status ? statusStyles.text : 'text-gray-600')}>
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
