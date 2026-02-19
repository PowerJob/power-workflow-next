import { describe, it, expect } from 'vitest';
import {
  getOptimalHandlesForEdge,
  assignOptimalHandles,
} from '../edgeHandles';
import { NodeType, type WorkflowNode, type WorkflowEdge } from '../../types/workflow';

const createMockNode = (
  id: string,
  type: NodeType,
  position: { x: number; y: number },
): WorkflowNode => ({
  id,
  type,
  position,
  data: { label: id, type },
});

describe('edgeHandles', () => {
  describe('getOptimalHandlesForEdge', () => {
    it('should return right→left when direction is horizontal', () => {
      const source = createMockNode('a', NodeType.JOB, { x: 100, y: 100 });
      const target = createMockNode('b', NodeType.JOB, { x: 350, y: 100 });
      const result = getOptimalHandlesForEdge(source, target, { direction: 'horizontal' });
      expect(result.sourceHandleId).toBe('right');
      expect(result.targetHandleId).toBe('left');
    });

    it('should return bottom→top when direction is vertical', () => {
      const source = createMockNode('a', NodeType.JOB, { x: 100, y: 100 });
      const target = createMockNode('b', NodeType.JOB, { x: 100, y: 250 });
      const result = getOptimalHandlesForEdge(source, target, { direction: 'vertical' });
      expect(result.sourceHandleId).toBe('bottom');
      expect(result.targetHandleId).toBe('top');
    });

    it('should default to horizontal (right→left) when no options passed', () => {
      const source = createMockNode('a', NodeType.JOB, { x: 0, y: 0 });
      const target = createMockNode('b', NodeType.JOB, { x: 300, y: 150 });
      const result = getOptimalHandlesForEdge(source, target);
      expect(result.sourceHandleId).toBe('right');
      expect(result.targetHandleId).toBe('left');
    });

    it('should return right→left for horizontal regardless of node positions', () => {
      const source = createMockNode('a', NodeType.JOB, { x: 350, y: 100 });
      const target = createMockNode('b', NodeType.JOB, { x: 100, y: 100 });
      const result = getOptimalHandlesForEdge(source, target, { direction: 'horizontal' });
      expect(result.sourceHandleId).toBe('right');
      expect(result.targetHandleId).toBe('left');
    });

    it('should return bottom→top for vertical regardless of node positions', () => {
      const source = createMockNode('a', NodeType.JOB, { x: 100, y: 250 });
      const target = createMockNode('b', NodeType.JOB, { x: 100, y: 100 });
      const result = getOptimalHandlesForEdge(source, target, { direction: 'vertical' });
      expect(result.sourceHandleId).toBe('bottom');
      expect(result.targetHandleId).toBe('top');
    });
  });

  describe('assignOptimalHandles', () => {
    it('should assign sourceHandle and targetHandle to each edge (default horizontal)', () => {
      const nodes: WorkflowNode[] = [
        createMockNode('job-1', NodeType.JOB, { x: 100, y: 100 }),
        createMockNode('job-2', NodeType.JOB, { x: 350, y: 100 }),
        createMockNode('job-3', NodeType.JOB, { x: 600, y: 100 }),
      ];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'job-1', target: 'job-2', type: 'custom' },
        { id: 'e2', source: 'job-2', target: 'job-3', type: 'custom' },
      ];
      const result = assignOptimalHandles(nodes, edges);
      expect(result).toHaveLength(2);
      expect(result[0].sourceHandle).toBe('right');
      expect(result[0].targetHandle).toBe('left');
      expect(result[1].sourceHandle).toBe('right');
      expect(result[1].targetHandle).toBe('left');
    });

    it('should assign bottom→top when direction is vertical', () => {
      const nodes: WorkflowNode[] = [
        createMockNode('job-1', NodeType.JOB, { x: 100, y: 100 }),
        createMockNode('job-2', NodeType.JOB, { x: 100, y: 250 }),
      ];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'job-1', target: 'job-2', type: 'custom' },
      ];
      const result = assignOptimalHandles(nodes, edges, { direction: 'vertical' });
      expect(result).toHaveLength(1);
      expect(result[0].sourceHandle).toBe('bottom');
      expect(result[0].targetHandle).toBe('top');
    });

    it('should not mutate original edges', () => {
      const nodes = [
        createMockNode('a', NodeType.JOB, { x: 0, y: 0 }),
        createMockNode('b', NodeType.JOB, { x: 200, y: 0 }),
      ];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'a', target: 'b', type: 'custom' },
      ];
      const result = assignOptimalHandles(nodes, edges);
      expect(edges[0].sourceHandle).toBeUndefined();
      expect(edges[0].targetHandle).toBeUndefined();
      expect(result[0].sourceHandle).toBe('right');
      expect(result[0].targetHandle).toBe('left');
    });

    it('should leave edge unchanged when source or target node is missing', () => {
      const nodes = [createMockNode('a', NodeType.JOB, { x: 0, y: 0 })];
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'a', target: 'missing', type: 'custom' },
      ];
      const result = assignOptimalHandles(nodes, edges);
      expect(result[0]).toEqual(edges[0]);
    });

    it('should return empty array when edges is empty', () => {
      const nodes = [createMockNode('a', NodeType.JOB, { x: 0, y: 0 })];
      expect(assignOptimalHandles(nodes, [])).toEqual([]);
    });
  });
});
