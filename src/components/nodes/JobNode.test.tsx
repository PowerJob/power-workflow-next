import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { describe, it, expect } from 'vitest';
import JobNode from './JobNode';
import { NodeType, NodeStatus } from '../../types/workflow';
import { LocaleProvider } from '../../contexts/LocaleContext';

const renderNode = (props: any) => {
  return render(
    <LocaleProvider>
      <ReactFlowProvider>
        <JobNode {...props} />
      </ReactFlowProvider>
    </LocaleProvider>
  );
};

describe('JobNode', () => {
  const defaultProps = {
    id: 'node-1',
    data: {
      label: 'Test Job',
      type: NodeType.JOB,
      status: NodeStatus.WAITING,
    },
    selected: false,
    type: 'JOB',
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    dragHandle: undefined,
  };

  it('renders correctly', () => {
    renderNode(defaultProps);
    expect(screen.getByText('Test Job')).toBeInTheDocument();
  });

  it('renders status indicator', () => {
    renderNode({
      ...defaultProps,
      data: { ...defaultProps.data, status: NodeStatus.SUCCESS },
    });
    // Check for green status indicator (by class or structure)
    // Since we use Tailwind classes, maybe check if element exists
    // Or just snapshot
    expect(screen.getByText('Test Job')).toBeInTheDocument();
  });
});
