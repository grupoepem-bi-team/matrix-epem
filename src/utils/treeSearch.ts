import type { TreeNode } from "@/types";

/* ────────────────────────────────────────────── */
/*  Edge type                                   */
/* ────────────────────────────────────────────── */

/** Represents a visual edge (connection) from parent to child. */
export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

/* ────────────────────────────────────────────── */
/*  Node map for O(1) lookups                    */
/* ────────────────────────────────────────────── */

/**
 * Builds a flat Map of id → TreeNode for O(1) lookups.
 * Useful when you need to find nodes by ID repeatedly without
 * walking the tree each time.
 */
export const buildNodeMap = (nodes: TreeNode[]): Map<string, TreeNode> => {
  const map = new Map<string, TreeNode>();
  const walk = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      map.set(node.id, node);
      if (node.children.length > 0) walk(node.children);
    }
  };
  walk(nodes);
  return map;
};

/* ────────────────────────────────────────────── */
/*  Flatten & edge collection                   */
/* ────────────────────────────────────────────── */

/**
 * Flatten every node in the tree (depth-first).
 * Returns a flat array of all TreeNode objects.
 */
export const flattenAll = (nodeList: TreeNode[], out: TreeNode[] = []): TreeNode[] => {
  for (const n of nodeList) {
    out.push(n);
    if (n.children.length > 0) flattenAll(n.children, out);
  }
  return out;
};

/**
 * Collect every parent→child edge in the tree.
 * Returns an array of Edge objects derived from the hierarchy.
 */
export const collectEdges = (nodeList: TreeNode[], out: Edge[] = []): Edge[] => {
  for (const n of nodeList) {
    for (const c of n.children) {
      out.push({ id: `${n.id}→${c.id}`, sourceId: n.id, targetId: c.id });
      collectEdges([c], out);
    }
  }
  return out;
};

/* ────────────────────────────────────────────── */
/*  Tree search & traversal utilities            */
/* ────────────────────────────────────────────── */

/**
 * Find a node by its ID in the tree
 */
export const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Find the parent of a node by the child's ID
 */
export const findParentNode = (nodes: TreeNode[], childId: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.children.some((child) => child.id === childId)) return node;
    if (node.children.length > 0) {
      const found = findParentNode(node.children, childId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get the path from root to a node (breadcrumb trail)
 */
export const getNodePath = (nodes: TreeNode[], id: string): TreeNode[] => {
  const path: TreeNode[] = [];

  const search = (nodeList: TreeNode[], target: string): boolean => {
    for (const node of nodeList) {
      path.push(node);
      if (node.id === target) return true;
      if (node.children.length > 0 && search(node.children, target)) return true;
      path.pop();
    }
    return false;
  };

  search(nodes, id);
  return path;
};

/**
 * Search nodes by name, description, or metadata (case-insensitive)
 */
export const searchNodes = (nodes: TreeNode[], query: string): TreeNode[] => {
  if (!query.trim()) return [];

  const results: TreeNode[] = [];
  const lowerQuery = query.toLowerCase();

  const search = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      const nameMatch = node.name.toLowerCase().includes(lowerQuery);
      const descMatch = node.description.toLowerCase().includes(lowerQuery);
      const metaMatch = Object.values(node.metadata).some((v) =>
        v.toLowerCase().includes(lowerQuery),
      );

      if (nameMatch || descMatch || metaMatch) {
        results.push(node);
      }
      if (node.children.length > 0) {
        search(node.children);
      }
    }
  };

  search(nodes);
  return results;
};

/* ────────────────────────────────────────────── */
/*  Counting utilities                          */
/* ────────────────────────────────────────────── */

/**
 * Count total nodes in the tree
 */
export const countNodes = (nodes: TreeNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children.length > 0) {
      count += countNodes(node.children);
    }
  }
  return count;
};

/**
 * Count documents (leaf nodes) in the tree
 */
export const countDocuments = (nodes: TreeNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "document") count += 1;
    if (node.children.length > 0) {
      count += countDocuments(node.children);
    }
  }
  return count;
};

/**
 * Count folders in the tree
 */
export const countFolders = (nodes: TreeNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "folder") count += 1;
    if (node.children.length > 0) {
      count += countFolders(node.children);
    }
  }
  return count;
};
