import { render } from '@testing-library/react';
import { MarkerType, ReactFlowProvider } from '@xyflow/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomEdge from '@/components/edges/CustomEdge';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { NodeType } from '@/types/workflow';

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

describe('CustomEdge', () => {
  beforeEach(() => {
    mockGetNodeReturn.current = { data: { type: NodeType.DECISION } };
  });

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

  it('renders green stroke when property is true', () => {
    const { container } = renderEdge(defaultProps);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: '#52C41A' });
  });

  it('renders red stroke when property is false', () => {
    const { container } = renderEdge({ ...defaultProps, data: { property: 'false' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: '#EF4444' });
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
    expect(path).toHaveStyle({ stroke: '#52C41A' });
    expect(path).toHaveAttribute('marker-end');
  });

  it('uses property-based stroke when source is decision node', () => {
    mockGetNodeReturn.current = { data: { type: NodeType.DECISION } };
    const { container } = renderEdge(defaultProps);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: '#52C41A' });
  });

  it('does not render property button and uses neutral stroke when source is not decision node', () => {
    mockGetNodeReturn.current = { data: { type: NodeType.JOB } };
    const { container } = renderEdge({ ...defaultProps, data: { property: 'true' } });
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: '#94A3B8' });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  it('does not render property button when source node is missing', () => {
    mockGetNodeReturn.current = undefined;
    const { container } = renderEdge(defaultProps);
    const path = container.querySelector('.react-flow__edge-path');
    expect(path).toHaveStyle({ stroke: '#94A3B8' });
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
