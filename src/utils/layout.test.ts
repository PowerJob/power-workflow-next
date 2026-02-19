import { describe, it, expect } from 'vitest';
import { layoutNodes } from './layout';
import { NodeType, type WorkflowNode, type WorkflowEdge } from '../types/workflow';

describe('layout', () => {
  describe('layoutNodes', () => {
    const createMockNode = (
      id: string,
      type: NodeType,
      position = { x: 0, y: 0 },
    ): WorkflowNode => ({
      id,
      type,
      position,
      data: {
        label: `Node ${id}`,
        type,
      },
    });

    const createMockEdge = (source: string, target: string): WorkflowEdge => ({
      id: `edge-${source}-${target}`,
      source,
      target,
      type: 'custom',
    });

    it('should return empty array when no nodes', () => {
      const result = layoutNodes([], []);
      expect(result).toEqual([]);
    });

    it('should return single node unchanged', () => {
      const nodes = [createMockNode('1', NodeType.JOB)];
      const result = layoutNodes(nodes, []);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should layout nodes horizontally by default', () => {
      const nodes = [createMockNode('1', NodeType.JOB), createMockNode('2', NodeType.JOB)];
      const edges = [createMockEdge('1', '2')];

      const result = layoutNodes(nodes, edges);

      expect(result[0].position.x).toBeLessThan(result[1].position.x);
    });

    it('should layout nodes vertically when direction is vertical', () => {
      const nodes = [createMockNode('1', NodeType.JOB), createMockNode('2', NodeType.JOB)];
      const edges = [createMockEdge('1', '2')];

      const result = layoutNodes(nodes, edges, { direction: 'vertical' });

      expect(result[0].position.y).toBeLessThan(result[1].position.y);
    });

    it('should apply custom node separation', () => {
      const nodes = [createMockNode('1', NodeType.JOB), createMockNode('2', NodeType.JOB)];
      const edges = [createMockEdge('1', '2')];

      const defaultSep = layoutNodes(nodes, edges, { nodeSep: 60, rankSep: 80 });
      const largeSep = layoutNodes(nodes, edges, { nodeSep: 120, rankSep: 160 });

      const defaultGap = defaultSep[1].position.x - defaultSep[0].position.x;
      const largeGap = largeSep[1].position.x - largeSep[0].position.x;

      expect(largeGap).toBeGreaterThan(defaultGap);
    });

    it('should handle decision nodes with correct dimensions', () => {
      const nodes = [createMockNode('1', NodeType.DECISION), createMockNode('2', NodeType.JOB)];
      const edges = [createMockEdge('1', '2')];

      const result = layoutNodes(nodes, edges);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBeDefined();
      expect(result[1].position).toBeDefined();
    });

    it('should handle nested workflow nodes', () => {
      const nodes = [
        createMockNode('1', NodeType.JOB),
        createMockNode('2', NodeType.NESTED_WORKFLOW),
      ];
      const edges = [createMockEdge('1', '2')];

      const result = layoutNodes(nodes, edges);

      expect(result).toHaveLength(2);
    });

    it('should preserve node data', () => {
      const nodes = [
        {
          ...createMockNode('1', NodeType.JOB),
          data: {
            label: 'Custom Label',
            type: NodeType.JOB,
            jobId: 123,
            enable: true,
          },
        },
      ];

      const result = layoutNodes(nodes, []);

      expect(result[0].data.label).toBe('Custom Label');
      expect(result[0].data.jobId).toBe(123);
    });

    it('should handle multiple connected nodes', () => {
      const nodes = [
        createMockNode('1', NodeType.JOB),
        createMockNode('2', NodeType.JOB),
        createMockNode('3', NodeType.JOB),
      ];
      const edges = [createMockEdge('1', '2'), createMockEdge('2', '3')];

      const result = layoutNodes(nodes, edges, { direction: 'horizontal' });

      expect(result[0].position.x).toBeLessThan(result[1].position.x);
      expect(result[1].position.x).toBeLessThan(result[2].position.x);
    });

    it('should handle disconnected nodes', () => {
      const nodes = [createMockNode('1', NodeType.JOB), createMockNode('2', NodeType.JOB)];

      const result = layoutNodes(nodes, []);

      expect(result).toHaveLength(2);
      expect(result[0].position).toBeDefined();
      expect(result[1].position).toBeDefined();
    });

    it('should handle node without type (defaults to JOB)', () => {
      const nodes = [
        {
          id: '1',
          type: 'JOB',
          position: { x: 0, y: 0 },
          data: {
            label: 'No Type Node',
          },
        } as WorkflowNode,
      ];

      const result = layoutNodes(nodes, []);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBeDefined();
    });

    it('should handle complex graph with branches', () => {
      const nodes = [
        createMockNode('1', NodeType.JOB),
        createMockNode('2', NodeType.DECISION),
        createMockNode('3', NodeType.JOB),
        createMockNode('4', NodeType.JOB),
      ];
      const edges = [createMockEdge('1', '2'), createMockEdge('2', '3'), createMockEdge('2', '4')];

      const result = layoutNodes(nodes, edges);

      expect(result).toHaveLength(4);
    });
  });
});
