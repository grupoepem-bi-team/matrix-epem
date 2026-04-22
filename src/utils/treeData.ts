import type { TreeNode, NodeType } from "@/types";
import { autoLayout } from "./treeLayout";

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
/*  Node creation                               */
/* ────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────── */
/*  Tree CRUD operations                         */
/* ────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────── */
/*  Default tree                                */
/* ────────────────────────────────────────────── */

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
