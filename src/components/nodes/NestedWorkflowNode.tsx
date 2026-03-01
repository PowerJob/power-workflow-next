import { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import WorkflowHandle from './WorkflowHandle';
import { Layers, SkipForward } from 'lucide-react';
import { WorkflowNode, NodeStatus } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { clsx } from 'clsx';
import NodeTooltip from '../common/NodeTooltip';
import { ExecutionTooltip, ExecutionDetails } from '../common/ExecutionTooltip';
import { getNodeStatusText, getNodeStatusTone } from './statusVisuals';

const MAX_LABEL_LENGTH = 14;

const truncateLabel = (label: string, maxLen: number): string => {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen) + '...';
};

interface NestedWorkflowNodeProps extends NodeProps<WorkflowNode> {
  mode?: 'edit' | 'view';
}

const NestedWorkflowNode = ({ data, selected, mode = 'edit' }: NestedWorkflowNodeProps) => {
  const { t } = useLocale();
  const label = data.label || t('workflow.node.nested');
  const sideHandleType = mode === 'edit' ? 'source' : 'target';
  const statusStyles = getNodeStatusTone(data.status);
  const statusText = getNodeStatusText(data.status, t);
  const isRunning = data.status === NodeStatus.RUNNING;
  const isView = mode === 'view';
  const hasExecutionInfo = data.execution && (data.execution.duration ?? data.execution.startTime);
  const isDisabled = data.enable === false || data.disableByControlNode;

  const nodeContent = (
    <div
      className={clsx(
        'relative flex items-center rounded-md border-2 transition-all',
        statusStyles.bg,
        isDisabled ? 'border-dashed opacity-60' : 'border-solid',
        !isDisabled && statusStyles.border,
        selected && 'ring-2 ring-blue-200 shadow-md',
        !selected && !isView && !isDisabled && 'hover:border-blue-300',
        isRunning && 'node-running',
        'w-[200px] h-[56px] px-3',
      )}
    >
      <WorkflowHandle type={sideHandleType} position={Position.Top} id="top" />
      <WorkflowHandle type={sideHandleType} position={Position.Left} id="left" />

      {statusText && (
        <div
          className={clsx(
            'absolute top-2 right-2 max-w-[84px] px-2 py-0.5 rounded-full text-[10px] font-semibold truncate',
            statusStyles.pill,
          )}
          title={statusText}
        >
          {statusText}
        </div>
      )}

      <div className="flex items-center gap-2 w-full overflow-hidden">
        <div className="relative flex-shrink-0">
          {isRunning && <span className="node-running-halo" aria-hidden />}
          <div className="relative z-10 p-1 rounded">
            <Layers size={16} className={clsx('text-indigo-600', data.status && statusStyles.iconText)} />
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <NodeTooltip content={label} maxLength={MAX_LABEL_LENGTH}>
            <div className={clsx('text-sm font-medium truncate', data.status ? statusStyles.text : 'text-gray-700')}>
              {truncateLabel(label, MAX_LABEL_LENGTH)}
            </div>
          </NodeTooltip>
          {data.targetWorkflowId && (
            <div className="text-xs text-gray-400 truncate">Ref: #{data.targetWorkflowId}</div>
          )}
        </div>
      </div>

      {data.skip && (
        <div className="absolute bottom-2 right-2 z-10">
          <SkipForward size={14} className="text-orange-400" />
        </div>
      )}

      <WorkflowHandle type="source" position={Position.Right} id="right" />
      <WorkflowHandle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );

  if (isView && (hasExecutionInfo || data.instanceId)) {
    const tooltipContent = hasExecutionInfo ? (
      <ExecutionDetails
        duration={data.execution?.duration}
        startTime={data.execution?.startTime}
        endTime={data.execution?.endTime}
        error={data.execution?.error}
        instanceId={data.instanceId}
      />
    ) : (
      <div className="text-xs text-gray-700">
        <span className="text-gray-400">ID：</span>
        <span className="font-mono break-all">{data.instanceId}</span>
      </div>
    );
    return (
      <ExecutionTooltip content={tooltipContent}>
        {nodeContent}
      </ExecutionTooltip>
    );
  }

  return nodeContent;
};

export default memo(NestedWorkflowNode);
