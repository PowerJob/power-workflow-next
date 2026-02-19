import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ClipboardList } from 'lucide-react';
import { WorkflowNode, NodeStatus } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { clsx } from 'clsx';
import NodeTooltip from '../common/NodeTooltip';
import { ExecutionTooltip, ExecutionDetails } from '../common/ExecutionTooltip';

const MAX_LABEL_LENGTH = 14;

const truncateLabel = (label: string, maxLen: number): string => {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen) + '...';
};

const getStatusStyles = (status?: NodeStatus) => {
  if (!status) return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-600' };

  switch (status) {
    case NodeStatus.SUCCESS:
      return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600' };
    case NodeStatus.FAILED:
      return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600' };
    case NodeStatus.RUNNING:
      return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' };
    case NodeStatus.WAITING:
      return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-500' };
    case NodeStatus.STOPPED:
      return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-500' };
    default:
      return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-600' };
  }
};

const getStatusText = (status: NodeStatus, t: (key: string) => string): string => {
  switch (status) {
    case NodeStatus.SUCCESS:
      return t('workflow.status.success');
    case NodeStatus.FAILED:
      return t('workflow.status.failed');
    case NodeStatus.RUNNING:
      return t('workflow.status.running');
    case NodeStatus.WAITING:
      return t('workflow.status.waiting');
    case NodeStatus.STOPPED:
      return t('workflow.status.stopped');
    default:
      return '';
  }
};

interface JobNodeProps extends NodeProps<WorkflowNode> {
  mode?: 'edit' | 'view';
}

const JobNode = ({ data, selected, mode = 'edit' }: JobNodeProps) => {
  const { t } = useLocale();
  const label = data.label || t('workflow.node.job');
  const isView = mode === 'view';
  const statusStyles = getStatusStyles(data.status);
  const isRunning = data.status === NodeStatus.RUNNING;

  const hasExecutionInfo = data.execution && (data.execution.duration || data.execution.startTime);

  const nodeContent = (
    <div
      className={clsx(
        'relative flex flex-col bg-white rounded-md border-2 transition-all',
        isView ? 'w-[200px] h-[72px] px-3 py-2' : 'w-[200px] h-[56px] px-3',
        statusStyles.bg,
        selected ? 'border-blue-500 shadow-md' : statusStyles.border,
        !selected && !isView && 'hover:border-blue-300',
        isRunning && 'node-running',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-2 h-2 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2 h-2 !bg-blue-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 w-full overflow-hidden flex-1">
        <div
          className={clsx(
            'flex-shrink-0 p-1 rounded',
            isView && data.status ? 'bg-white' : 'bg-gray-100',
          )}
        >
          <ClipboardList
            size={16}
            className={clsx('text-gray-600', isView && data.status && statusStyles.text)}
          />
        </div>
        <div className="flex-grow min-w-0">
          <NodeTooltip content={label} maxLength={MAX_LABEL_LENGTH}>
            <div
              className={clsx(
                'text-sm font-medium truncate',
                isView && data.status ? statusStyles.text : 'text-gray-700',
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

      {isView && data.status && (
        <div className={clsx('flex items-center gap-1 text-xs', statusStyles.text)}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {getStatusText(data.status, t)}
        </div>
      )}

      {!isView && data.status && (
        <div
          className={clsx(
            'w-2 h-2 rounded-full',
            data.status === NodeStatus.SUCCESS && 'bg-green-500',
            data.status === NodeStatus.FAILED && 'bg-red-500',
            data.status === NodeStatus.RUNNING && 'bg-blue-500 animate-pulse',
            data.status === NodeStatus.WAITING && 'bg-orange-400',
            data.status === NodeStatus.STOPPED && 'bg-gray-400',
          )}
        />
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2 h-2 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-2 h-2 !bg-blue-500 border-2 border-white"
      />
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
