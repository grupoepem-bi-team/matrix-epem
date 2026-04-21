/**
 * Tipos de datos para el Navegador de Documentos BI - EPEM
 *
 * Estructura: Canvas con nodos posicionables + conexiones visuales
 * Estética: Inspirada en n8n (canvas, tarjetas, conexiones bezier)
 * Propósito: Navegación visual de documentos (NO ejecución de workflows)
 */

/** Tipos de nodos permitidos */
export type NodeType = "folder" | "document";

/** Posición en el canvas 2D */
export interface Position {
  x: number;
  y: number;
}

/**
 * Representa un nodo en el canvas.
 * Cada nodo tiene una posición (x, y) y puede tener conexiones visuales.
 */
export interface TreeNode {
  /** Identificador único del nodo */
  id: string;
  /** Nombre visible del nodo */
  name: string;
  /** Tipo de nodo: carpeta o documento */
  type: NodeType;
  /** Descripción del contenido o propósito del nodo */
  description: string;
  /** Nodos hijos (relación jerárquica) */
  children: TreeNode[];
  /** Metadatos adicionales clave-valor (formato, tamaño, autor, etc.) */
  metadata: Record<string, string>;
  /** Fecha de creación en formato ISO 8601 */
  createdAt: string;
  /** Fecha de última modificación en formato ISO 8601 */
  updatedAt: string;
  /** Posición en el canvas (para UI tipo n8n) */
  position?: Position;
  /** Dimensiones del nodo en píxeles (calculado automáticamente) */
  dimensions?: { width: number; height: number };
  /** Estado expandido/colapsado (para carpetas) */
  expanded?: boolean;
}

/**
 * Representa una conexión visual entre dos nodos.
 * Las conexiones son SOLO visuales - no representan flujo de ejecución.
 */
export interface NodeConnection {
  /** Identificador único de la conexión */
  id: string;
  /** ID del nodo origen */
  source: string;
  /** ID del nodo destino */
  target: string;
  /** Tipo de conexión (visual) */
  type: "hierarchy" | "reference";
  /** Fecha de creación */
  createdAt: string;
}

/** Datos necesarios para crear un nuevo nodo */
export interface CreateNodeData {
  name: string;
  type: NodeType;
  description?: string;
  metadata?: Record<string, string>;
  position?: Position;
}

/** Datos para actualizar un nodo existente */
export interface UpdateNodeData {
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
  position?: Position;
  expanded?: boolean;
}

/** Datos para crear una conexión */
export interface CreateConnectionData {
  source: string;
  target: string;
  type?: "hierarchy" | "reference";
}

/** Estado del viewport del canvas */
export interface Viewport {
  /** Factor de zoom (1 = 100%) */
  zoom: number;
  /** Posición del pan (offset X, Y) */
  pan: Position;
}

/** Estado completo del árbol para persistencia */
export interface TreeState {
  /** Nodos raíz del árbol */
  nodes: TreeNode[];
  /** Conexiones entre nodos */
  connections: NodeConnection[];
  /** Viewport del canvas */
  viewport: Viewport;
}
