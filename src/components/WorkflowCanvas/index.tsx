import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from '@xyflow/react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { Toolbar } from '../toolbar';
import { WorkflowMinimap } from '../common/WorkflowMinimap';
import { WorkflowNextProps } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { LocaleProvider } from '../../contexts/LocaleContext';

interface CanvasToolbarProps {
  mode: 'edit' | 'view';
  onAutoLayout?: (direction: 'horizontal' | 'vertical') => void;
  onAddNode?: (type: import('../../types/workflow').NodeType, position?: { x: number; y: number }) => void;
  onExport?: () => void;
  onImport?: () => void;
  showMinimap?: boolean;
  onToggleMinimap?: () => void;
}

const CanvasToolbar = ({
  mode,
  onAutoLayout,
  onAddNode,
  onExport,
  onImport,
  showMinimap = true,
  onToggleMinimap,
}: CanvasToolbarProps) => {
  const { fitView, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow();
  const { zoom } = useViewport();

  const handleFitView = useCallback(() => {
    fitView?.({ duration: 200 });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn?.({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut?.({ duration: 200 });
  }, [zoomOut]);

  const handleZoomReset = useCallback(() => {
    const vp = getViewport?.();
    if (vp) setViewport?.({ ...vp, zoom: 1 }, { duration: 200 });
  }, [getViewport, setViewport]);

  return (
    <Toolbar
      mode={mode}
      zoom={zoom}
      onFitView={handleFitView}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onZoomReset={handleZoomReset}
      onAutoLayout={onAutoLayout}
      onAddNode={onAddNode}
      onExport={onExport}
      onImport={onImport}
      showMinimap={showMinimap}
      onToggleMinimap={onToggleMinimap}
    />
  );
};

const WorkflowCanvasInner = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  mode = 'edit',
  defaultLocale = 'zh-CN',
  showToolbar = false,
  onAutoLayout,
  onAddNode,
  onExport,
  onImport,
  showMinimap = true,
  onToggleMinimap,
  ...props
}: WorkflowNextProps) => {
  const { t } = useLocale();
  const isView = mode === 'view';

  return (
    <TooltipPrimitive.Provider delayDuration={500}>
      <div className="w-full h-full flex flex-col relative">
        {showToolbar && (
          <div className="flex-shrink-0 z-10 bg-white border-b border-gray-200">
            <CanvasToolbar
              mode={mode}
              onAutoLayout={onAutoLayout}
              onAddNode={onAddNode}
              onExport={onExport}
              onImport={onImport}
              showMinimap={showMinimap}
              onToggleMinimap={onToggleMinimap}
            />
          </div>
        )}
        <div className="flex-1 min-h-0 relative bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.25}
            maxZoom={2}
            nodesDraggable={!isView}
            nodesConnectable={!isView}
            elementsSelectable={true}
            proOptions={{ hideAttribution: true }}
            {...props}
          >
            <Background color="#E5E7EB" gap={20} />
            <Controls showInteractive={!isView} />
            {showMinimap && <WorkflowMinimap visible />}

            {(!nodes || nodes.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-gray-400 text-lg font-medium">{t('workflow.canvas.empty')}</div>
              </div>
            )}
          </ReactFlow>
        </div>
      </div>
    </TooltipPrimitive.Provider>
  );
};

export const WorkflowCanvas = (props: WorkflowNextProps) => {
  return (
    <LocaleProvider defaultLocale={props.defaultLocale}>
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </LocaleProvider>
  );
};

export default WorkflowCanvas;
