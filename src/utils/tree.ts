import type { TreeNode, NodeType } from '../types';

/**
 * Generate a unique ID for new nodes
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

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
    if (node.children.some(child => child.id === childId)) return node;
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
export const addNodeToParent = (nodes: TreeNode[], parentId: string, newNode: TreeNode): TreeNode[] => {
  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, newNode], updatedAt: new Date().toISOString() };
    }
    if (node.children.length > 0) {
      return { ...node, children: addNodeToParent(node.children, parentId, newNode) };
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
export const updateNodeById = (nodes: TreeNode[], id: string, updates: Partial<TreeNode>): TreeNode[] => {
  return nodes.map(node => {
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
 * Remove a node (and its children) by its ID
 */
export const removeNodeById = (nodes: TreeNode[], id: string): TreeNode[] => {
  return nodes
    .filter(node => node.id !== id)
    .map(node => ({
      ...node,
      children: removeNodeById(node.children, id),
    }));
};

/**
 * Search nodes by name or description (case-insensitive)
 */
export const searchNodes = (nodes: TreeNode[], query: string): TreeNode[] => {
  if (!query.trim()) return [];

  const results: TreeNode[] = [];
  const lowerQuery = query.toLowerCase();

  const search = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      const nameMatch = node.name.toLowerCase().includes(lowerQuery);
      const descMatch = node.description.toLowerCase().includes(lowerQuery);
      const metaMatch = Object.values(node.metadata).some(v => v.toLowerCase().includes(lowerQuery));

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
    if (node.type === 'document') count += 1;
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
    if (node.type === 'folder') count += 1;
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
  description: string = '',
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
 * Create the default sample tree for EPEM BI
 */
export const createDefaultTree = (): TreeNode[] => {
  const now = new Date().toISOString();

  const reporteMensual = createNode('Reporte Mensual - KPIs', 'document', 'Reporte mensual de indicadores clave de rendimiento', { formato: 'PDF', tamaño: '2.4 MB' });
  reporteMensual.createdAt = now;
  reporteMensual.updatedAt = now;

  const dashboardEjecutivo = createNode('Dashboard Ejecutivo', 'document', 'Dashboard con métricas ejecutivas del trimestre', { formato: 'PBIX', tamaño: '15.8 MB' });
  dashboardEjecutivo.createdAt = now;
  dashboardEjecutivo.updatedAt = now;

  const reporteTrimestral = createNode('Reporte Trimestral', 'document', 'Análisis comparativo del trimestre', { formato: 'XLSX', tamaño: '5.1 MB' });
  reporteTrimestral.createdAt = now;
  reporteTrimestral.updatedAt = now;

  const reportesFolder = createNode('Reportes', 'folder', 'Reportes periódicos del departamento');
  reportesFolder.children = [reporteMensual, dashboardEjecutivo, reporteTrimestral];
  reportesFolder.createdAt = now;
  reportesFolder.updatedAt = now;

  const etlVentas = createNode('ETL Ventas', 'document', 'Proceso de extracción, transformación y carga de datos de ventas', { formato: 'DOCX', tamaño: '1.2 MB' });
  etlVentas.createdAt = now;
  etlVentas.updatedAt = now;

  const etlRRHH = createNode('ETL Recursos Humanos', 'document', 'Pipeline de integración de datos de RRHH', { formato: 'DOCX', tamaño: '0.8 MB' });
  etlRRHH.createdAt = now;
  etlRRHH.updatedAt = now;

  const etlFolder = createNode('Procesos ETL', 'folder', 'Documentación de procesos ETL');
  etlFolder.children = [etlVentas, etlRRHH];
  etlFolder.createdAt = now;
  etlFolder.updatedAt = now;

  const modeloStar = createNode('Modelo Star - Ventas', 'document', 'Esquema en estrella para el área de ventas', { formato: 'PPTX', tamaño: '3.7 MB' });
  modeloStar.createdAt = now;
  modeloStar.updatedAt = now;

  const modelosFolder = createNode('Modelos de Datos', 'folder', 'Modelos y diagramas de datos');
  modelosFolder.children = [modeloStar];
  modelosFolder.createdAt = now;
  modelosFolder.updatedAt = now;

  const diccionarioDatos = createNode('Diccionario de Datos', 'document', 'Glosario de campos y tablas del datawarehouse', { formato: 'PDF', tamaño: '1.5 MB' });
  diccionarioDatos.createdAt = now;
  diccionarioDatos.updatedAt = now;

  const documentacionFolder = createNode('Documentación', 'folder', 'Documentación técnica general');
  documentacionFolder.children = [diccionarioDatos];
  documentacionFolder.createdAt = now;
  documentacionFolder.updatedAt = now;

  const rootFolder = createNode('Departamento BI', 'folder', 'Documentos del Departamento de Business Intelligence');
  rootFolder.children = [reportesFolder, etlFolder, modelosFolder, documentacionFolder];
  rootFolder.createdAt = now;
  rootFolder.updatedAt = now;

  return [rootFolder];
};
