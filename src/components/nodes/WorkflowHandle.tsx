import { memo } from 'react';
import { Handle, Position, type HandleProps } from '@xyflow/react';
import { clsx } from 'clsx';

/** 锚点可点击/拖拽的命中区域边长（像素），视觉圆点保持 8px */
const HANDLE_HIT_SIZE = 16;

type WorkflowHandleProps = Pick<HandleProps, 'type' | 'position' | 'id'> & {
  /** 可选，用于如 DecisionNode 的 z-10 */
  className?: string;
};

const WorkflowHandle = ({ type, position, id, className }: WorkflowHandleProps) => (
  <Handle
    type={type}
    position={position}
    id={id}
    style={{ width: HANDLE_HIT_SIZE, height: HANDLE_HIT_SIZE }}
    className={clsx(
      '!bg-transparent border-0 flex items-center justify-center',
      className,
    )}
  >
    <div
      className="w-2 h-2 rounded-full !bg-blue-500 border-2 border-white pointer-events-none"
      aria-hidden
    />
  </Handle>
);

export default memo(WorkflowHandle);
