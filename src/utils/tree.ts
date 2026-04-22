import type { TreeNode, NodeType, Position } from "../types";

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
/*  ID generation                               */
/* ────────────────────────────────────────────── */

/**
 * Generate a unique ID for new nodes.
 * Uses crypto.randomUUID() when available (secure contexts),
 * falls back to a v4 UUID implementation for HTTP contexts.
 */
export const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === "x" ? 0 : 4);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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

/** Represents a visual edge (connection) from parent to child. */
export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

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
/*  Tree utility functions                       */
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
 * Add a new node as a child of the specified parent
 */
export const addNodeToParent = (
  nodes: TreeNode[],
  parentId: string,
  newNode: TreeNode,
): TreeNode[] => {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, newNode],
        updatedAt: new Date().toISOString(),
      };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: addNodeToParent(node.children, parentId, newNode),
      };
    }
    return node;
  });
};

/**
 * Add a new node at the root level
 */
export const addRootNode = (nodes: TreeNode[], newNode: TreeNode): TreeNode[] => {
  return [...nodes, newNode];
};

/**
 * Update a node's properties by its ID
 */
export const updateNodeById = (
  nodes: TreeNode[],
  id: string,
  updates: Partial<TreeNode>,
): TreeNode[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates, updatedAt: new Date().toISOString() };
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeById(node.children, id, updates) };
    }
    return node;
  });
};

/**
 * Remove a node (and its subtree) by its ID
 */
export const removeNodeById = (nodes: TreeNode[], id: string): TreeNode[] => {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: removeNodeById(node.children, id),
    }));
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

/**
 * Create a new TreeNode with defaults
 */
export const createNode = (
  name: string,
  type: NodeType,
  description: string = "",
  metadata: Record<string, string> = {},
): TreeNode => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    type,
    description,
    children: [],
    metadata,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Create the default sample tree for EPEM BI.
 *
 * Structure (horizontal L→R flow):
 *
 *   Departamento BI ──┬── Reportes ──────────┬── Reporte Mensual - KPIs
 *                     │                      ├── Dashboard Ejecutivo
 *                     │                      └── Reporte Trimestral
 *                     ├── Procesos ETL ──────┬── ETL Ventas
 *                     │                      └── ETL Recursos Humanos
 *                     ├── Modelos de Datos ──── Modelo Star - Ventas
 *                     └── Documentación ──────── Diccionario de Datos
 *
 * The root "Departamento BI" acts as the entry point (like n8n's trigger node).
 * Positions are assigned via autoLayout() after construction.
 */
export const createDefaultTree = (): TreeNode[] => {
  // ── Level 2: Documents under "Reportes" ──
  const reporteMensual = createNode(
    "Reporte Mensual - KPIs",
    "document",
    "Reporte mensual de indicadores clave de rendimiento",
    { formato: "PDF", tamaño: "2.4 MB" },
  );

  const dashboardEjecutivo = createNode(
    "Dashboard Ejecutivo",
    "document",
    "Dashboard con métricas ejecutivas del trimestre",
    { formato: "PBIX", tamaño: "15.8 MB" },
  );

  const reporteTrimestral = createNode(
    "Reporte Trimestral",
    "document",
    "Análisis comparativo del trimestre",
    { formato: "XLSX", tamaño: "5.1 MB" },
  );

  // ── Level 2: Documents under "Procesos ETL" ──
  const etlVentas = createNode(
    "ETL Ventas",
    "document",
    "Proceso de extracción, transformación y carga de datos de ventas",
    { formato: "DOCX", tamaño: "1.2 MB" },
  );

  const etlRRHH = createNode(
    "ETL Recursos Humanos",
    "document",
    "Pipeline de integración de datos de RRHH",
    { formato: "DOCX", tamaño: "0.8 MB" },
  );

  // ── Level 2: Documents under "Modelos de Datos" ──
  const modeloStar = createNode(
    "Modelo Star - Ventas",
    "document",
    "Esquema en estrella para el área de ventas",
    { formato: "PPTX", tamaño: "3.7 MB" },
  );

  // ── Level 2: Documents under "Documentación" ──
  const diccionarioDatos = createNode(
    "Diccionario de Datos",
    "document",
    "Glosario de campos y tablas del datawarehouse",
    { formato: "PDF", tamaño: "1.5 MB" },
  );

  // ── Level 1: Category folders ──
  const reportesFolder = createNode("Reportes", "folder", "Reportes periódicos del departamento");
  reportesFolder.children = [reporteMensual, dashboardEjecutivo, reporteTrimestral];

  const etlFolder = createNode("Procesos ETL", "folder", "Documentación de procesos ETL");
  etlFolder.children = [etlVentas, etlRRHH];

  const modelosFolder = createNode("Modelos de Datos", "folder", "Modelos y diagramas de datos");
  modelosFolder.children = [modeloStar];

  const documentacionFolder = createNode(
    "Documentación",
    "folder",
    "Documentación técnica general",
  );
  documentacionFolder.children = [diccionarioDatos];

  // ── Level 0: Root entry point (like n8n's trigger node) ──
  const rootNode = createNode(
    "Departamento BI",
    "folder",
    "Documentos del Departamento de Business Intelligence",
  );
  rootNode.children = [reportesFolder, etlFolder, modelosFolder, documentacionFolder];

  // Apply horizontal L→R auto-layout to assign positions
  return autoLayout([rootNode]);
};
