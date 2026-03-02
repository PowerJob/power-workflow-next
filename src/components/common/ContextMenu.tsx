import { useEffect, useRef, useCallback } from 'react';
import { ClipboardList, Split, Layers, Clipboard, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { NodeType } from '@/types';
import { useLocale } from '../../hooks/useLocale';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (!item.disabled) {
        item.onClick();
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[160px] z-[200]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <div key={item.id}>
          {item.divider && index > 0 && <div className="h-px bg-gray-100 my-1" />}
          <button
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors',
              item.disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
};

interface CanvasContextMenuProps {
  x: number;
  y: number;
  position: { x: number; y: number };
  onAddNode: (type: NodeType, position: { x: number; y: number }) => void;
  onPaste?: () => void;
  hasClipboard?: boolean;
  onClose: () => void;
}

export const CanvasContextMenu = ({
  x,
  y,
  position,
  onAddNode,
  onPaste,
  hasClipboard = false,
  onClose,
}: CanvasContextMenuProps) => {
  const { t } = useLocale();

  const items: ContextMenuItem[] = [
    {
      id: 'add-job',
      label: t('workflow.context.addJob') || '添加任务节点',
      icon: <ClipboardList size={14} />,
      onClick: () => onAddNode(NodeType.JOB, position),
    },
    {
      id: 'add-decision',
      label: t('workflow.context.addDecision') || '添加判断节点',
      icon: <Split size={14} />,
      onClick: () => onAddNode(NodeType.DECISION, position),
    },
    {
      id: 'add-nested',
      label: t('workflow.context.addNested') || '添加嵌套工作流',
      icon: <Layers size={14} />,
      onClick: () => onAddNode(NodeType.NESTED_WORKFLOW, position),
    },
  ];

  if (onPaste) {
    items.push({
      id: 'paste',
      label: t('workflow.context.paste') || '粘贴',
      icon: <Clipboard size={14} />,
      onClick: onPaste,
      disabled: !hasClipboard,
      divider: true,
    });
  }

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
};

interface NodeContextMenuProps {
  x: number;
  y: number;
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const NodeContextMenu = ({
  x,
  y,
  onEdit,
  onCopy,
  onDelete,
  onClose,
}: NodeContextMenuProps) => {
  const { t } = useLocale();

  const items: ContextMenuItem[] = [
    ...(onEdit
      ? [
          {
            id: 'edit',
            label: t('workflow.context.edit') || '编辑',
            onClick: onEdit,
          },
        ]
      : []),
    ...(onCopy
      ? [
          {
            id: 'copy',
            label: t('workflow.context.copy') || '复制',
            icon: <Clipboard size={14} />,
            onClick: onCopy,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            id: 'delete',
            label: t('workflow.context.delete') || '删除',
            icon: <Trash2 size={14} />,
            onClick: onDelete,
            divider: true,
          },
        ]
      : []),
  ];

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
};

export default ContextMenu;
