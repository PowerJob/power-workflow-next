import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { ClipboardList, Split, Layers, X } from 'lucide-react';
import { WorkflowNodeData, NodeType, WorkflowNode, WorkflowReferenceOption } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { JobNodeForm, DecisionNodeForm, NestedWorkflowNodeForm } from './forms';

interface EditorPanelProps {
  node: WorkflowNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (nodeId: string, data: WorkflowNodeData) => void | Promise<void>;
  onBeforeSave?: (nodeId: string, data: WorkflowNodeData) => boolean | Promise<boolean>;
  jobOptions?: WorkflowReferenceOption[];
  workflowOptions?: WorkflowReferenceOption[];
}

export interface EditorPanelRef {
  openPanel: (nodeId: string) => void;
  closePanel: () => void;
  getEditingNode: () => WorkflowNode | null;
  validate: () => {
    valid: boolean;
    errors: Record<string, string>;
    warnings: Record<string, string>;
  };
  scrollToField: (fieldName: string) => void;
}

interface NodeFormWrapperProps {
  type: NodeType;
  data: WorkflowNodeData;
  onChange: (data: WorkflowNodeData) => void;
  onValidationChange: (errors: Record<string, string>, warnings: Record<string, string>) => void;
  jobOptions?: WorkflowReferenceOption[];
  workflowOptions?: WorkflowReferenceOption[];
}

const NodeFormWrapper = ({
  type,
  data,
  onChange,
  onValidationChange,
  jobOptions,
  workflowOptions,
}: NodeFormWrapperProps) => {
  switch (type) {
    case NodeType.JOB:
      return (
        <JobNodeForm
          data={data}
          onChange={onChange}
          onValidationChange={onValidationChange}
          jobOptions={jobOptions}
        />
      );
    case NodeType.DECISION:
      return (
        <DecisionNodeForm data={data} onChange={onChange} onValidationChange={onValidationChange} />
      );
    case NodeType.NESTED_WORKFLOW:
      return (
        <NestedWorkflowNodeForm
          data={data}
          onChange={onChange}
          onValidationChange={onValidationChange}
          workflowOptions={workflowOptions}
        />
      );
    default:
      return null;
  }
};

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case NodeType.JOB:
      return ClipboardList;
    case NodeType.DECISION:
      return Split;
    case NodeType.NESTED_WORKFLOW:
      return Layers;
    default:
      return ClipboardList;
  }
};

const getTypeIconClass = (type: NodeType): string => {
  switch (type) {
    case NodeType.JOB:
      return 'text-blue-600';
    case NodeType.DECISION:
      return 'text-amber-600';
    case NodeType.NESTED_WORKFLOW:
      return 'text-violet-600';
    default:
      return 'text-gray-600';
  }
};

const getTypeBorderClass = (type: NodeType): string => {
  switch (type) {
    case NodeType.JOB:
      return 'border-blue-500';
    case NodeType.DECISION:
      return 'border-amber-500';
    case NodeType.NESTED_WORKFLOW:
      return 'border-violet-500';
    default:
      return 'border-gray-400';
  }
};

const getTypeLabelKey = (type: NodeType): string => {
  switch (type) {
    case NodeType.JOB:
      return 'workflow.node.job';
    case NodeType.DECISION:
      return 'workflow.node.decision';
    case NodeType.NESTED_WORKFLOW:
      return 'workflow.node.nested';
    default:
      return 'workflow.panel.title';
  }
};

export const EditorPanel = forwardRef<EditorPanelRef, EditorPanelProps>(
  ({ node, open, onClose, onSave, onBeforeSave, jobOptions, workflowOptions }, ref) => {
    const { t } = useLocale();

    const [editedData, setEditedData] = useState<WorkflowNodeData | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [warnings, setWarnings] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
      if (node) {
        setEditedData({ ...node.data });
        setErrors({});
        setWarnings({});
        setShowConfirmDialog(false);
      }
    }, [node]);

    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    const handleDataChange = useCallback((newData: WorkflowNodeData) => {
      setEditedData(newData);
    }, []);

    const handleValidationChange = useCallback(
      (fieldErrors: Record<string, string>, fieldWarnings: Record<string, string>) => {
        setErrors(fieldErrors);
        setWarnings(fieldWarnings);
      },
      [],
    );

    const handleSave = useCallback(async () => {
      if (!node || !editedData) return;

      if (Object.keys(errors).length > 0) {
        return;
      }

      if (Object.keys(warnings).length > 0 && !showConfirmDialog) {
        setShowConfirmDialog(true);
        return;
      }

      if (onBeforeSave) {
        try {
          const canSave = await onBeforeSave(node.id, editedData);
          if (!canSave) return;
        } catch {
          return;
        }
      }

      setIsSaving(true);
      try {
        await onSave(node.id, editedData);
        onClose();
      } finally {
        setIsSaving(false);
      }
    }, [node, editedData, errors, warnings, showConfirmDialog, onBeforeSave, onSave, onClose]);

    const handleCancel = useCallback(() => {
      onClose();
    }, [onClose]);

    const validate = useCallback((): {
      valid: boolean;
      errors: Record<string, string>;
      warnings: Record<string, string>;
    } => {
      return {
        valid: Object.keys(errors).length === 0,
        errors,
        warnings,
      };
    }, [errors, warnings]);

    const scrollToField = useCallback((fieldName: string) => {
      const element = document.querySelector(`[data-field="${fieldName}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = element.querySelector('input, textarea');
        if (input) {
          (input as HTMLElement).focus();
        }
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        openPanel: () => {},
        closePanel: onClose,
        getEditingNode: () => node,
        validate,
        scrollToField,
      }),
      [node, onClose, validate, scrollToField],
    );

    if (!node || !editedData) return null;

    const Icon = getNodeIcon(node.data.type);
    const hasErrors = Object.keys(errors).length > 0;
    const hasWarnings = Object.keys(warnings).length > 0;
    const typeBorderClass = getTypeBorderClass(node.data.type);
    const typeIconClass = getTypeIconClass(node.data.type);
    const typeLabel = t(getTypeLabelKey(node.data.type));
    const nodeLabel = editedData.label?.trim() || t('workflow.panel.title');

    return (
      <>
        {/* 遮罩：点击关闭，聚焦编辑区域 */}
        <div
          role="presentation"
          aria-hidden
          className={clsx(
            'fixed inset-0 z-[99] bg-black/20 transition-opacity duration-200 ease-in-out',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          onClick={onClose}
        />

        <div
          className={clsx(
            'fixed top-0 right-0 h-full w-[320px] bg-white shadow-xl z-[100]',
            'flex flex-col transition-transform duration-200 ease-in-out',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {/* 头部：类型色条 + 节点名称 + 类型副标题 */}
          <div
            className={clsx(
              'flex items-start justify-between gap-3 pl-4 pr-3 py-3 border-b border-gray-200',
              'bg-gray-50/90',
            )}
          >
            <div className={clsx('flex min-w-0 flex-1 gap-3 rounded-r border-l-4 pl-3', typeBorderClass)}>
              <div className="mt-0.5 shrink-0 rounded bg-gray-100 p-1.5">
                <Icon size={16} className={typeIconClass} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{nodeLabel}</p>
                <p className="text-xs text-gray-500">{typeLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-200/80 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
              aria-label={t('workflow.panel.close')}
            >
              <X size={18} />
            </button>
          </div>

        <div className="flex-1 overflow-y-auto p-4">
          <NodeFormWrapper
            type={node.data.type}
            data={editedData}
            onChange={handleDataChange}
            onValidationChange={handleValidationChange}
            jobOptions={jobOptions}
            workflowOptions={workflowOptions}
          />
        </div>

        {showConfirmDialog && hasWarnings && (
          <div className="p-4 bg-amber-50 border-t border-amber-200">
            <p className="text-sm text-amber-700 mb-3">{t('workflow.panel.confirmSave')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                {t('workflow.panel.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 text-sm text-white bg-amber-500 rounded-md hover:bg-amber-600"
              >
                {t('workflow.panel.continue')}
              </button>
            </div>
          </div>
        )}

        {hasErrors && !showConfirmDialog && (
          <div className="p-3 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-500">{Object.values(errors).join('; ')}</p>
          </div>
        )}

        <div className="flex gap-2 border-t border-gray-200 bg-gray-50/90 p-4 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
          >
            {t('workflow.panel.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={hasErrors || isSaving}
            className={clsx(
              'flex-1 px-3 py-2 text-sm text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
              hasErrors || isSaving
                ? 'bg-gray-300 cursor-not-allowed focus:ring-gray-300'
                : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400',
            )}
          >
            {isSaving ? '...' : t('workflow.panel.save')}
          </button>
        </div>
      </div>
      </>
    );
  },
);

EditorPanel.displayName = 'EditorPanel';

export default EditorPanel;
