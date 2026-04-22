/**
 * Barrel file for @/utils — re-exports everything from the tree sub-modules
 * so that existing imports like `import { ... } from "@/utils/tree"` still work.
 *
 * Prefer importing from the specific sub-modules directly:
 *   import { findNodeById } from "@/utils/treeSearch";
 *   import { autoLayout } from "@/utils/treeLayout";
 *   import { createNode } from "@/utils/treeData";
 */

export {
  generateId,
  createNode,
  addNodeToParent,
  addRootNode,
  updateNodeById,
  removeNodeById,
  createDefaultTree,
} from "./treeData";

export {
  NODE_WIDTH,
  NODE_HEIGHT,
  HORIZONTAL_GAP,
  VERTICAL_GAP,
  calcSubtreeHeight,
  autoLayout,
  calculateNewNodePosition,
} from "./treeLayout";

export type { Edge } from "./treeSearch";

export {
  buildNodeMap,
  flattenAll,
  collectEdges,
  findNodeById,
  findParentNode,
  getNodePath,
  searchNodes,
  countNodes,
  countDocuments,
  countFolders,
} from "./treeSearch";
