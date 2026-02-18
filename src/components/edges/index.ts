import CustomEdge from './CustomEdge';

export const edgeTypes = {
  default: CustomEdge,
  // Also register as 'workflow' type if needed
  workflow: CustomEdge,
};

export { CustomEdge };
