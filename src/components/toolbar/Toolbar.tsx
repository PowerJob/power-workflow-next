import { useCallback } from 'react';
import {
  Undo2,
  Redo2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Plus,
  Download,
  Upload,
  Settings,
  GitFork,
  Layers,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import { ToolbarButton, ToolbarDivider, ToolbarDropdown, DropdownItem } from './ToolbarButton';
import { useLocale } from '../../hooks/useLocale';
import { NodeType } from '../../types/workflow';

interface ToolbarProps {
  mode: 'edit' | 'view';

  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;

  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onFitView?: () => void;

  onAutoLayout?: (direction: 'horizontal' | 'vertical') => void;

  onAddNode?: (type: NodeType, position?: { x: number; y: number }) => void;

  onExport?: () => void;
  onImport?: () => void;

  onSearch?: (query: string) => void;
  searchQuery?: string;

  showMinimap?: boolean;
  onToggleMinimap?: () => void;
}

export const Toolbar = ({
  mode,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitView,
  onAutoLayout,
  onAddNode,
  onExport,
  onImport,
  onSearch,
  searchQuery = '',
  showMinimap = true,
  onToggleMinimap,
}: ToolbarProps) => {
  const { t } = useLocale();
  const isEdit = mode === 'edit';

  const handleAddJobNode = useCallback(() => {
    onAddNode?.(NodeType.JOB, { x: 100, y: 100 });
  }, [onAddNode]);

  const handleAddDecisionNode = useCallback(() => {
    onAddNode?.(NodeType.DECISION, { x: 100, y: 100 });
  }, [onAddNode]);

  const handleAddNestedNode = useCallback(() => {
    onAddNode?.(NodeType.NESTED_WORKFLOW, { x: 100, y: 100 });
  }, [onAddNode]);

  const handleHorizontalLayout = useCallback(() => {
    onAutoLayout?.('horizontal');
  }, [onAutoLayout]);

  const handleVerticalLayout = useCallback(() => {
    onAutoLayout?.('vertical');
  }, [onAutoLayout]);

  return (
    <div className="flex items-center h-12 px-3 bg-white border-b border-gray-200 gap-1">
      {isEdit && (
        <>
          <ToolbarButton
            icon={<Undo2 size={16} />}
            onClick={onUndo}
            disabled={!canUndo}
            title={t('workflow.toolbar.undo')}
          />
          <ToolbarButton
            icon={<Redo2 size={16} />}
            onClick={onRedo}
            disabled={!canRedo}
            title={t('workflow.toolbar.redo')}
          />
          <ToolbarDivider />

          <ToolbarDropdown icon={<ArrowRight size={16} />} label={t('workflow.toolbar.layout')}>
            <DropdownItem
              icon={<ArrowRight size={14} />}
              label="横向布局"
              onClick={handleHorizontalLayout}
            />
            <DropdownItem
              icon={<ArrowDown size={14} />}
              label="纵向布局"
              onClick={handleVerticalLayout}
            />
          </ToolbarDropdown>
          <ToolbarDivider />

          <ToolbarDropdown icon={<Plus size={16} />} label={t('workflow.toolbar.addNode')}>
            <DropdownItem
              icon={<Settings size={14} />}
              label="任务节点"
              onClick={handleAddJobNode}
            />
            <DropdownItem
              icon={<GitFork size={14} />}
              label="判断节点"
              onClick={handleAddDecisionNode}
            />
            <DropdownItem
              icon={<Layers size={14} />}
              label="嵌套工作流"
              onClick={handleAddNestedNode}
            />
          </ToolbarDropdown>
          <ToolbarDivider />

          <ToolbarButton icon={<Download size={16} />} onClick={onExport} title="导出 JSON" />
          <ToolbarButton icon={<Upload size={16} />} onClick={onImport} title="导入 JSON" />
          <ToolbarDivider />
        </>
      )}

      <ToolbarButton
        icon={<Maximize2 size={16} />}
        onClick={onFitView}
        title={t('workflow.toolbar.fitView')}
      />

      <ToolbarButton
        icon={<ZoomOut size={16} />}
        onClick={onZoomOut}
        title={t('workflow.toolbar.zoomOut')}
      />
      <button
        onClick={onZoomReset}
        className="min-w-[50px] h-8 px-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolbarButton
        icon={<ZoomIn size={16} />}
        onClick={onZoomIn}
        title={t('workflow.toolbar.zoomIn')}
      />

      {onSearch && (
        <>
          <ToolbarDivider />
          <input
            type="text"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="h-8 px-3 text-sm border border-gray-200 rounded-md w-40 focus:outline-none focus:border-blue-500"
          />
        </>
      )}

      {onToggleMinimap && (
        <>
          <ToolbarDivider />
          <ToolbarButton label="小地图" onClick={onToggleMinimap} active={showMinimap} />
        </>
      )}
    </div>
  );
};

export default Toolbar;
