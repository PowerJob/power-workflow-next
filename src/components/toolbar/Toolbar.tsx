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
  ClipboardList,
  Split,
  Layers,
  ArrowRight,
  ArrowDown,
  LayoutDashboard,
  Map,
} from 'lucide-react';
import { ToolbarButton, ToolbarDropdown, DropdownItem } from './ToolbarButton';
import { useLocale } from '../../hooks/useLocale';
import { NodeType } from '@/types';

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
    <div className="flex items-center h-10 px-2 bg-white border-b border-gray-200 gap-2">
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

          <ToolbarDropdown icon={<Plus size={16} />} title={t('workflow.toolbar.addNode')}>
            <DropdownItem
              icon={<ClipboardList size={14} />}
              label={t('workflow.node.job')}
              onClick={handleAddJobNode}
            />
            <DropdownItem
              icon={<Split size={14} />}
              label={t('workflow.node.decision')}
              onClick={handleAddDecisionNode}
            />
            <DropdownItem
              icon={<Layers size={14} />}
              label={t('workflow.node.nested')}
              onClick={handleAddNestedNode}
            />
          </ToolbarDropdown>

          <ToolbarButton icon={<Download size={16} />} onClick={onExport} title={t('workflow.toolbar.export')} />
          <ToolbarButton icon={<Upload size={16} />} onClick={onImport} title={t('workflow.toolbar.import')} />
        </>
      )}

      <ToolbarDropdown
        icon={<LayoutDashboard size={16} />}
        title={t('workflow.toolbar.layout')}
      >
        <DropdownItem
          icon={<ArrowRight size={14} />}
          label={t('workflow.layout.horizontal')}
          onClick={handleHorizontalLayout}
        />
        <DropdownItem
          icon={<ArrowDown size={14} />}
          label={t('workflow.layout.vertical')}
          onClick={handleVerticalLayout}
        />
      </ToolbarDropdown>

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
        className="min-w-[50px] h-7 px-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
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
          <input
            type="text"
            placeholder={t('workflow.search.placeholder')}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="h-7 px-3 text-sm border border-gray-200 rounded-md w-32 focus:outline-none focus:border-blue-500"
          />
        </>
      )}

      {onToggleMinimap && (
        <>
          <ToolbarButton
            icon={<Map size={16} />}
            onClick={onToggleMinimap}
            active={showMinimap}
            title={t('workflow.minimap.toggle')}
          />
        </>
      )}
    </div>
  );
};

export default Toolbar;
