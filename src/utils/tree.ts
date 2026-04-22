import type { TreeNode, NodeType } from "../types";

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
 * Recursively assigns (x, y) positions to every node so the whole tree
 * is laid out **horizontally left-to-right** (like n8n's workflow editor).
 *
 * - Root node starts on the LEFT
 * - Children flow to the RIGHT
 * - Siblings are stacked VERTICALLY with VERTICAL_GAP between them
 * - Depth levels are separated by (NODE_WIDTH + HORIZONTAL_GAP)
 * - Each parent is centered vertically within its subtree space
 *
 * @param nodes  - list of sibling nodes at the same depth level
 * @param x0     - left edge X coordinate where this group starts
 * @param y0     - top edge Y coordinate where this group starts
 * @returns A new array of TreeNode objects with `position` set
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
/*  Tree utility functions                       */
/* ────────────────────────────────────────────── */

/**
 * Generate a unique ID for new nodes
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Find a node by its ID in the tree
 */
export const findNodeById = (
  nodes: TreeNode[],
  id: string,
): TreeNode | null => {
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
export const findParentNode = (
  nodes: TreeNode[],
  childId: string,
): TreeNode | null => {
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
      if (node.children.length > 0 && search(node.children, target))
        return true;
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
export const addRootNode = (
  nodes: TreeNode[],
  newNode: TreeNode,
): TreeNode[] => {
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
  const reportesFolder = createNode(
    "Reportes",
    "folder",
    "Reportes periódicos del departamento",
  );
  reportesFolder.children = [
    reporteMensual,
    dashboardEjecutivo,
    reporteTrimestral,
  ];

  const etlFolder = createNode(
    "Procesos ETL",
    "folder",
    "Documentación de procesos ETL",
  );
  etlFolder.children = [etlVentas, etlRRHH];

  const modelosFolder = createNode(
    "Modelos de Datos",
    "folder",
    "Modelos y diagramas de datos",
  );
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
  rootNode.children = [
    reportesFolder,
    etlFolder,
    modelosFolder,
    documentacionFolder,
  ];

  // Apply horizontal L→R auto-layout to assign positions
  return autoLayout([rootNode]);
};
