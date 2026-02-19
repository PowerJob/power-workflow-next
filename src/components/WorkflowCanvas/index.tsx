import { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  MarkerType,
} from '@xyflow/react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import '@xyflow/react/dist/style.css';

import { JobNode, DecisionNode, NestedWorkflowNode } from '../nodes';
import { edgeTypes } from '../edges';
import { Toolbar } from '../toolbar';
import { WorkflowMinimap } from '../common/WorkflowMinimap';
import { WorkflowNextProps, NodeType } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { LocaleProvider } from '../../contexts/LocaleContext';
import type { Connection } from '@xyflow/react';
import { getSnapHandlesForEdge } from '../../utils/edgeHandles';

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
  connectSnapDirection = 'horizontal',
  fitView: fitViewProp,
  isValidConnection: userIsValidConnection,
  ...props
}: WorkflowNextProps) => {
  const { t } = useLocale();
  const { screenToFlowPosition } = useReactFlow();
  const isView = mode === 'view';

  const nodeTypesWithMode = useMemo(
    () => ({
      [NodeType.JOB]: (props: import('@xyflow/react').NodeProps<import('../../types/workflow').WorkflowNode>) => (
        <JobNode {...props} mode={mode} />
      ),
      [NodeType.DECISION]: (props: import('@xyflow/react').NodeProps<import('../../types/workflow').WorkflowNode>) => (
        <DecisionNode {...props} mode={mode} />
      ),
      [NodeType.NESTED_WORKFLOW]: (props: import('@xyflow/react').NodeProps<import('../../types/workflow').WorkflowNode>) => (
        <NestedWorkflowNode {...props} mode={mode} />
      ),
    }),
    [mode],
  );

  const pendingConnectionRef = useRef<{ source: string; sourceHandle?: string } | null>(null);
  const nativeConnectCommittedRef = useRef(false);

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes?.find((n) => n.id === connection.source);
      if (sourceNode?.data?.type === NodeType.DECISION) {
        const outgoingCount = edges?.filter((e) => e.source === connection.source).length ?? 0;
        if (outgoingCount >= 2) return false;
      }
      return userIsValidConnection ? userIsValidConnection(connection) : true;
    },
    [nodes, edges, userIsValidConnection],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      nativeConnectCommittedRef.current = true;
      onConnect?.(connection);
    },
    [onConnect],
  );

  const handleConnectStart = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      params: { nodeId: string | null; handleId: string | null; handleType?: string | null },
    ) => {
      nativeConnectCommittedRef.current = false;
      if (params.handleType !== 'source' || !params.nodeId) {
        pendingConnectionRef.current = null;
        return;
      }
      pendingConnectionRef.current = {
        source: params.nodeId,
        sourceHandle: params.handleId ?? undefined,
      };
    },
    [],
  );

  const handleConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const pending = pendingConnectionRef.current;
      pendingConnectionRef.current = null;

      if (!pending || nativeConnectCommittedRef.current || !nodes?.length || !onConnect) {
        return;
      }

      const point =
        'changedTouches' in event && event.changedTouches.length > 0
          ? {
              x: event.changedTouches[0].clientX,
              y: event.changedTouches[0].clientY,
            }
          : 'clientX' in event
            ? { x: event.clientX, y: event.clientY }
            : null;

      if (!point) return;

      const flowPoint = screenToFlowPosition(point);
      const sourceNode = nodes.find((node) => node.id === pending.source);
      if (!sourceNode) return;

      const targetNode = nodes.find((node) => {
        if (node.id === pending.source) return false;
        const width = node.width ?? (node.data?.type === NodeType.DECISION ? 80 : 200);
        const height = node.height ?? 56;
        return (
          flowPoint.x >= node.position.x &&
          flowPoint.x <= node.position.x + width &&
          flowPoint.y >= node.position.y &&
          flowPoint.y <= node.position.y + height
        );
      });

      if (!targetNode) return;

      const { sourceHandleId, targetHandleId } = getSnapHandlesForEdge(sourceNode, targetNode, {
        direction: connectSnapDirection,
      });

      const connection: Connection = {
        source: pending.source,
        sourceHandle: pending.sourceHandle ?? sourceHandleId,
        target: targetNode.id,
        targetHandle: targetHandleId,
      };

      if (!isValidConnection(connection)) return;

      const duplicated =
        edges?.some(
          (edge) =>
            edge.source === connection.source &&
            edge.target === connection.target &&
            (edge.sourceHandle ?? undefined) === (connection.sourceHandle ?? undefined) &&
            (edge.targetHandle ?? undefined) === (connection.targetHandle ?? undefined),
        ) ?? false;

      if (duplicated) return;

      onConnect(connection);
    },
    [nodes, edges, onConnect, screenToFlowPosition, connectSnapDirection, isValidConnection],
  );

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
            onConnect={handleConnect}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            nodeTypes={nodeTypesWithMode}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 11,
                height: 11,
              },
            }}
            isValidConnection={isValidConnection}
            fitView={fitViewProp ?? false}
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
