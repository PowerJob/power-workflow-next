import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { clsx } from 'clsx';
import { ClipboardList, Split, Layers, X } from 'lucide-react';
import { WorkflowNodeData, NodeType, WorkflowNode } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { JobNodeForm, DecisionNodeForm, NestedWorkflowNodeForm } from './forms';

interface EditorPanelProps {
  node: WorkflowNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (nodeId: string, data: WorkflowNodeData) => void | Promise<void>;
  onBeforeSave?: (nodeId: string, data: WorkflowNodeData) => boolean | Promise<boolean>;
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
}

const NodeFormWrapper = ({ type, data, onChange, onValidationChange }: NodeFormWrapperProps) => {
  switch (type) {
    case NodeType.JOB:
      return (
        <JobNodeForm data={data} onChange={onChange} onValidationChange={onValidationChange} />
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

export const EditorPanel = forwardRef<EditorPanelRef, EditorPanelProps>(
  ({ node, open, onClose, onSave, onBeforeSave }, ref) => {
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

    return (
      <div
        className={clsx(
          'fixed top-0 right-0 h-full w-[320px] bg-white shadow-lg z-[100]',
          'flex flex-col transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded">
              <Icon size={16} className="text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{t('workflow.panel.title')}</span>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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

        <div className="flex gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="flex-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t('workflow.panel.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={hasErrors || isSaving}
            className={clsx(
              'flex-1 px-3 py-2 text-sm text-white rounded-md transition-colors',
              hasErrors || isSaving
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600',
            )}
          >
            {isSaving ? '...' : t('workflow.panel.save')}
          </button>
        </div>
      </div>
    );
  },
);

EditorPanel.displayName = 'EditorPanel';

export default EditorPanel;
