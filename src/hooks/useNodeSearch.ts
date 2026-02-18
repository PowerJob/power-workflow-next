import { useState, useCallback, useMemo } from 'react';
import { WorkflowNode } from '../types/workflow';

interface UseNodeSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchedNodeIds: Set<string>;
  highlightedNodes: WorkflowNode[];
  clearSearch: () => void;
}

export const useNodeSearch = (nodes: WorkflowNode[]): UseNodeSearchResult => {
  const [searchQuery, setSearchQuery] = useState('');

  const matchedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) {
      return new Set<string>();
    }

    const lowerQuery = searchQuery.toLowerCase();
    const matched = new Set<string>();

    nodes.forEach((node) => {
      const name = (node.data?.label || '').toLowerCase();
      const jobId = String(node.data?.jobId || '');
      const instanceId = String(node.data?.instanceId || '');

      if (
        name.includes(lowerQuery) ||
        jobId.includes(lowerQuery) ||
        instanceId.includes(lowerQuery)
      ) {
        matched.add(node.id);
      }
    });

    return matched;
  }, [nodes, searchQuery]);

  const highlightedNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return nodes;
    }

    return nodes.map((node) => ({
      ...node,
      className: matchedNodeIds.has(node.id) ? 'node-highlighted' : 'node-dimmed',
    }));
  }, [nodes, searchQuery, matchedNodeIds]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    matchedNodeIds,
    highlightedNodes,
    clearSearch,
  };
};

export default useNodeSearch;
