import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useWorkflowStore, getWorkflowState, setWorkflowState } from '@/stores/workflowStore';
import { NodeType, type WorkflowNode, type WorkflowEdge } from '@/types/workflow';

describe('workflowStore', () => {
  const createMockNode = (id: string): WorkflowNode => ({
    id,
    type: NodeType.JOB,
    position: { x: 0, y: 0 },
    data: { label: `Node ${id}`, type: NodeType.JOB },
  });

  const createMockEdge = (source: string, target: string): WorkflowEdge => ({
    id: `edge-${source}-${target}`,
    source,
    target,
    type: 'custom',
  });

  beforeEach(() => {
    act(() => {
      useWorkflowStore.setState({
        past: [],
        present: { nodes: [], edges: [] },
        future: [],
      });
    });
  });

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useWorkflowStore.getState();
      expect(state.present.nodes).toEqual([]);
      expect(state.present.edges).toEqual([]);
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
    });

    it('should have maxHistorySize of 50', () => {
      const state = useWorkflowStore.getState();
      expect(state.maxHistorySize).toBe(50);
    });
  });

  describe('setNodes', () => {
    it('should set nodes', () => {
      const nodes = [createMockNode('1'), createMockNode('2')];

      act(() => {
        useWorkflowStore.getState().setNodes(nodes);
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(2);
    });

    it('should add current state to past', () => {
      const initialNodes = [createMockNode('1')];

      act(() => {
        useWorkflowStore.getState().setNodes(initialNodes);
      });

      const newNodes = [createMockNode('2'), createMockNode('3')];

      act(() => {
        useWorkflowStore.getState().setNodes(newNodes);
      });

      expect(useWorkflowStore.getState().past).toHaveLength(2);
      expect(useWorkflowStore.getState().past[1].nodes).toHaveLength(1);
    });

    it('should clear future when setting nodes', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().future).toHaveLength(1);

      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('2')]);
      });

      expect(useWorkflowStore.getState().future).toHaveLength(0);
    });

    it('should limit history to maxHistorySize', () => {
      const store = useWorkflowStore.getState();

      for (let i = 0; i < 60; i++) {
        act(() => {
          store.setNodes([createMockNode(`node-${i}`)]);
        });
      }

      expect(useWorkflowStore.getState().past.length).toBeLessThanOrEqual(store.maxHistorySize);
    });
  });

  describe('setEdges', () => {
    it('should set edges', () => {
      const edges = [createMockEdge('1', '2')];

      act(() => {
        useWorkflowStore.getState().setEdges(edges);
      });

      expect(useWorkflowStore.getState().present.edges).toHaveLength(1);
    });

    it('should add current state to past', () => {
      const initialEdges = [createMockEdge('1', '2')];

      act(() => {
        useWorkflowStore.getState().setEdges(initialEdges);
      });

      const newEdges = [createMockEdge('2', '3')];

      act(() => {
        useWorkflowStore.getState().setEdges(newEdges);
      });

      expect(useWorkflowStore.getState().past).toHaveLength(2);
    });

    it('should clear future when setting edges', () => {
      act(() => {
        useWorkflowStore.getState().setEdges([createMockEdge('1', '2')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      act(() => {
        useWorkflowStore.getState().setEdges([createMockEdge('2', '3')]);
      });

      expect(useWorkflowStore.getState().future).toHaveLength(0);
    });
  });

  describe('setState', () => {
    it('should set both nodes and edges', () => {
      const nodes = [createMockNode('1')];
      const edges = [createMockEdge('1', '2')];

      act(() => {
        useWorkflowStore.getState().setState({ nodes, edges });
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(1);
      expect(useWorkflowStore.getState().present.edges).toHaveLength(1);
    });

    it('should set only nodes', () => {
      act(() => {
        useWorkflowStore.getState().setEdges([createMockEdge('1', '2')]);
      });

      act(() => {
        useWorkflowStore.getState().setState({ nodes: [createMockNode('1')] });
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(1);
      expect(useWorkflowStore.getState().present.edges).toHaveLength(1);
    });

    it('should add current state to past', () => {
      act(() => {
        useWorkflowStore.getState().setState({ nodes: [createMockNode('1')] });
      });

      act(() => {
        useWorkflowStore.getState().setState({ nodes: [createMockNode('2')] });
      });

      expect(useWorkflowStore.getState().past).toHaveLength(2);
    });
  });

  describe('undo', () => {
    it('should do nothing when no past', () => {
      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().present.nodes).toEqual([]);
    });

    it('should restore previous state', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1'), createMockNode('2')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(1);
    });

    it('should add current state to future', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1'), createMockNode('2')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().future).toHaveLength(1);
      expect(useWorkflowStore.getState().future[0].nodes).toHaveLength(2);
    });

    it('should remove from past', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().past).toHaveLength(0);
    });
  });

  describe('redo', () => {
    it('should do nothing when no future', () => {
      act(() => {
        useWorkflowStore.getState().redo();
      });

      expect(useWorkflowStore.getState().present.nodes).toEqual([]);
    });

    it('should restore next state', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1'), createMockNode('2')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      act(() => {
        useWorkflowStore.getState().redo();
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(2);
    });

    it('should add current state to past', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      act(() => {
        useWorkflowStore.getState().redo();
      });

      expect(useWorkflowStore.getState().past).toHaveLength(1);
    });

    it('should remove from future', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1'), createMockNode('2')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      act(() => {
        useWorkflowStore.getState().redo();
      });

      expect(useWorkflowStore.getState().future).toHaveLength(0);
    });

    it('should handle multiple undo/redo', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1'), createMockNode('2')]);
      });

      act(() => {
        useWorkflowStore
          .getState()
          .setNodes([createMockNode('1'), createMockNode('2'), createMockNode('3')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(1);

      act(() => {
        useWorkflowStore.getState().redo();
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(2);
    });
  });

  describe('canUndo', () => {
    it('should return false when no past', () => {
      expect(useWorkflowStore.getState().canUndo()).toBe(false);
    });

    it('should return true when has past', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      expect(useWorkflowStore.getState().canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false when no future', () => {
      expect(useWorkflowStore.getState().canRedo()).toBe(false);
    });

    it('should return true when has future', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().canRedo()).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('should clear past and future', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1'), createMockNode('2')]);
      });

      act(() => {
        useWorkflowStore.getState().undo();
      });

      expect(useWorkflowStore.getState().past).toHaveLength(1);
      expect(useWorkflowStore.getState().future).toHaveLength(1);

      act(() => {
        useWorkflowStore.getState().clearHistory();
      });

      expect(useWorkflowStore.getState().past).toHaveLength(0);
      expect(useWorkflowStore.getState().future).toHaveLength(0);
    });

    it('should not affect present state', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1'), createMockNode('2')]);
      });

      act(() => {
        useWorkflowStore.getState().clearHistory();
      });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(2);
    });
  });

  describe('getWorkflowState', () => {
    it('should return current state', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      const state = getWorkflowState();

      expect(state.nodes).toHaveLength(1);
    });

    it('should return a deep clone', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      const state1 = getWorkflowState();
      const state2 = getWorkflowState();

      expect(state1).not.toBe(state2);
      expect(state1.nodes).not.toBe(state2.nodes);
    });
  });

  describe('setWorkflowState', () => {
    it('should set state', () => {
      const nodes = [createMockNode('1'), createMockNode('2')];
      const edges = [createMockEdge('1', '2')];

      setWorkflowState({ nodes, edges });

      expect(useWorkflowStore.getState().present.nodes).toHaveLength(2);
      expect(useWorkflowStore.getState().present.edges).toHaveLength(1);
    });

    it('should add to history', () => {
      act(() => {
        useWorkflowStore.getState().setNodes([createMockNode('1')]);
      });

      setWorkflowState({ nodes: [createMockNode('2')], edges: [] });

      expect(useWorkflowStore.getState().past).toHaveLength(2);
    });
  });

  describe('immutability', () => {
    it('should deep clone nodes when setting', () => {
      const nodes = [createMockNode('1')];

      act(() => {
        useWorkflowStore.getState().setNodes(nodes);
      });

      nodes[0].data.label = 'Modified';

      expect(useWorkflowStore.getState().present.nodes[0].data.label).toBe('Node 1');
    });

    it('should deep clone edges when setting', () => {
      const edges = [createMockEdge('1', '2')];

      act(() => {
        useWorkflowStore.getState().setEdges(edges);
      });

      edges[0].source = 'modified';

      expect(useWorkflowStore.getState().present.edges[0].source).toBe('1');
    });
  });
});
