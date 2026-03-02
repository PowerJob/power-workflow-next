import { WorkflowNode, WorkflowEdge } from '@/types';

export const detectCycle = (nodes: WorkflowNode[], edges: WorkflowEdge[]): string | null => {
  if (nodes.length === 0 || edges.length === 0) return null;

  const graph = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!graph.has(edge.source)) {
      graph.set(edge.source, []);
    }
    graph.get(edge.source)!.push(edge.target);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return 'workflow.cycle.error';
      }
    }
  }

  return null;
};

export const checkDecisionNodeExits = (nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] => {
  const decisionNodes = nodes.filter((n) => n.data.type === 'DECISION');
  const errors: string[] = [];

  for (const node of decisionNodes) {
    const outgoingEdges = edges.filter((e) => e.source === node.id);
    if (outgoingEdges.length < 2) {
      errors.push(`Decision node "${node.data.label}" needs at least 2 exits`);
    }
    if (outgoingEdges.length > 2) {
      errors.push(`Decision node "${node.data.label}" must have at most 2 exits`);
    }
  }

  return errors;
};

interface WorkflowExportData {
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  exportedAt: string;
}

const CURRENT_VERSION = '1.0';

export const exportToJSON = (nodes: WorkflowNode[], edges: WorkflowEdge[]): string => {
  const data: WorkflowExportData = {
    version: CURRENT_VERSION,
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const importFromJSON = (
  jsonString: string,
): { success: boolean; data?: WorkflowExportData; error?: string } => {
  try {
    const data = JSON.parse(jsonString) as WorkflowExportData;

    if (!data.version) {
      return { success: false, error: 'workflow.import.error.format' };
    }

    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return { success: false, error: 'workflow.import.error.format' };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'workflow.import.error.format' };
  }
};

export const generateNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const generateEdgeId = (source: string, target: string): string => {
  return `edge_${source}_${target}_${Date.now()}`;
};

export const createDefaultNodeData = (type: string, label: string) => {
  return {
    label,
    type,
    enable: true,
    skip: false,
  };
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
