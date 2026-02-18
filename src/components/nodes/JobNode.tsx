import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Settings } from 'lucide-react';
import { WorkflowNode, NodeStatus } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { clsx } from 'clsx';

const JobNode = ({ data, selected }: NodeProps<WorkflowNode>) => {
  const { t } = useLocale();

  return (
    <div
      className={clsx(
        'relative flex items-center bg-white rounded-md border-2 transition-all',
        selected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300',
        'w-[200px] h-[56px] px-3'
      )}
    >
      <Handle type="target" position={Position.Top} id="top" className="w-2 h-2 !bg-blue-500 border-2 border-white" />
      <Handle type="target" position={Position.Left} id="left" className="w-2 h-2 !bg-blue-500 border-2 border-white" />
      
      <div className="flex items-center gap-2 w-full overflow-hidden">
        <div className="flex-shrink-0 p-1 bg-gray-100 rounded">
          <Settings size={16} className="text-gray-600" />
        </div>
        <div className="flex-grow min-w-0">
          <div className="text-sm font-medium text-gray-700 truncate" title={data.label}>
            {data.label || t('workflow.node.job')}
          </div>
          {data.jobId && (
            <div className="text-xs text-gray-400 truncate">#{data.jobId}</div>
          )}
        </div>
        {data.status && (
          <div className={clsx(
            'w-2 h-2 rounded-full',
            data.status === NodeStatus.SUCCESS && 'bg-green-500',
            data.status === NodeStatus.FAILED && 'bg-red-500',
            data.status === NodeStatus.RUNNING && 'bg-blue-500',
            data.status === NodeStatus.WAITING && 'bg-orange-400',
            data.status === NodeStatus.STOPPED && 'bg-gray-400',
          )} />
        )}
      </div>

      <Handle type="source" position={Position.Right} id="right" className="w-2 h-2 !bg-blue-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-2 h-2 !bg-blue-500 border-2 border-white" />
    </div>
  );
};

export default memo(JobNode);
