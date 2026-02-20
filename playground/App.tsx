import React, { useState, useEffect, useCallback, useRef, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { addEdge, Connection, useNodesState, useEdgesState } from '@xyflow/react';
import {
  WorkflowCanvas,
  EditorPanel,
  layoutNodes,
  LocaleProvider,
  useLocale,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  WorkflowReferenceOption,
  NodeType,
  assignOptimalHandles,
  getSnapHandlesForEdge,
  generateNodeId,
  createDefaultNodeData,
  exportToJSON,
  importFromJSON,
} from '../src/index';
import { scenarios, ScenarioName, singleNodes } from './mock-data/scenarios';
import '../src/index.css';

type ViewMode = 'edit' | 'view';
type SingleNodeKey = 'single-job' | 'single-decision' | 'single-nested';

interface ScenarioData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const scenarioOptions: { value: ScenarioName | SingleNodeKey; label: string }[] = [
  { value: 'basicWorkflow', label: '基础工作流' },
  { value: 'decisionWorkflow', label: '带判断节点的分支流程' },
  { value: 'nestedWorkflow', label: '嵌套工作流' },
  { value: 'viewModeWithStatus', label: '视图模式-运行状态' },
  { value: 'complexWorkflow', label: '复杂工作流' },
  { value: 'emptyCanvas', label: '空画布' },
  { value: 'single-job', label: '单节点-JOB' },
  { value: 'single-decision', label: '单节点-DECISION' },
  { value: 'single-nested', label: '单节点-NESTED_WORKFLOW' },
  { value: 'disabledNodes', label: '禁用/跳过状态' },
];

const singleNodeMap: Record<SingleNodeKey, string> = {
  'single-job': 'jobNode',
  'single-decision': 'decisionNode',
  'single-nested': 'nestedNode',
};

const buildReferenceOptions = (
  field: 'jobId' | 'targetWorkflowId',
  type: NodeType.JOB | NodeType.NESTED_WORKFLOW,
): WorkflowReferenceOption[] => {
  const optionMap = new Map<string, WorkflowReferenceOption>();
  const allScenarios = [...Object.values(scenarios), ...Object.values(singleNodes)];

  for (const scenario of allScenarios) {
    for (const node of scenario.nodes) {
      if (node.data.type !== type) continue;
      const rawValue = node.data[field];
      if (rawValue === undefined || rawValue === null || rawValue === '') continue;
      const key = String(rawValue);
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          value: rawValue as string | number,
          label: `${rawValue} - ${node.data.label}`,
        });
      }
    }
  }

  return Array.from(optionMap.values());
};

const getScenarioData = (name: ScenarioName | SingleNodeKey): ScenarioData => {
  if (name.startsWith('single-')) {
    return singleNodes[singleNodeMap[name as SingleNodeKey]] as ScenarioData;
  }
  return scenarios[name as ScenarioName] as ScenarioData;
};

const PlaygroundInner = () => {
  const [scenario, setScenario] = useState<
    ScenarioName | 'single-job' | 'single-decision' | 'single-nested'
  >('basicWorkflow');
  const [mode, setMode] = useState<ViewMode>('edit');
  const [locale, setLocale] = useState<'zh-CN' | 'en-US'>('zh-CN');
  const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const rawInitial = getScenarioData(scenario);
  const initialNodes = layoutNodes(rawInitial.nodes, rawInitial.edges, {
    direction: 'horizontal',
  });
  const initialEdges = assignOptimalHandles(initialNodes, rawInitial.edges, {
    direction: 'horizontal',
  });
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const jobOptions = useMemo(
    () => buildReferenceOptions('jobId', NodeType.JOB),
    [],
  );
  const workflowOptions = useMemo(
    () => buildReferenceOptions('targetWorkflowId', NodeType.NESTED_WORKFLOW),
    [],
  );

  const { setLocale: setContextLocale } = useLocale();

  useEffect(() => {
    setContextLocale(locale);
  }, [locale, setContextLocale]);

  const editingNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null;

  const handleNodeClick = useCallback(
    (_: ReactMouseEvent, node: WorkflowNode) => {
      if (mode === 'edit') setSelectedNodeId(node.id);
    },
    [mode],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleSaveNode = useCallback((nodeId: string, data: WorkflowNodeData) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data } : n)),
    );
    setSelectedNodeId(null);
  }, [setNodes]);

  const handleToolbarAutoLayout = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      setLayoutDirection(direction);
      const newNodes = layoutNodes(nodes, edges, { direction });
      setNodes(newNodes);
      setEdges(assignOptimalHandles(newNodes, edges, { direction }));
    },
    [nodes, edges, setNodes, setEdges],
  );

  const handleAddNode = useCallback(
    (type: NodeType, position?: { x: number; y: number }) => {
      const id = generateNodeId();
      const label =
        type === NodeType.JOB
          ? '任务节点'
          : type === NodeType.DECISION
            ? '判断节点'
            : '嵌套工作流';
      const data = createDefaultNodeData(type, label) as WorkflowNodeData;
      const pos = position ?? { x: 100, y: 100 };
      setNodes((nds) => [...nds, { id, type, position: pos, data }]);
    },
    [setNodes],
  );

  const handleExport = useCallback(() => {
    const json = exportToJSON(nodes, edges);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImportClick = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const result = importFromJSON(text);
        if (result.success && result.data) {
          setNodes(result.data.nodes);
          setEdges(assignOptimalHandles(result.data.nodes, result.data.edges));
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [setNodes, setEdges],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      const { sourceHandleId, targetHandleId } =
        sourceNode && targetNode
          ? getSnapHandlesForEdge(sourceNode, targetNode, {
              direction: layoutDirection,
            })
          : {};
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            sourceHandle: sourceHandleId ?? params.sourceHandle,
            targetHandle: targetHandleId ?? params.targetHandle,
          },
          eds,
        ),
      );
    },
    [nodes, layoutDirection, setEdges],
  );

  const handleScenarioChange = (newScenario: typeof scenario) => {
    setScenario(newScenario);
    setSelectedNodeId(null);
    const data = getScenarioData(newScenario);
    const layoutedNodes = layoutNodes(data.nodes, data.edges, {
      direction: 'horizontal',
    });
    setNodes(layoutedNodes);
    setEdges(assignOptimalHandles(layoutedNodes, data.edges, { direction: 'horizontal' }));
  };

  const handleLayout = () => {
    const newNodes = layoutNodes(nodes, edges, { direction: layoutDirection });
    setNodes(newNodes);
    setEdges(assignOptimalHandles(newNodes, edges, { direction: layoutDirection }));
  };

  const handleReset = () => {
    setSelectedNodeId(null);
    const data = getScenarioData(scenario);
    const layoutedNodes = layoutNodes(data.nodes, data.edges, {
      direction: 'horizontal',
    });
    setNodes(layoutedNodes);
    setEdges(assignOptimalHandles(layoutedNodes, data.edges, { direction: 'horizontal' }));
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-100">
      {/* 控制面板 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">
          {/* 场景选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">场景:</label>
            <select
              value={scenario}
              onChange={(e) => handleScenarioChange(e.target.value as typeof scenario)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {scenarioOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 模式选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">模式:</label>
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button
                onClick={() => setMode('edit')}
                className={`px-3 py-1.5 text-sm ${
                  mode === 'edit'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                编辑
              </button>
              <button
                onClick={() => setMode('view')}
                className={`px-3 py-1.5 text-sm ${
                  mode === 'view'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                视图
              </button>
            </div>
          </div>

          {/* 语言选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">语言:</label>
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button
                onClick={() => setLocale('zh-CN')}
                className={`px-3 py-1.5 text-sm ${
                  locale === 'zh-CN'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLocale('en-US')}
                className={`px-3 py-1.5 text-sm ${
                  locale === 'en-US'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* 布局方向 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">布局方向:</label>
            <div className="flex rounded-md overflow-hidden border border-gray-300">
              <button
                onClick={() => setLayoutDirection('horizontal')}
                className={`px-3 py-1.5 text-sm ${
                  layoutDirection === 'horizontal'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                横向
              </button>
              <button
                onClick={() => setLayoutDirection('vertical')}
                className={`px-3 py-1.5 text-sm ${
                  layoutDirection === 'vertical'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                纵向
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleLayout}
              className="px-4 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
            >
              自动布局
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-1.5 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 画布区域 */}
      <div className="flex-1 relative">
        <input
          ref={importFileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportFile}
        />
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          mode={mode}
          defaultLocale={locale}
          connectSnapDirection={layoutDirection}
          showToolbar
          onAutoLayout={handleToolbarAutoLayout}
          onAddNode={handleAddNode}
          onExport={handleExport}
          onImport={handleImportClick}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap((v) => !v)}
        />
        {mode === 'edit' && (
          <EditorPanel
            node={editingNode}
            open={!!editingNode}
            onClose={handleClosePanel}
            onSave={handleSaveNode}
            jobOptions={jobOptions}
            workflowOptions={workflowOptions}
          />
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <span>节点数: {nodes.length}</span>
          <span>连线数: {edges.length}</span>
          <span>模式: {mode === 'edit' ? '编辑' : '视图'}</span>
          <span>
            节点类型: {Array.from(new Set(nodes.map((n) => n.data?.type))).join(', ') || '无'}
          </span>
        </div>
      </div>
    </div>
  );
};

const Playground = () => {
  return (
    <LocaleProvider defaultLocale="zh-CN">
      <PlaygroundInner />
    </LocaleProvider>
  );
};

export default Playground;
