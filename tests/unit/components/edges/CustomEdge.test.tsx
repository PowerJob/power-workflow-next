import { render } from '@testing-library/react';
import { MarkerType, ReactFlowProvider } from '@xyflow/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomEdge from '@/components/edges/CustomEdge';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { NodeType, NodeStatus } from '@/types/workflow';
import { EDGE_STROKE } from '@/constants/edgeColors';

const mockGetNodeReturn = vi.hoisted(() => ({ current: undefined as { data: { type: string } } | undefined }));

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    useReactFlow: () => ({
      setEdges: vi.fn(),
      getNode: () => mockGetNodeReturn.current,
    }),
  };
});

const renderEdge = (props: any) => {
  return render(
    <LocaleProvider>
      <ReactFlowProvider>
        <svg>
          <CustomEdge {...props} />
        </svg>
      </ReactFlowProvider>
    </LocaleProvider>
  );
};

const defaultProps = {
  id: 'e1-2',
  source: '1',
  target: '2',
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 100,
  sourcePosition: 'right',
  targetPosition: 'left',
  data: { property: 'true' },
  selected: false,
  markerEnd: 'url(#arrow)',
  style: {},
};

describe('CustomEdge', () => {
  beforeEach(() => {
    mockGetNodeReturn.current = { data: { type: NodeType.DECISION } };
  });

  it('renders green stroke when property is true', () => {
    const { container } = renderEdge(defaultProps);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.propertyTrue });
  });

  it('renders red stroke when property is false', () => {
    const { container } = renderEdge({ ...defaultProps, data: { property: 'false' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.propertyFalse });
  });

  it('keeps markerEnd attribute on edge path', () => {
    const { container } = renderEdge(defaultProps);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveAttribute('marker-end');
  });

  it('renders marker object without breaking edge style', () => {
    const { container } = renderEdge({
      ...defaultProps,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 11,
        height: 11,
      },
    });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.propertyTrue });
    expect(path).toHaveAttribute('marker-end');
  });

  it('uses property-based stroke when source is decision node', () => {
    mockGetNodeReturn.current = { data: { type: NodeType.DECISION } };
    const { container } = renderEdge(defaultProps);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.propertyTrue });
  });

  it('does not render property button and uses neutral stroke when source is not decision node', () => {
    mockGetNodeReturn.current = { data: { type: NodeType.JOB } };
    const { container } = renderEdge({ ...defaultProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.default });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  it('does not render property button when source node is missing', () => {
    mockGetNodeReturn.current = undefined;
    const { container } = renderEdge(defaultProps);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.default });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});

describe('view mode edge rendering', () => {
  const viewModeProps = {
    ...defaultProps,
    mode: 'view' as const,
  };

  it('renders green stroke in view mode when source node has terminal status and edge enabled', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.SUCCESS,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });

  it('renders gray stroke in view mode when source node is not terminal status', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.RUNNING,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
  });

  it('renders gray stroke in view mode when source node has no status', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: undefined,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
  });

  it('renders gray stroke with dash in view mode when edge is disabled', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.SUCCESS,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true', enable: false } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
    expect(path).toHaveStyle({ strokeDasharray: '6 4' });
  });

  it('renders gray stroke in view mode when source node status is WAITING', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.WAITING,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.disabled });
  });

  it('renders green stroke in view mode when source node status is FAILED', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.FAILED,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });

  it('renders green stroke in view mode when source node status is STOPPED', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.STOPPED,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });

  it('renders green stroke in view mode when source node status is CANCELED', () => {
    mockGetNodeReturn.current = {
      data: {
        type: NodeType.DECISION,
        status: NodeStatus.CANCELED,
      },
    };
    const { container } = renderEdge({ ...viewModeProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: EDGE_STROKE.executed });
  });
});
