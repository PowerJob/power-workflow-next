import { useCallback } from 'react';
import { addEdge, Connection, useNodesState, useEdgesState } from '@xyflow/react';
import WorkflowCanvas from './components/WorkflowCanvas';
import { WorkflowNode, WorkflowEdge, NodeType, NodeStatus } from './types/workflow';

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
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        mode="edit"
      />
    </div>
  );
}

export default App;
