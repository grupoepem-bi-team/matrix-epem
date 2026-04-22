import type { TreeNode, Position } from "@/types";
import { findNodeById } from "./treeSearch";

/* ────────────────────────────────────────────── */
/*  Layout constants (horizontal L→R flow)      */
/* ────────────────────────────────────────────── */

/** Node width — must match NodeCard component */
export const NODE_WIDTH = 220;
/** Node height — must match NodeCard component */
export const NODE_HEIGHT = 80;

/** Horizontal gap between depth levels (parent → child) */
export const HORIZONTAL_GAP = 80;
/** Vertical gap between sibling nodes */
export const VERTICAL_GAP = 30;

/* ────────────────────────────────────────────── */
/*  Auto-layout (horizontal left → right)       */
/* ────────────────────────────────────────────── */

/**
 * Calculates the total **vertical** height a subtree needs
 * (node + all descendants stacked vertically).
 *
 * In a horizontal L→R layout:
 * - X axis represents depth (parent on the left, children to the right)
 * - Y axis represents sibling stacking (siblings arranged top-to-bottom)
 *
 * A leaf node occupies NODE_HEIGHT vertically.
 * A parent node occupies the sum of its children's subtree heights
 * plus VERTICAL_GAP between each pair of siblings.
 */
export const calcSubtreeHeight = (node: TreeNode): number => {
  if (node.children.length === 0) return NODE_HEIGHT;

  const childrenHeight =
    node.children.reduce((sum, child) => sum + calcSubtreeHeight(child), 0) +
    VERTICAL_GAP * (node.children.length - 1);

  return Math.max(NODE_HEIGHT, childrenHeight);
};

/**
 * Recalculates ALL node positions in a horizontal L→R layout.
 *
 * ⚠️ Use sparingly! This DESTROYS any manually-set positions.
 * Only call this for:
 * - Initial layout (in createDefaultTree)
 * - Reset to default (in resetToDefault)
 * - Explicit "Reorganize" user action
 *
 * Do NOT call this after every create/delete operation.
 */
export const autoLayout = (nodes: TreeNode[], x0 = 80, y0 = 40): TreeNode[] => {
  let yCursor = y0;

  return nodes.map((node) => {
    const subtreeH = calcSubtreeHeight(node);

    // Center the node vertically within its subtree allocation
    const nodeX = x0;
    const nodeY = yCursor + (subtreeH - NODE_HEIGHT) / 2;

    // Children are one depth level to the right
    const childX = nodeX + NODE_WIDTH + HORIZONTAL_GAP;

    const positioned: TreeNode = {
      ...node,
      position: { x: nodeX, y: nodeY },
      children: autoLayout(node.children, childX, yCursor),
    };

    // Advance cursor past this subtree + the sibling gap
    yCursor += subtreeH + VERTICAL_GAP;

    return positioned;
  });
};

/* ────────────────────────────────────────────── */
/*  New-node position calculation                */
/* ────────────────────────────────────────────── */

/**
 * Calculates where a NEW node should be placed, WITHOUT recalculating
 * all existing positions. This preserves manually-dragged positions.
 *
 * - If parentId is given, the new child is placed to the right of the parent,
 *   below the bottom of any existing siblings.
 * - If no parentId, the new root node is placed below the last root node.
 */
export const calculateNewNodePosition = (nodes: TreeNode[], parentId?: string): Position => {
  // If parentId is provided, find the parent and position the new child
  if (parentId) {
    const parent = findNodeById(nodes, parentId);
    if (parent) {
      if (parent.children.length === 0) {
        // First child: place to the right of parent, vertically centered
        return {
          x: parent.position!.x + NODE_WIDTH + HORIZONTAL_GAP,
          y: parent.position!.y,
        };
      } else {
        // Place below the last child
        // Check if there are siblings below — find the max Y of all siblings
        const maxY = parent.children.reduce((max, child) => {
          if (child.position) {
            const subtreeH = calcSubtreeHeight(child);
            return Math.max(max, child.position.y + subtreeH);
          }
          return max;
        }, -Infinity);
        return {
          x: parent.position!.x + NODE_WIDTH + HORIZONTAL_GAP,
          y: maxY !== -Infinity ? maxY + VERTICAL_GAP : parent.position!.y,
        };
      }
    }
  }

  // Root node: place below the last root node
  if (nodes.length === 0) {
    return { x: 80, y: 40 };
  }
  const maxY = nodes.reduce((max, node) => {
    if (node.position) {
      const subtreeH = calcSubtreeHeight(node);
      return Math.max(max, node.position.y + subtreeH);
    }
    return max;
  }, -Infinity);
  return {
    x: 80,
    y: maxY !== -Infinity ? maxY + VERTICAL_GAP : 40,
  };
};
