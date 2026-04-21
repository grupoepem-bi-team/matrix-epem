/**
 * Tipos de datos para el Navegador de Documentos BI - EPEM
 *
 * Estructura: Árbol jerárquico de carpetas y documentos
 * Estética: Inspirada en n8n (solo visual)
 * Comportamiento: Navegación jerárquica
 */

/** Tipos de nodos permitidos en el árbol */
export type NodeType = 'folder' | 'document';

/**
 * Representa un nodo en el árbol jerárquico.
 *
 * - Carpeta: puede contener hijos (children)
 * - Documento: nodo hoja, sin hijos
 *
 * Regla canónica: La estructura es un árbol.
 * No se permiten conexiones entre nodos.
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
  /** Nodos hijos (solo carpetas tienen hijos significativos) */
  children: TreeNode[];
  /** Metadatos adicionales clave-valor (formato, tamaño, autor, etc.) */
  metadata: Record<string, string>;
  /** Fecha de creación en formato ISO 8601 */
  createdAt: string;
  /** Fecha de última modificación en formato ISO 8601 */
  updatedAt: string;
}

/** Datos necesarios para crear un nuevo nodo */
export interface CreateNodeData {
  name: string;
  type: NodeType;
  description?: string;
  metadata?: Record<string, string>;
}

/** Campos editables de un nodo existente */
export interface UpdateNodeData {
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
}
