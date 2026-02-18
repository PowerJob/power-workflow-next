import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { describe, it, expect } from 'vitest';
import CustomEdge from './CustomEdge';
import { LocaleProvider } from '../../contexts/LocaleContext';

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
});
