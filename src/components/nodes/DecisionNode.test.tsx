import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { describe, it, expect } from 'vitest';
import DecisionNode from './DecisionNode';
import { NodeType, NodeStatus } from '../../types/workflow';
import { LocaleProvider } from '../../contexts/LocaleContext';

const renderNode = (props: any) => {
  return render(
    <LocaleProvider>
      <ReactFlowProvider>
        <DecisionNode {...props} />
      </ReactFlowProvider>
    </LocaleProvider>
  );
};

describe('DecisionNode', () => {
  const defaultProps = {
    id: 'node-2',
    data: {
      label: 'Check',
      type: NodeType.DECISION,
      status: NodeStatus.RUNNING,
    },
    selected: false,
    type: 'DECISION',
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    dragHandle: undefined,
  };

  it('renders correctly', () => {
    renderNode(defaultProps);
    expect(screen.getByText('Check')).toBeInTheDocument();
  });
});
