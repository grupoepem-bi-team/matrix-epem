import { useCallback } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import type { TreeNode } from "@/types";
import { findNodeById, getNodePath } from "@/utils/tree";

/**
 * Facade hook for tree selection and viewport state.
 * Decouples components from direct store access.
 */
export const useTreeSelection = () => {
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const nodes = useTreeStore((s) => s.nodes);
  const selectNode = useTreeStore((s) => s.selectNode);
  const expandedNodeIds = useTreeStore((s) => s.expandedNodeIds);

  const selectedNode: TreeNode | null = selectedNodeId ? findNodeById(nodes, selectedNodeId) : null;

  const selectedPath = selectedNodeId ? getNodePath(nodes, selectedNodeId) : [];

  const handleSelect = useCallback(
    (id: string | null) => {
      selectNode(id);
    },
    [selectNode],
  );

  return {
    selectedNodeId,
    selectedNode,
    selectedPath,
    expandedNodeIds,
    select: handleSelect,
  };
};
