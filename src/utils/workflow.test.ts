import { describe, it, expect } from 'vitest';
import {
  detectCycle,
  checkDecisionNodeExits,
  exportToJSON,
  importFromJSON,
  generateNodeId,
  generateEdgeId,
  createDefaultNodeData,
  deepClone,
} from './workflow';
import { NodeType, type WorkflowNode, type WorkflowEdge } from '../types/workflow';

describe('workflow', () => {
  describe('detectCycle', () => {
    const createMockNode = (id: string): WorkflowNode => ({
      id,
      type: NodeType.JOB,
      position: { x: 0, y: 0 },
      data: { label: id, type: NodeType.JOB },
    });

    const createMockEdge = (source: string, target: string): WorkflowEdge => ({
      id: `${source}-${target}`,
      source,
      target,
      type: 'custom',
    });

    it('should return null for empty nodes', () => {
      expect(detectCycle([], [createMockEdge('1', '2')])).toBeNull();
    });

    it('should return null for empty edges', () => {
      expect(detectCycle([createMockNode('1')], [])).toBeNull();
    });

    it('should return null for acyclic graph', () => {
      const nodes = [createMockNode('1'), createMockNode('2'), createMockNode('3')];
      const edges = [createMockEdge('1', '2'), createMockEdge('2', '3')];

      expect(detectCycle(nodes, edges)).toBeNull();
    });

    it('should detect simple cycle', () => {
      const nodes = [createMockNode('1'), createMockNode('2')];
      const edges = [createMockEdge('1', '2'), createMockEdge('2', '1')];

      expect(detectCycle(nodes, edges)).toBe('workflow.cycle.error');
    });

    it('should detect longer cycle', () => {
      const nodes = [createMockNode('1'), createMockNode('2'), createMockNode('3')];
      const edges = [createMockEdge('1', '2'), createMockEdge('2', '3'), createMockEdge('3', '1')];

      expect(detectCycle(nodes, edges)).toBe('workflow.cycle.error');
    });

    it('should return null for graph with no path back', () => {
      const nodes = [
        createMockNode('1'),
        createMockNode('2'),
        createMockNode('3'),
        createMockNode('4'),
      ];
      const edges = [createMockEdge('1', '2'), createMockEdge('1', '3'), createMockEdge('2', '4')];

      expect(detectCycle(nodes, edges)).toBeNull();
    });

    it('should handle disconnected components', () => {
      const nodes = [
        createMockNode('1'),
        createMockNode('2'),
        createMockNode('3'),
        createMockNode('4'),
      ];
      const edges = [createMockEdge('1', '2'), createMockEdge('3', '4')];

      expect(detectCycle(nodes, edges)).toBeNull();
    });

    it('should detect cycle in disconnected component', () => {
      const nodes = [
        createMockNode('1'),
        createMockNode('2'),
        createMockNode('3'),
        createMockNode('4'),
      ];
      const edges = [createMockEdge('1', '2'), createMockEdge('3', '4'), createMockEdge('4', '3')];

      expect(detectCycle(nodes, edges)).toBe('workflow.cycle.error');
    });
  });

  describe('checkDecisionNodeExits', () => {
    const createMockNode = (id: string, type: NodeType, label: string): WorkflowNode => ({
      id,
      type,
      position: { x: 0, y: 0 },
      data: { label, type },
    });

    const createMockEdge = (source: string, target: string): WorkflowEdge => ({
      id: `${source}-${target}`,
      source,
      target,
      type: 'custom',
    });

    it('should return empty array when no decision nodes', () => {
      const nodes = [createMockNode('1', NodeType.JOB, 'Job1')];
      const edges: WorkflowEdge[] = [];

      expect(checkDecisionNodeExits(nodes, edges)).toEqual([]);
    });

    it('should return error for decision node with only one exit', () => {
      const nodes = [createMockNode('1', NodeType.DECISION, 'Decision1')];
      const edges = [createMockEdge('1', '2')];

      const errors = checkDecisionNodeExits(nodes, edges);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Decision1');
      expect(errors[0]).toContain('2 exits');
    });

    it('should return error for decision node with no exits', () => {
      const nodes = [createMockNode('1', NodeType.DECISION, 'Decision1')];
      const edges: WorkflowEdge[] = [];

      const errors = checkDecisionNodeExits(nodes, edges);
      expect(errors).toHaveLength(1);
    });

    it('should return empty array for decision node with two exits', () => {
      const nodes = [createMockNode('1', NodeType.DECISION, 'Decision1')];
      const edges = [createMockEdge('1', '2'), createMockEdge('1', '3')];

      expect(checkDecisionNodeExits(nodes, edges)).toEqual([]);
    });

    it('should return empty array for decision node with more than two exits', () => {
      const nodes = [createMockNode('1', NodeType.DECISION, 'Decision1')];
      const edges = [createMockEdge('1', '2'), createMockEdge('1', '3'), createMockEdge('1', '4')];

      expect(checkDecisionNodeExits(nodes, edges)).toEqual([]);
    });

    it('should check multiple decision nodes', () => {
      const nodes = [
        createMockNode('1', NodeType.DECISION, 'Decision1'),
        createMockNode('2', NodeType.DECISION, 'Decision2'),
      ];
      const edges = [createMockEdge('1', '3'), createMockEdge('1', '4')];

      const errors = checkDecisionNodeExits(nodes, edges);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Decision2');
    });
  });

  describe('exportToJSON', () => {
    it('should export empty workflow', () => {
      const result = exportToJSON([], []);
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('1.0');
      expect(parsed.nodes).toEqual([]);
      expect(parsed.edges).toEqual([]);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should export workflow with nodes and edges', () => {
      const nodes: WorkflowNode[] = [
        {
          id: '1',
          type: NodeType.JOB,
          position: { x: 0, y: 0 },
          data: { label: 'Job 1', type: NodeType.JOB },
        },
      ];
      const edges: WorkflowEdge[] = [{ id: 'e1', source: '1', target: '2', type: 'custom' }];

      const result = exportToJSON(nodes, edges);
      const parsed = JSON.parse(result);

      expect(parsed.nodes).toHaveLength(1);
      expect(parsed.edges).toHaveLength(1);
      expect(parsed.nodes[0].id).toBe('1');
    });

    it('should deep clone data to prevent mutation', () => {
      const nodes: WorkflowNode[] = [
        {
          id: '1',
          type: NodeType.JOB,
          position: { x: 0, y: 0 },
          data: { label: 'Original', type: NodeType.JOB },
        },
      ];

      const result = exportToJSON(nodes, []);
      nodes[0].data.label = 'Modified';

      const parsed = JSON.parse(result);
      expect(parsed.nodes[0].data.label).toBe('Original');
    });

    it('should include valid ISO timestamp', () => {
      const result = exportToJSON([], []);
      const parsed = JSON.parse(result);

      expect(() => new Date(parsed.exportedAt)).not.toThrow();
    });
  });

  describe('importFromJSON', () => {
    it('should successfully import valid JSON', () => {
      const json = JSON.stringify({
        version: '1.0',
        nodes: [{ id: '1', type: 'JOB', position: { x: 0, y: 0 }, data: { label: 'Test' } }],
        edges: [],
        exportedAt: new Date().toISOString(),
      });

      const result = importFromJSON(json);

      expect(result.success).toBe(true);
      expect(result.data?.nodes).toHaveLength(1);
      expect(result.data?.version).toBe('1.0');
    });

    it('should fail for invalid JSON', () => {
      const result = importFromJSON('not valid json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('workflow.import.error.format');
    });

    it('should fail for missing version', () => {
      const json = JSON.stringify({
        nodes: [],
        edges: [],
      });

      const result = importFromJSON(json);

      expect(result.success).toBe(false);
      expect(result.error).toBe('workflow.import.error.format');
    });

    it('should fail for missing nodes array', () => {
      const json = JSON.stringify({
        version: '1.0',
        edges: [],
      });

      const result = importFromJSON(json);

      expect(result.success).toBe(false);
    });

    it('should fail for missing edges array', () => {
      const json = JSON.stringify({
        version: '1.0',
        nodes: [],
      });

      const result = importFromJSON(json);

      expect(result.success).toBe(false);
    });

    it('should fail for nodes not being array', () => {
      const json = JSON.stringify({
        version: '1.0',
        nodes: 'not an array',
        edges: [],
      });

      const result = importFromJSON(json);

      expect(result.success).toBe(false);
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();

      expect(id1).not.toBe(id2);
    });

    it('should start with "node_"', () => {
      const id = generateNodeId();
      expect(id.startsWith('node_')).toBe(true);
    });

    it('should contain timestamp', () => {
      const id = generateNodeId();
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      expect(parseInt(parts[1])).not.toBeNaN();
    });

    it('should have random suffix', () => {
      const ids = Array.from({ length: 10 }, () => {
        const id = generateNodeId();
        const parts = id.split('_');
        return parts[2];
      });

      const uniqueSuffixes = new Set(ids);
      expect(uniqueSuffixes.size).toBe(10);
    });
  });

  describe('generateEdgeId', () => {
    it('should generate edge ID with source and target', () => {
      const id = generateEdgeId('node1', 'node2');

      expect(id).toContain('node1');
      expect(id).toContain('node2');
    });

    it('should start with "edge_"', () => {
      const id = generateEdgeId('a', 'b');
      expect(id.startsWith('edge_')).toBe(true);
    });

    it('should generate unique IDs for same source/target', async () => {
      const id1 = generateEdgeId('a', 'b');
      await new Promise((resolve) => setTimeout(resolve, 1));
      const id2 = generateEdgeId('a', 'b');

      expect(id1).not.toBe(id2);
    });
  });

  describe('createDefaultNodeData', () => {
    it('should create default data for JOB node', () => {
      const data = createDefaultNodeData(NodeType.JOB, 'My Job');

      expect(data.label).toBe('My Job');
      expect(data.type).toBe(NodeType.JOB);
      expect(data.enable).toBe(true);
      expect(data.skip).toBe(false);
    });

    it('should create default data for DECISION node', () => {
      const data = createDefaultNodeData(NodeType.DECISION, 'Decision');

      expect(data.label).toBe('Decision');
      expect(data.type).toBe(NodeType.DECISION);
    });

    it('should create default data for NESTED_WORKFLOW node', () => {
      const data = createDefaultNodeData(NodeType.NESTED_WORKFLOW, 'Nested');

      expect(data.label).toBe('Nested');
      expect(data.type).toBe(NodeType.NESTED_WORKFLOW);
    });
  });

  describe('deepClone', () => {
    it('should clone simple object', () => {
      const original = { a: 1, b: 'test' };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested object', () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      cloned.a.b.c = 2;
      expect(original.a.b.c).toBe(1);
    });

    it('should clone array', () => {
      const original = [{ a: 1 }, { b: 2 }, { a: 3 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      (cloned[2] as { a: number }).a = 4;
      expect(original[2].a).toBe(3);
    });

    it('should handle null', () => {
      expect(deepClone(null)).toBeNull();
    });

    it('should handle primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('string')).toBe('string');
      expect(deepClone(true)).toBe(true);
    });
  });
});
