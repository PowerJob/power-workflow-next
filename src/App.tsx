import { useCallback, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { addEdge, Connection, useNodesState, useEdgesState } from '@xyflow/react';
import WorkflowCanvas from './components/WorkflowCanvas';
import { EditorPanel } from './components/panels/EditorPanel';
import {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  WorkflowReferenceOption,
  NodeType,
  NodeStatus,
} from './types/workflow';

const initialNodes: WorkflowNode[] = [
  {
    id: '1',
    type: NodeType.JOB,
    position: { x: 100, y: 100 },
    data: { label: 'Start Job', type: NodeType.JOB, status: NodeStatus.SUCCESS, jobId: 101 },
  },
  {
    id: '2',
    type: NodeType.DECISION,
    position: { x: 400, y: 100 },
    data: { label: 'Check', type: NodeType.DECISION, status: NodeStatus.RUNNING, condition: '${result} == true' },
  },
  {
    id: '3',
    type: NodeType.NESTED_WORKFLOW,
    position: { x: 400, y: 300 },
    data: { label: 'Sub Workflow', type: NodeType.NESTED_WORKFLOW, status: NodeStatus.WAITING, targetWorkflowId: 202 },
  },
];

const initialEdges: WorkflowEdge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'default' },
  { id: 'e2-3', source: '2', target: '3', type: 'default', data: { property: 'true' } },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const editingNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null;
  const jobOptions = useMemo<WorkflowReferenceOption[]>(
    () => [
      { value: 101, label: '101 - Start Job' },
      { value: 102, label: '102 - Data Prepare' },
      { value: 103, label: '103 - Data Export' },
    ],
    [],
  );
  const workflowOptions = useMemo<WorkflowReferenceOption[]>(
    () => [
      { value: 201, label: '201 - ETL Workflow' },
      { value: 202, label: '202 - Sub Workflow' },
      { value: 203, label: '203 - QA Workflow' },
    ],
    [],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleNodeDoubleClick = useCallback((_: ReactMouseEvent, node: WorkflowNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleSaveNode = useCallback(
    (nodeId: string, data: WorkflowNodeData) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data } : n)));
      setSelectedNodeId(null);
    },
    [setNodes],
  );

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        mode="edit"
      />
      <EditorPanel
        node={editingNode}
        open={!!editingNode}
        onClose={handleClosePanel}
        onSave={handleSaveNode}
        jobOptions={jobOptions}
        workflowOptions={workflowOptions}
      />
    </div>
  );
}

export default App;
