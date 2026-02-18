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
          className="z-[100] px-3 py-2 bg-gray-800 text-white rounded-md shadow-lg max-w-[300px] text-sm"
          sideOffset={5}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-800" />
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
    <div className="space-y-1">
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">时长:</span>
        <span>{formatDuration(duration || 0)}</span>
      </div>
      {startTime && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">开始:</span>
          <span>{formatDateTime(startTime)}</span>
        </div>
      )}
      {endTime && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">结束:</span>
          <span>{formatDateTime(endTime)}</span>
        </div>
      )}
      {error && <div className="mt-2 pt-2 border-t border-gray-600 text-red-400">❌ {error}</div>}
    </div>
  );
};

export default ExecutionTooltip;
