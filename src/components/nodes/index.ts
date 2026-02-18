import JobNode from './JobNode';
import DecisionNode from './DecisionNode';
import NestedWorkflowNode from './NestedWorkflowNode';
import { NodeType } from '../../types/workflow';

export const nodeTypes = {
  [NodeType.JOB]: JobNode,
  [NodeType.DECISION]: DecisionNode,
  [NodeType.NESTED_WORKFLOW]: NestedWorkflowNode,
};

export { JobNode, DecisionNode, NestedWorkflowNode };
