import type { Node, Edge, ReactFlowProps } from '@xyflow/react';

export enum NodeType {
  JOB = 'JOB',
  DECISION = 'DECISION',
  NESTED_WORKFLOW = 'NESTED_WORKFLOW',
}

export enum NodeStatus {
  WAITING = 1,
  RUNNING = 3,
  FAILED = 4,
  SUCCESS = 5,
  STOPPED = 10,
}

export interface ExecutionInfo {
  duration?: number;
  startTime?: string;
  endTime?: string;
  error?: string;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  status?: NodeStatus;
  instanceId?: string;
  execution?: ExecutionInfo;

  jobId?: string | number;
  enable?: boolean;
  skip?: boolean;
  timeout?: number;
  params?: string;
  condition?: string;
  targetWorkflowId?: string | number;
}

export type WorkflowNode = Node<WorkflowNodeData>;

export interface WorkflowEdgeData extends Record<string, unknown> {
  property?: 'true' | 'false' | '';
  enable?: boolean;
}

export type WorkflowEdge = Edge<WorkflowEdgeData>;

export interface WorkflowNextProps extends Omit<
  ReactFlowProps<WorkflowNode, WorkflowEdge>,
  'nodes' | 'edges' | 'onNodesChange' | 'onEdgesChange' | 'onConnect'
> {
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  mode?: 'edit' | 'view';
  defaultLocale?: 'zh-CN' | 'en-US';

  onNodesChange?: (changes: unknown) => void;
  onEdgesChange?: (changes: unknown) => void;
  onConnect?: (connection: unknown) => void;
  onNodeDataChange?: (nodeId: string, data: WorkflowNodeData) => void;
  onValidationError?: (errors: unknown[]) => void;

  /** 是否在画布上方显示工具栏 */
  showToolbar?: boolean;
  onAutoLayout?: (direction: 'horizontal' | 'vertical') => void;
  onAddNode?: (type: NodeType, position?: { x: number; y: number }) => void;
  onExport?: () => void;
  onImport?: () => void;
  showMinimap?: boolean;
  onToggleMinimap?: () => void;
}

export type WorkflowMode = 'edit' | 'view';
