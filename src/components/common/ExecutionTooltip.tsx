import { ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface ExecutionTooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export const ExecutionTooltip = ({ content, children }: ExecutionTooltipProps) => {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root delayDuration={500}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="z-[100] w-[200px] p-3 bg-white text-gray-700 rounded-lg shadow-xl border border-gray-200 text-sm overflow-hidden"
          sideOffset={5}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-white stroke-gray-200" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};

interface ExecutionDetailsProps {
  duration?: number;
  startTime?: string;
  endTime?: string;
  error?: string;
}

export const formatDuration = (ms: number): string => {
  if (!ms || ms < 0) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${seconds}秒`;
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
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

export const ExecutionDetails = ({
  duration,
  startTime,
  endTime,
  error,
}: ExecutionDetailsProps) => {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="grid grid-cols-[36px_1fr] gap-x-2 gap-y-1.5 text-xs">
        <span className="text-gray-400 flex-shrink-0">时长</span>
        <span className="font-medium font-mono text-gray-900 text-right min-w-0 break-words">
          {formatDuration(duration || 0)}
        </span>

        {startTime && (
          <>
            <span className="text-gray-400 flex-shrink-0">开始</span>
            <span className="font-mono text-gray-600 text-right min-w-0 break-words">
              {formatDateTime(startTime)}
            </span>
          </>
        )}
        {endTime && (
          <>
            <span className="text-gray-400 flex-shrink-0">结束</span>
            <span className="font-mono text-gray-600 text-right min-w-0 break-words">
              {formatDateTime(endTime)}
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="mt-1 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100 break-words leading-relaxed min-w-0 overflow-hidden">
          <div className="font-semibold mb-0.5">
            <span>❌ 执行失败</span>
          </div>
          <div className="break-words">{error}</div>
        </div>
      )}
    </div>
  );
};

export default ExecutionTooltip;
