import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  MarkerType,
  ConnectionMode,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import '@xyflow/react/dist/style.css';

import { JobNode, DecisionNode, NestedWorkflowNode } from '../nodes';
import { CustomEdge } from '../edges';
import { Toolbar } from '../toolbar';
import { WorkflowMinimap } from '../common/WorkflowMinimap';
import { WorkflowNextProps, NodeType, NodeStatus, type WorkflowNode, type WorkflowEdge, type WorkflowEdgeData } from '../../types/workflow';
import { EDGE_STROKE } from '../../constants/edgeColors';
import { useLocale } from '../../hooks/useLocale';
import { LocaleProvider } from '../../contexts/LocaleContext';
import type { Connection } from '@xyflow/react';
import { getSnapHandlesForEdge } from '../../utils/edgeHandles';
import { createShortcuts, useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface WorkflowSnapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowHistoryState {
  past: WorkflowSnapshot[];
  present: WorkflowSnapshot;
  future: WorkflowSnapshot[];
  initialized: boolean;
}

const cloneSnapshot = (snapshot: WorkflowSnapshot): WorkflowSnapshot =>
  JSON.parse(JSON.stringify(snapshot));

const isSnapshotEqual = (a: WorkflowSnapshot, b: WorkflowSnapshot): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/** 判断节点状态是否为终态（已执行完成） */
const isTerminalStatus = (status?: NodeStatus): boolean => {
  return status === NodeStatus.SUCCESS ||
         status === NodeStatus.FAILED ||
         status === NodeStatus.STOPPED ||
         status === NodeStatus.CANCELED;
};

interface CanvasToolbarProps {
  mode: 'edit' | 'view';
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onAutoLayout?: (direction: 'horizontal' | 'vertical') => void;
  onAddNode?: (type: import('../../types/workflow').NodeType, position?: { x: number; y: number }) => void;
  onExport?: () => void;
  onImport?: () => void;
  showMinimap?: boolean;
  onToggleMinimap?: () => void;
}

const CanvasToolbar = ({
  mode,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
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
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={onUndo}
      onRedo={onRedo}
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
  showToolbar = false,
  onAutoLayout,
  onAddNode,
  onExport,
  onImport,
  showMinimap = true,
  onToggleMinimap,
  undoableActions = 50,
  jobOptions: _jobOptions,
  workflowOptions: _workflowOptions,
  connectSnapDirection = 'horizontal',
  fitView: fitViewProp,
  isValidConnection: userIsValidConnection,
  defaultLocale: _defaultLocale,
  onNodeDataChange: _onNodeDataChange,
  onValidationError: _onValidationError,
  ...props
}: WorkflowNextProps) => {
  const { t } = useLocale();
  const { screenToFlowPosition } = useReactFlow();
  const isView = mode === 'view';
  const safeNodes = nodes ?? [];
  const safeEdges = edges ?? [];
  const safeEdgesRef = useRef(safeEdges);
  useEffect(() => {
    safeEdgesRef.current = safeEdges;
  }, [safeEdges]);
  const edgesWithMarkerColor = useMemo(() => {
    const getEdgeStrokeColor = (edge: WorkflowEdge) => {
      const edgeData = edge.data as WorkflowEdgeData | undefined;
      if (edgeData?.enable === false) return EDGE_STROKE.disabled;

      const sourceNode = safeNodes.find((node) => node.id === edge.source);
      const isFromDecisionNode = sourceNode?.data?.type === NodeType.DECISION;
      const property = (edgeData?.property ?? '') as '' | 'true' | 'false';
      const isTrue = property === 'true';
      const isFalse = property === 'false';
      const isSelected = !!edge.selected;

      // 视图模式：根据 source 节点终态判断是否已执行
      if (mode === 'view') {
        const isExecuted = isTerminalStatus(sourceNode?.data?.status);
        return isExecuted ? EDGE_STROKE.executed : EDGE_STROKE.disabled;
      }

      // 编辑模式逻辑
      if (!isFromDecisionNode) return isSelected ? EDGE_STROKE.selected : EDGE_STROKE.default;
      if (isSelected) return EDGE_STROKE.selected;
      if (isTrue) return EDGE_STROKE.propertyTrue;
      if (isFalse) return EDGE_STROKE.propertyFalse;
      return EDGE_STROKE.default;
    };

    return safeEdges.map((edge) => {
      const strokeColor = getEdgeStrokeColor(edge);
      const markerConfig =
        typeof edge.markerEnd === 'object' && edge.markerEnd !== null
          ? edge.markerEnd
          : {
              type: MarkerType.ArrowClosed,
              width: 11,
              height: 11,
            };

      return {
        ...edge,
        markerEnd: {
          ...markerConfig,
          color: strokeColor,
        },
      };
    });
  }, [safeEdges, safeNodes, mode]);
  const historyLimit = Math.max(1, undoableActions ?? 50);
  const applyingHistoryRef = useRef(false);
  const [history, setHistory] = useState<WorkflowHistoryState>({
    past: [],
    present: { nodes: [], edges: [] },
    future: [],
    initialized: false,
  });

  useEffect(() => {
    const currentSnapshot: WorkflowSnapshot = {
      nodes: cloneSnapshot({ nodes: safeNodes, edges: [] }).nodes,
      edges: cloneSnapshot({ nodes: [], edges: safeEdges }).edges,
    };

    setHistory((prev) => {
      if (!prev.initialized) {
        return {
          ...prev,
          initialized: true,
          present: currentSnapshot,
        };
      }

      if (applyingHistoryRef.current) {
        applyingHistoryRef.current = false;
        return {
          ...prev,
          present: currentSnapshot,
        };
      }

      if (isSnapshotEqual(prev.present, currentSnapshot)) {
        return prev;
      }

      return {
        initialized: true,
        past: [...prev.past, cloneSnapshot(prev.present)].slice(-historyLimit),
        present: currentSnapshot,
        future: [],
      };
    });
  }, [safeNodes, safeEdges, historyLimit]);

  const canUseHistory = mode === 'edit' && !!onNodesChange && !!onEdgesChange;
  const canUndo = canUseHistory && history.past.length > 0;
  const canRedo = canUseHistory && history.future.length > 0;

  const applySnapshot = useCallback(
    (snapshot: WorkflowSnapshot) => {
      if (!onNodesChange || !onEdgesChange) return;

      const nodeChanges: NodeChange<WorkflowNode>[] = [
        ...safeNodes.map((node) => ({ id: node.id, type: 'remove' }) as NodeChange<WorkflowNode>),
        ...snapshot.nodes.map(
          (node, index) =>
            ({
              type: 'add',
              item: JSON.parse(JSON.stringify(node)),
              index,
            }) as NodeChange<WorkflowNode>,
        ),
      ];

      const edgeChanges: EdgeChange<WorkflowEdge>[] = [
        ...safeEdges.map((edge) => ({ id: edge.id, type: 'remove' }) as EdgeChange<WorkflowEdge>),
        ...snapshot.edges.map(
          (edge, index) =>
            ({
              type: 'add',
              item: JSON.parse(JSON.stringify(edge)),
              index,
            }) as EdgeChange<WorkflowEdge>,
        ),
      ];

      onNodesChange(nodeChanges);
      onEdgesChange(edgeChanges);
    },
    [onNodesChange, onEdgesChange, safeNodes, safeEdges],
  );

  const handleUndo = useCallback(() => {
    if (!canUseHistory) return;

    let previousSnapshot: WorkflowSnapshot | null = null;
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      previousSnapshot = cloneSnapshot(prev.past[prev.past.length - 1]);
      return {
        ...prev,
        past: prev.past.slice(0, -1),
        present: previousSnapshot,
        future: [cloneSnapshot(prev.present), ...prev.future],
      };
    });

    if (!previousSnapshot) return;
    applyingHistoryRef.current = true;
    applySnapshot(previousSnapshot);
  }, [canUseHistory, applySnapshot]);

  const handleRedo = useCallback(() => {
    if (!canUseHistory) return;

    let nextSnapshot: WorkflowSnapshot | null = null;
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      nextSnapshot = cloneSnapshot(prev.future[0]);
      return {
        ...prev,
        past: [...prev.past, cloneSnapshot(prev.present)].slice(-historyLimit),
        present: nextSnapshot,
        future: prev.future.slice(1),
      };
    });

    if (!nextSnapshot) return;
    applyingHistoryRef.current = true;
    applySnapshot(nextSnapshot);
  }, [canUseHistory, historyLimit, applySnapshot]);

  const handleDeleteSelection = useCallback(() => {
    if (!canUseHistory || !onNodesChange || !onEdgesChange) return;

    const selectedNodeIds = new Set(safeNodes.filter((node) => node.selected).map((node) => node.id));
    const selectedEdgeIds = new Set(
      safeEdges
        .filter((edge) => edge.selected || selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target))
        .map((edge) => edge.id),
    );

    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;

    const nodeRemoveChanges = [...selectedNodeIds].map(
      (id) => ({ id, type: 'remove' }) as NodeChange<WorkflowNode>,
    );
    const edgeRemoveChanges = [...selectedEdgeIds].map(
      (id) => ({ id, type: 'remove' }) as EdgeChange<WorkflowEdge>,
    );

    onNodesChange(nodeRemoveChanges);
    onEdgesChange(edgeRemoveChanges);
  }, [canUseHistory, onNodesChange, onEdgesChange, safeNodes, safeEdges]);

  const handleToggleEdgeProperty = useCallback(
    (edgeId: string) => {
      if (!onEdgesChange) return;

      const currentEdges = safeEdgesRef.current;
      const index = currentEdges.findIndex((edge) => edge.id === edgeId);
      if (index < 0) return;

      const edge = currentEdges[index];
      const currentProperty = ((edge.data as WorkflowEdgeData | undefined)?.property ?? '') as '' | 'true' | 'false';
      const nextProperty = currentProperty === '' ? 'true' : currentProperty === 'true' ? 'false' : '';
      const updatedEdge: WorkflowEdge = {
        ...edge,
        data: {
          ...(edge.data as WorkflowEdgeData | undefined),
          property: nextProperty,
        },
      };

      const changes: EdgeChange<WorkflowEdge>[] = [
        { id: edgeId, type: 'remove' } as EdgeChange<WorkflowEdge>,
        {
          type: 'add',
          item: updatedEdge,
          index,
        } as EdgeChange<WorkflowEdge>,
      ];

      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  const shortcuts = useMemo(
    () =>
      createShortcuts(
        {
          onUndo: handleUndo,
          onRedo: handleRedo,
          onDelete: handleDeleteSelection,
        },
        !canUseHistory,
      ),
    [handleUndo, handleRedo, handleDeleteSelection, canUseHistory],
  );

  useKeyboardShortcuts({
    enabled: mode === 'edit',
    shortcuts,
  });

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

  const edgeTypesWithActions = useMemo(
    () => ({
      default: (
        edgeProps: import('@xyflow/react').EdgeProps<import('../../types/workflow').WorkflowEdge>,
      ) => (
        <CustomEdge
          {...edgeProps}
          mode={mode}
          onToggleProperty={mode === 'edit' ? handleToggleEdgeProperty : undefined}
        />
      ),
      custom: (
        edgeProps: import('@xyflow/react').EdgeProps<import('../../types/workflow').WorkflowEdge>,
      ) => (
        <CustomEdge
          {...edgeProps}
          mode={mode}
          onToggleProperty={mode === 'edit' ? handleToggleEdgeProperty : undefined}
        />
      ),
      workflow: (
        edgeProps: import('@xyflow/react').EdgeProps<import('../../types/workflow').WorkflowEdge>,
      ) => (
        <CustomEdge
          {...edgeProps}
          mode={mode}
          onToggleProperty={mode === 'edit' ? handleToggleEdgeProperty : undefined}
        />
      ),
    }),
    [mode, handleToggleEdgeProperty],
  );

  const pendingConnectionRef = useRef<{ source: string; sourceHandle?: string } | null>(null);
  const nativeConnectCommittedRef = useRef(false);

  const isValidConnection = useCallback(
    (candidate: Connection | WorkflowEdge) => {
      const connection: Connection = {
        source: candidate.source,
        sourceHandle: candidate.sourceHandle ?? null,
        target: candidate.target,
        targetHandle: candidate.targetHandle ?? null,
      };
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return false;
      }

      const existsBetweenNodes = safeEdges.some(
        (edge) =>
          (edge.source === connection.source && edge.target === connection.target) ||
          (edge.source === connection.target && edge.target === connection.source),
      );
      if (existsBetweenNodes) {
        return false;
      }

      const sourceNode = safeNodes.find((n) => n.id === connection.source);
      if (sourceNode?.data?.type === NodeType.DECISION) {
        const outgoingCount = safeEdges.filter((e) => e.source === connection.source).length;
        if (outgoingCount >= 2) {
          return false;
        }
      }
      return userIsValidConnection ? userIsValidConnection(connection as any) : true;
    },
    [safeNodes, safeEdges, userIsValidConnection],
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

      if (!pending || nativeConnectCommittedRef.current || safeNodes.length === 0 || !onConnect) {
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
      const sourceNode = safeNodes.find((node) => node.id === pending.source);
      if (!sourceNode) return;

      const targetNode = safeNodes.find((node) => {
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
        safeEdges.some(
          (edge) =>
            edge.source === connection.source &&
            edge.target === connection.target &&
            (edge.sourceHandle ?? undefined) === (connection.sourceHandle ?? undefined) &&
            (edge.targetHandle ?? undefined) === (connection.targetHandle ?? undefined),
        );

      if (duplicated) return;

      onConnect(connection);
    },
    [safeNodes, safeEdges, onConnect, screenToFlowPosition, connectSnapDirection, isValidConnection],
  );

  return (
    <TooltipPrimitive.Provider delayDuration={500}>
      <div className="w-full h-full flex flex-col relative">
        {showToolbar && (
          <div className="flex-shrink-0 z-10 bg-white border-b border-gray-200">
            <CanvasToolbar
              mode={mode}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
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
            edges={edgesWithMarkerColor}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            nodeTypes={nodeTypesWithMode}
            edgeTypes={edgeTypesWithActions}
            defaultEdgeOptions={{
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 11,
                height: 11,
              },
            }}
            connectionMode={ConnectionMode.Loose}
            isValidConnection={isValidConnection}
            fitView={fitViewProp ?? false}
            minZoom={0.25}
            maxZoom={2}
            nodesDraggable={!isView}
            nodesConnectable={!isView}
            edgesReconnectable={!isView}
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
