import { ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { clsx } from 'clsx';
import { Clock, Hash, AlertCircle, CheckCircle2, XCircle, Timer, Loader2 } from 'lucide-react';
import { NodeStatus } from '@/types';

interface ExecutionTooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export const ExecutionTooltip = ({ content, children }: ExecutionTooltipProps) => {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="z-[100] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1"
          sideOffset={8}
          collisionPadding={12}
        >
          <div className="relative min-w-[220px] max-w-[280px] overflow-hidden rounded-xl backdrop-blur-xl bg-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] border border-white/50">
            {/* 装饰性顶部渐变条 */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400" />

            {/* 内容区域 */}
            <div className="relative p-3.5">{content}</div>

            {/* 底部装饰光效 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>
          <TooltipPrimitive.Arrow className="fill-white/90 drop-shadow-sm" width={12} height={6} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};

interface ExecutionDetailsProps {
  startTime?: string;
  endTime?: string;
  error?: string;
  instanceId?: string;
  status?: NodeStatus;
}

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateString;
  }
};

// 状态图标和颜色配置
const STATUS_CONFIG: Record<NodeStatus, { icon: typeof Clock; colorClass: string; bgClass: string }> = {
  [NodeStatus.SUCCESS]: {
    icon: CheckCircle2,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-50',
  },
  [NodeStatus.FAILED]: {
    icon: XCircle,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-50',
  },
  [NodeStatus.RUNNING]: {
    icon: Loader2,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-50',
  },
  [NodeStatus.WAITING]: {
    icon: Timer,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50',
  },
  [NodeStatus.STOPPED]: {
    icon: AlertCircle,
    colorClass: 'text-slate-500',
    bgClass: 'bg-slate-50',
  },
  [NodeStatus.CANCELED]: {
    icon: AlertCircle,
    colorClass: 'text-gray-400',
    bgClass: 'bg-gray-50',
  },
};

const DetailRow = ({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-center gap-2.5 group">
    <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-50/80 flex items-center justify-center group-hover:bg-gray-100/80 transition-colors">
      <Icon size={12} className="text-gray-400" />
    </div>
    <div className="flex-1 flex items-center justify-between min-w-0">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <span className={clsx('text-xs font-medium text-gray-700 truncate ml-2', valueClass)}>{value}</span>
    </div>
  </div>
);

export const ExecutionDetails = ({
  startTime,
  endTime,
  error,
  instanceId,
  status,
}: ExecutionDetailsProps) => {
  const statusConfig = status ? STATUS_CONFIG[status] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="flex flex-col gap-2.5">
      {/* 实例 ID */}
      {instanceId && (
        <DetailRow icon={Hash} label="实例 ID" value={instanceId} valueClass="font-mono text-gray-600" />
      )}

      {/* 时间信息 */}
      {startTime && <DetailRow icon={Clock} label="开始时间" value={formatDateTime(startTime)} />}

      {endTime && <DetailRow icon={Clock} label="结束时间" value={formatDateTime(endTime)} />}

      {/* 状态指示 */}
      {statusConfig && StatusIcon && (
        <div className="flex items-center gap-2.5 pt-1 mt-1 border-t border-gray-100/80">
          <div
            className={clsx(
              'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
              statusConfig.bgClass,
            )}
          >
            <StatusIcon
              size={12}
              className={clsx(
                statusConfig.colorClass,
                status === NodeStatus.RUNNING && 'animate-spin',
              )}
            />
          </div>
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-[11px] text-gray-400 font-medium">执行状态</span>
            <span className={clsx('text-xs font-medium', statusConfig.colorClass)}>{status === NodeStatus.RUNNING ? '执行中' : '已完成'}</span>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="mt-2 p-2.5 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 border border-red-100/60">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle size={12} className="text-red-500" />
            <span className="text-[11px] font-semibold text-red-600">执行失败</span>
          </div>
          <p className="text-[11px] text-red-500/90 leading-relaxed break-words">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ExecutionTooltip;
