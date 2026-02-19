import { memo } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import WorkflowHandle from './WorkflowHandle';
import { ClipboardList } from 'lucide-react';
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

interface JobNodeProps extends NodeProps<WorkflowNode> {
  mode?: 'edit' | 'view';
}

const JobNode = ({ data, selected, mode = 'edit' }: JobNodeProps) => {
  const { t } = useLocale();
  const label = data.label || t('workflow.node.job');
  const isView = mode === 'view';
  const statusStyles = getNodeStatusTone(data.status);
  const isRunning = data.status === NodeStatus.RUNNING;
  const statusText = getNodeStatusText(data.status, t);

  const hasExecutionInfo = data.execution && (data.execution.duration || data.execution.startTime);

  const nodeContent = (
    <div
      className={clsx(
        'relative flex flex-col rounded-md border-2 transition-all',
        isView ? 'w-[200px] h-[72px] px-3 py-2' : 'w-[200px] h-[56px] px-3',
        statusStyles.bg,
        statusStyles.border,
        selected && 'ring-2 ring-blue-200 shadow-md',
        !selected && !isView && 'hover:border-blue-300',
        isRunning && 'node-running',
      )}
    >
      <WorkflowHandle type="target" position={Position.Top} id="top" />
      <WorkflowHandle type="target" position={Position.Left} id="left" />

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

      <div className="flex items-center gap-2 w-full overflow-hidden flex-1">
        <div className="relative flex-shrink-0">
          {isRunning && <span className="node-running-halo" aria-hidden />}
          <div className={clsx('relative z-10 p-1 rounded', statusStyles.iconBg)}>
            <ClipboardList size={16} className={clsx('text-gray-600', data.status && statusStyles.iconText)} />
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <NodeTooltip content={label} maxLength={MAX_LABEL_LENGTH}>
            <div
              className={clsx(
                'text-sm font-medium truncate',
                data.status ? statusStyles.text : 'text-gray-700',
              )}
            >
              {truncateLabel(label, MAX_LABEL_LENGTH)}
            </div>
          </NodeTooltip>
          <div className="text-xs text-gray-400 truncate">
            {data.jobId && <span>#{data.jobId}</span>}
            {isView && data.instanceId && <span className="ml-2">实例:{data.instanceId}</span>}
          </div>
        </div>
      </div>

      <WorkflowHandle type="source" position={Position.Right} id="right" />
      <WorkflowHandle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );

  if (isView && hasExecutionInfo) {
    return (
      <ExecutionTooltip
        content={
          <ExecutionDetails
            duration={data.execution?.duration}
            startTime={data.execution?.startTime}
            endTime={data.execution?.endTime}
            error={data.execution?.error}
          />
        }
      >
        {nodeContent}
      </ExecutionTooltip>
    );
  }

  return nodeContent;
};

export default memo(JobNode);
