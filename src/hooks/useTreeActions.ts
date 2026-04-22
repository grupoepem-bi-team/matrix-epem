import { useCallback } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import type { CreateNodeData, UpdateNodeData } from "@/types";

/**
 * Facade hook for tree CRUD operations.
 * Decouples components from direct store access.
 */
export const useTreeActions = () => {
  const createChildNode = useTreeStore((s) => s.createChildNode);
  const createRootNode = useTreeStore((s) => s.createRootNode);
  const updateNode = useTreeStore((s) => s.updateNode);
  const deleteNode = useTreeStore((s) => s.deleteNode);
  const reorganizeLayout = useTreeStore((s) => s.reorganizeLayout);
  const resetToDefault = useTreeStore((s) => s.resetToDefault);

  const handleCreateChild = useCallback(
    (parentId: string, data: CreateNodeData) => {
      createChildNode(parentId, data);
    },
    [createChildNode],
  );

  const handleCreateRoot = useCallback(
    (data: CreateNodeData) => {
      createRootNode(data);
    },
    [createRootNode],
  );

  const handleUpdate = useCallback(
    (id: string, data: UpdateNodeData) => {
      updateNode(id, data);
    },
    [updateNode],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNode(id);
    },
    [deleteNode],
  );

  const handleReorganize = useCallback(() => {
    reorganizeLayout();
  }, [reorganizeLayout]);

  const handleReset = useCallback(() => {
    resetToDefault();
  }, [resetToDefault]);

  return {
    createChild: handleCreateChild,
    createRoot: handleCreateRoot,
    update: handleUpdate,
    delete: handleDelete,
    reorganize: handleReorganize,
    reset: handleReset,
  };
};
