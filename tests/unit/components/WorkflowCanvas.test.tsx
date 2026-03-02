import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConnectionMode, type Connection } from '@xyflow/react';
import { NodeType, NodeStatus } from '@/types/workflow';
import { EDGE_STROKE } from '@/constants/edgeColors';
import WorkflowCanvas from '@/components/WorkflowCanvas';

const mockReactFlowProps = vi.hoisted(() => ({
  current: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();

  return {
    ...actual,
    ReactFlow: (props: Record<string, unknown>) => {
      mockReactFlowProps.current = props;
      return <div data-testid="mock-react-flow" />;
    },
    Background: () => null,
    Controls: () => null,
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReactFlow: () => ({
      fitView: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      setViewport: vi.fn(),
      getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      screenToFlowPosition: vi.fn(() => ({ x: 0, y: 0 })),
    }),
    useViewport: () => ({ zoom: 1 }),
  };
});

describe('WorkflowCanvas marker color', () => {
  beforeEach(() => {
    mockReactFlowProps.current = undefined;
  });

  it('sets markerEnd color for decision edge to match stroke color in edit mode', () => {
    render(
      <WorkflowCanvas
        nodes={[
          {
            id: 'n1',
            type: NodeType.DECISION,
            position: { x: 0, y: 0 },
            data: { label: '判断', type: NodeType.DECISION },
          },
          {
            id: 'n2',
            type: NodeType.JOB,
            position: { x: 200, y: 0 },
            data: { label: '任务', type: NodeType.JOB },
          },
        ]}
        edges={[
          {
            id: 'e1-2',
            source: 'n1',
            target: 'n2',
            data: { property: 'true' },
          },
        ]}
        mode="edit"
      />,
    );

    const props = mockReactFlowProps.current as { edges?: Array<{ markerEnd?: { color?: string } }> } | undefined;
    expect(props?.edges?.[0]?.markerEnd?.color).toBe(EDGE_STROKE.propertyTrue);
  });

  it('sets markerEnd color to executed when source node is terminal status in view mode', () => {
    render(
      <WorkflowCanvas
        nodes={[
          {
            id: 'n1',
            type: NodeType.JOB,
            position: { x: 0, y: 0 },
            data: { label: '任务1', type: NodeType.JOB, status: NodeStatus.SUCCESS },
          },
          {
            id: 'n2',
            type: NodeType.JOB,
            position: { x: 200, y: 0 },
            data: { label: '任务2', type: NodeType.JOB },
          },
        ]}
        edges={[
          {
            id: 'e1-2',
            source: 'n1',
            target: 'n2',
          },
        ]}
        mode="view"
      />,
    );

    const props = mockReactFlowProps.current as { edges?: Array<{ markerEnd?: { color?: string } }> } | undefined;
    expect(props?.edges?.[0]?.markerEnd?.color).toBe(EDGE_STROKE.executed);
  });

  it('sets markerEnd color to disabled when source node is not terminal status in view mode', () => {
    render(
      <WorkflowCanvas
        nodes={[
          {
            id: 'n1',
            type: NodeType.JOB,
            position: { x: 0, y: 0 },
            data: { label: '任务1', type: NodeType.JOB, status: NodeStatus.RUNNING },
          },
          {
            id: 'n2',
            type: NodeType.JOB,
            position: { x: 200, y: 0 },
            data: { label: '任务2', type: NodeType.JOB },
          },
        ]}
        edges={[
          {
            id: 'e1-2',
            source: 'n1',
            target: 'n2',
          },
        ]}
        mode="view"
      />,
    );

    const props = mockReactFlowProps.current as { edges?: Array<{ markerEnd?: { color?: string } }> } | undefined;
    expect(props?.edges?.[0]?.markerEnd?.color).toBe(EDGE_STROKE.disabled);
  });

  it('sets markerEnd color to disabled when source node has no status in view mode', () => {
    render(
      <WorkflowCanvas
        nodes={[
          {
            id: 'n1',
            type: NodeType.JOB,
            position: { x: 0, y: 0 },
            data: { label: '任务1', type: NodeType.JOB },
          },
          {
            id: 'n2',
            type: NodeType.JOB,
            position: { x: 200, y: 0 },
            data: { label: '任务2', type: NodeType.JOB },
          },
        ]}
        edges={[
          {
            id: 'e1-2',
            source: 'n1',
            target: 'n2',
          },
        ]}
        mode="view"
      />,
    );

    const props = mockReactFlowProps.current as { edges?: Array<{ markerEnd?: { color?: string } }> } | undefined;
    expect(props?.edges?.[0]?.markerEnd?.color).toBe(EDGE_STROKE.disabled);
  });

  it('preserves reverse drag connection direction before calling onConnect', () => {
    const onConnect = vi.fn();
    render(
      <WorkflowCanvas
        nodes={[
          {
            id: 'A',
            type: NodeType.JOB,
            position: { x: 0, y: 0 },
            data: { label: 'A', type: NodeType.JOB },
          },
          {
            id: 'B',
            type: NodeType.JOB,
            position: { x: 200, y: 0 },
            data: { label: 'B', type: NodeType.JOB },
          },
        ]}
        edges={[]}
        mode="edit"
        onConnect={onConnect}
      />,
    );

    const props = mockReactFlowProps.current as
      | { onConnect?: (connection: Connection) => void; connectionMode?: unknown }
      | undefined;
    props?.onConnect?.({
      source: 'B',
      sourceHandle: 'left',
      target: 'A',
      targetHandle: 'right',
    });

    expect(onConnect).toHaveBeenCalledWith({
      source: 'B',
      sourceHandle: 'left',
      target: 'A',
      targetHandle: 'right',
    });
    expect(props?.connectionMode).toBe(ConnectionMode.Loose);
  });
});
