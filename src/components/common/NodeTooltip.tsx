import { ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface NodeTooltipProps {
  content: string;
  children: ReactNode;
  /**
   * 是否禁用 tooltip（当内容不需要截断时）
   */
  disabled?: boolean;
  /**
   * 最大字符数，超过时显示 tooltip
   */
  maxLength?: number;
}

/**
 * 节点名称 Tooltip 组件
 * 当文本超过 maxLength 字符时，hover 显示完整名称
 */
export const NodeTooltip = ({
  content,
  children,
  disabled = false,
  maxLength = 14,
}: NodeTooltipProps) => {
  const needsTooltip = !disabled && content.length > maxLength;

  if (!needsTooltip) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root delayDuration={500}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="z-[100] px-3 py-2 text-sm bg-gray-800 text-white rounded-md shadow-lg max-w-[300px] break-words"
          sideOffset={5}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-800" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};

export default NodeTooltip;
