import { ReactFlow, Background, Controls, ReactFlowProvider } from '@xyflow/react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import { WorkflowNextProps } from '../../types/workflow';
import { useLocale } from '../../hooks/useLocale';
import { LocaleProvider } from '../../contexts/LocaleContext';

const WorkflowCanvasInner = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  mode = 'edit',
  defaultLocale = 'zh-CN',
  ...props
}: WorkflowNextProps) => {
  const { t } = useLocale();
  const isView = mode === 'view';

  return (
    <TooltipPrimitive.Provider delayDuration={500}>
      <div className="w-full h-full bg-gray-50 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.25}
          maxZoom={2}
          nodesDraggable={!isView}
          nodesConnectable={!isView}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}
          {...props}
        >
          <Background color="#E5E7EB" gap={20} />
          <Controls showInteractive={!isView} />

          {(!nodes || nodes.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-gray-400 text-lg font-medium">{t('workflow.canvas.empty')}</div>
            </div>
          )}
        </ReactFlow>
      </div>
    </TooltipPrimitive.Provider>
  );
};

export const WorkflowCanvas = (props: WorkflowNextProps) => {
  return (
    <LocaleProvider defaultLocale={props.defaultLocale}>
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </LocaleProvider>
  );
};

export default WorkflowCanvas;
