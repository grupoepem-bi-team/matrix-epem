import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TreeNode,
  CreateNodeData,
  UpdateNodeData,
  Position,
  Viewport,
} from "../types";
import {
  addNodeToParent,
  addRootNode,
  updateNodeById,
  removeNodeById,
  searchNodes,
  createDefaultTree,
  createNode,
  getNodePath,
  autoLayout,
  calculateNewNodePosition,
} from "../utils/tree";

/* ────────────────────────────────────────────── */
/*  State shape                                  */
/* ────────────────────────────────────────────── */

/**
 * Store state for the tree.
 *
 * NOTE: Connections are NOT stored here. They are derived on-the-fly
 * from the parent→child hierarchy (see Canvas.collectEdges).
 * This means every TreeNode.children relationship implicitly defines
 * a NodeConnection { source: parentId, target: childId }.
 */
interface TreeState {
  /** Root-level nodes of the tree */
  nodes: TreeNode[];
  /** ID of the currently selected node (null = none) */
  selectedNodeId: string | null;
  /** IDs of currently expanded folder nodes */
  expandedNodeIds: string[];
  /** Current search query string */
  searchQuery: string;
  /** Cached search results – recomputed whenever query or nodes change */
  searchResults: TreeNode[];
  /** Viewport state for canvas (zoom & pan) */
  viewport: Viewport;
}

/* ────────────────────────────────────────────── */
/*  Actions                                      */
/* ────────────────────────────────────────────── */

interface TreeActions {
  /** Select a node by ID (or deselect with null) */
  selectNode: (id: string | null) => void;
  /** Toggle the expand / collapse state of a folder */
  toggleExpand: (id: string) => void;
  /** Expand a single node */
  expandNode: (id: string) => void;
  /** Collapse a single node */
  collapseNode: (id: string) => void;
  /** Expand all ancestor nodes leading to a given node */
  expandToNode: (id: string) => void;
  /** Expand all folder nodes in the tree */
  expandAll: () => void;
  /** Collapse all folder nodes */
  collapseAll: () => void;
  /** Create a new node as a child of the given parent */
  createChildNode: (parentId: string, data: CreateNodeData) => void;
  /** Create a new node at the root level */
  createRootNode: (data: CreateNodeData) => void;
  /** Update properties of an existing node */
  updateNode: (id: string, data: UpdateNodeData) => void;
  /** Delete a node (and all its children) */
  deleteNode: (id: string) => void;
  /** Update the search query and recompute results */
  setSearchQuery: (query: string) => void;
  /** Clear the search */
  clearSearch: () => void;
  /** Reset the entire tree to the default sample data */
  resetToDefault: () => void;
  /** Reorganize all node positions (destructive — resets manual positions) */
  reorganizeLayout: () => void;
  /** Update viewport (zoom & pan) */
  updateViewport: (viewport: Partial<Viewport>) => void;
  /** Update node position (after drag in canvas) */
  updateNodePosition: (nodeId: string, position: Position) => void;
}

/* ────────────────────────────────────────────── */
/*  Helpers                                      */
/* ────────────────────────────────────────────── */

/** Recompute search results from nodes + query */
const computeSearchResults = (nodes: TreeNode[], query: string): TreeNode[] => {
  if (!query.trim()) return [];
  return searchNodes(nodes, query);
};

/**
 * Walk the tree and collect all folder IDs.
 * Used by expandAll, resetToDefault, and onRehydrateStorage
 * to auto-expand every folder.
 */
const collectFolderIds = (nodes: TreeNode[]): string[] => {
  const ids: string[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.type === "folder") ids.push(n.id);
      if (n.children.length > 0) walk(n.children);
    }
  };
  walk(nodes);
  return ids;
};

/** Check if any node in the tree lacks a position */
const checkIfNodesNeedLayout = (nodes: TreeNode[]): boolean => {
  const walk = (list: TreeNode[]): boolean => {
    for (const node of list) {
      if (!node.position) return true;
      if (node.children.length > 0 && walk(node.children)) return true;
    }
    return false;
  };
  return walk(nodes);
};

/* ────────────────────────────────────────────── */
/*  Store                                        */
/* ────────────────────────────────────────────── */

export const useTreeStore = create<TreeState & TreeActions>()(
  persist(
    (set, get) => ({
      /* ── Initial state ── */
      nodes: [],
      selectedNodeId: null,
      expandedNodeIds: [],
      searchQuery: "",
      searchResults: [],
      viewport: { zoom: 1, pan: { x: 0, y: 0 } },

      /* ── Selection ── */
      selectNode: (id) => {
        set({ selectedNodeId: id });
        // When selecting via search result, expand ancestors
        if (id) {
          const state = get();
          const path = getNodePath(state.nodes, id);
          const ancestorIds = path.slice(0, -1).map((n) => n.id);
          const newExpanded = Array.from(
            new Set([...state.expandedNodeIds, ...ancestorIds]),
          );
          set({ expandedNodeIds: newExpanded });
        }
      },

      /* ── Expand / Collapse ── */
      toggleExpand: (id) => {
        const { expandedNodeIds } = get();
        const isExpanded = expandedNodeIds.includes(id);
        if (isExpanded) {
          set({ expandedNodeIds: expandedNodeIds.filter((eid) => eid !== id) });
        } else {
          set({ expandedNodeIds: [...expandedNodeIds, id] });
        }
      },

      expandNode: (id) => {
        const { expandedNodeIds } = get();
        if (!expandedNodeIds.includes(id)) {
          set({ expandedNodeIds: [...expandedNodeIds, id] });
        }
      },

      collapseNode: (id) => {
        const { expandedNodeIds } = get();
        set({ expandedNodeIds: expandedNodeIds.filter((eid) => eid !== id) });
      },

      expandToNode: (id) => {
        const state = get();
        const path = getNodePath(state.nodes, id);
        const ancestorIds = path.slice(0, -1).map((n) => n.id);
        const newExpanded = Array.from(
          new Set([...state.expandedNodeIds, ...ancestorIds]),
        );
        set({ expandedNodeIds: newExpanded });
      },

      expandAll: () => {
        const { nodes } = get();
        set({ expandedNodeIds: collectFolderIds(nodes) });
      },

      collapseAll: () => {
        set({ expandedNodeIds: [] });
      },

      /* ── CRUD ── */
      createChildNode: (parentId, data) => {
        const newNode = createNode(
          data.name,
          data.type,
          data.description,
          data.metadata,
        );
        const { nodes, expandedNodeIds } = get();

        // Calculate position for the new node based on its parent and siblings
        newNode.position = calculateNewNodePosition(nodes, parentId);

        const withChild = addNodeToParent(nodes, parentId, newNode);
        const newExpanded = expandedNodeIds.includes(parentId)
          ? expandedNodeIds
          : [...expandedNodeIds, parentId];
        set({
          nodes: withChild,
          expandedNodeIds: newExpanded,
          selectedNodeId: newNode.id,
          searchResults: computeSearchResults(withChild, get().searchQuery),
        });
      },

      createRootNode: (data) => {
        const newNode = createNode(
          data.name,
          data.type,
          data.description,
          data.metadata,
        );
        const { nodes } = get();

        // Calculate position for the new root node
        newNode.position = calculateNewNodePosition(nodes);

        const withRoot = addRootNode(nodes, newNode);
        set({
          nodes: withRoot,
          selectedNodeId: newNode.id,
          searchResults: computeSearchResults(withRoot, get().searchQuery),
        });
      },

      updateNode: (id, data) => {
        const { nodes } = get();
        const updates: Partial<TreeNode> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined)
          updates.description = data.description;
        if (data.metadata !== undefined) updates.metadata = data.metadata;
        const updatedNodes = updateNodeById(nodes, id, updates);
        set({
          nodes: updatedNodes,
          searchResults: computeSearchResults(updatedNodes, get().searchQuery),
        });
      },

      deleteNode: (id) => {
        const { nodes, selectedNodeId } = get();
        const removed = removeNodeById(nodes, id);
        // NO autoLayout — positions stay as they are
        const newSelectedId = selectedNodeId === id ? null : selectedNodeId;
        set({
          nodes: removed,
          selectedNodeId: newSelectedId,
          searchResults: computeSearchResults(removed, get().searchQuery),
        });
      },

      /* ── Search ── */
      setSearchQuery: (query) => {
        const { nodes } = get();
        const results = computeSearchResults(nodes, query);
        set({ searchQuery: query, searchResults: results });
      },

      clearSearch: () => {
        set({ searchQuery: "", searchResults: [] });
      },

      /* ── Viewport ── */
      updateViewport: (viewportUpdate) => {
        set((state) => ({
          viewport: { ...state.viewport, ...viewportUpdate },
        }));
      },

      /* ── Node position (updated after canvas drag) ── */
      updateNodePosition: (nodeId, position) => {
        const { nodes } = get();
        const updatedNodes = updateNodeById(nodes, nodeId, { position });
        set({ nodes: updatedNodes });
      },

      /* ── Reorganize layout (destructive — resets all manual positions) ── */
      reorganizeLayout: () => {
        const { nodes } = get();
        const layouted = autoLayout(nodes);
        set({ nodes: layouted });
      },

      /* ── Reset ──
         createDefaultTree() already applies autoLayout() internally,
         so we don't need to call it again here. */
      resetToDefault: () => {
        const defaultNodes = createDefaultTree();
        const allFolderIds = collectFolderIds(defaultNodes);
        set({
          nodes: defaultNodes,
          selectedNodeId: null,
          expandedNodeIds: allFolderIds,
          searchQuery: "",
          searchResults: [],
          viewport: { zoom: 1, pan: { x: 0, y: 0 } },
        });
      },
    }),
    {
      name: "matrix-epem-tree-v3",
      version: 1,
      // Only persist the core data, not transient UI state like search
      partialize: (state) => ({
        nodes: state.nodes,
        selectedNodeId: state.selectedNodeId,
        expandedNodeIds: state.expandedNodeIds,
      }),
      // Migration: if we detect old data format, reset to defaults
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Version 0 had the old layout with autoLayout on every CRUD
          // Reset to fresh data with new layout
          const defaultNodes = createDefaultTree();
          return {
            ...persistedState,
            nodes: defaultNodes,
            expandedNodeIds: collectFolderIds(defaultNodes),
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state && state.nodes.length === 0) {
          // createDefaultTree() already includes layout (autoLayout called internally)
          const defaultNodes = createDefaultTree();
          state.nodes = defaultNodes;
          state.expandedNodeIds = collectFolderIds(defaultNodes);
        } else if (state) {
          // Re-apply layout only if nodes exist but may lack positions
          // Only if a node has no position at all
          const needsLayout = checkIfNodesNeedLayout(state.nodes);
          if (needsLayout) {
            state.nodes = autoLayout(state.nodes);
          }
        }
      },
    },
  ),
);
