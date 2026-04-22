/**
 * Tipos de datos para el Navegador de Documentos BI - EPEM
 *
 * Estructura: Canvas con nodos posicionables + conexiones derivadas
 * Estética: Inspirada en n8n (canvas, tarjetas, conexiones bezier)
 * Layout: Flujo horizontal izquierda → derecha
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
 * Cada nodo tiene una posición (x, y) y puede tener hijos.
 * Las conexiones visuales se derivan de la relación padre → hijos.
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
  /** Nodos hijos (relación jerárquica - de aquí se derivan las conexiones) */
  children: TreeNode[];
  /** Metadatos adicionales clave-valor (formato, tamaño, autor, etc.) */
  metadata: Record<string, string>;
  /** Fecha de creación en formato ISO 8601 */
  createdAt: string;
  /** Fecha de última modificación en formato ISO 8601 */
  updatedAt: string;
  /** Posición en el canvas (para UI tipo n8n, layout horizontal L→R) */
  position?: Position;
  /** Dimensiones del nodo en píxeles (calculado automáticamente) */
  dimensions?: { width: number; height: number };
  /** Estado expandido/colapsado (para carpetas) */
  expanded?: boolean;
}

/**
 * Conexión visual derivada de la jerarquía padre → hijo.
 * Se genera automáticamente a partir de TreeNode.children.
 * No se crea ni se elimina independientemente.
 */
export interface NodeConnection {
  /** ID del nodo padre (origen - lado izquierdo) */
  source: string;
  /** ID del nodo hijo (destino - lado derecho) */
  target: string;
}

/** Datos necesarios para crear un nuevo nodo */
export interface CreateNodeData {
  name: string;
  type: NodeType;
  description?: string;
  metadata?: Record<string, string>;
  position?: Position;
  parentId?: string;
}

/** Datos para actualizar un nodo existente */
export interface UpdateNodeData {
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
  position?: Position;
  expanded?: boolean;
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
  /** Nodos raíz del árbol (normalmente un solo root como entry point) */
  nodes: TreeNode[];
  /** Viewport del canvas */
  viewport: Viewport;
}
