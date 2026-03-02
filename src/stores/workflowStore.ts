import { create } from 'zustand';
import { WorkflowNode, WorkflowEdge } from '@/types';

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface HistoryState {
  past: WorkflowState[];
  present: WorkflowState;
  future: WorkflowState[];
}

interface WorkflowStore extends HistoryState {
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  setState: (state: Partial<WorkflowState>) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  maxHistorySize: number;
}

const MAX_HISTORY_SIZE = 50;

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  past: [],
  present: { nodes: [], edges: [] },
  future: [],
  maxHistorySize: MAX_HISTORY_SIZE,

  setNodes: (nodes) => {
    const state = get();
    const newPast = [...state.past, deepClone(state.present)].slice(-state.maxHistorySize);
    set({
      past: newPast,
      present: { ...state.present, nodes: deepClone(nodes) },
      future: [],
    });
  },

  setEdges: (edges) => {
    const state = get();
    const newPast = [...state.past, deepClone(state.present)].slice(-state.maxHistorySize);
    set({
      past: newPast,
      present: { ...state.present, edges: deepClone(edges) },
      future: [],
    });
  },

  setState: (newState) => {
    const state = get();
    const newPast = [...state.past, deepClone(state.present)].slice(-state.maxHistorySize);
    set({
      past: newPast,
      present: { ...state.present, ...deepClone(newState) },
      future: [],
    });
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;

    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);

    set({
      past: newPast,
      present: previous,
      future: [deepClone(state.present), ...state.future],
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;

    const next = state.future[0];
    const newFuture = state.future.slice(1);

    set({
      past: [...state.past, deepClone(state.present)],
      present: next,
      future: newFuture,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clearHistory: () => {
    set({
      past: [],
      future: [],
    });
  },
}));

export const getWorkflowState = (): WorkflowState => {
  const state = useWorkflowStore.getState();
  return deepClone(state.present);
};

export const setWorkflowState = (state: WorkflowState) => {
  useWorkflowStore.getState().setState(state);
};

export default useWorkflowStore;
