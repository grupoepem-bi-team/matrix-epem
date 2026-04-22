/**
 * Node Type Registry — Extensible type system for the canvas.
 *
 * Each node type defines its visual appearance (colors, icon, labels)
 * and behavioral properties (whether it can have children, etc.).
 *
 * To add a new node type:
 *   1. Add the string literal to the `NodeType` union in `@/types`
 *   2. Call `registerNodeType()` with the desired configuration
 *   3. The type will automatically appear in create/edit dialogs
 *      and be rendered with the correct visual style
 */

import { Folder, FileText, type LucideIcon } from "lucide-react";
import type { TreeNode } from "@/types";

/* ────────────────────────────────────────────── */
/*  Node type configuration interface            */
/* ────────────────────────────────────────────── */

export interface NodeTypeConfig {
  /** Unique type key — must match a value in the NodeType union */
  type: string;
  /** Human-readable label (Spanish) */
  label: string;
  /** Lucide icon component rendered in NodeCard and NodeDetail */
  icon: LucideIcon;
  /** Primary accent color (hex string) */
  color: string;
  /** Node icon background (CSS value, typically rgba) */
  iconBg: string;
  /** Left stripe color (hex string) — usually same as `color` */
  stripeColor: string;
  /** Port color when the node is hovered or selected (hex string) */
  portColor: string;
  /** Port color for unselected/neutral state (with opacity) */
  portColorMuted: string;
  /** Badge CSS class (e.g., "n8n-badge n8n-badge--folder") */
  badgeClass: string;
  /** Whether this node type can have children */
  canHaveChildren: boolean;
  /** Function to derive the subtitle text for a node of this type */
  getSubtitle: (node: TreeNode) => string;
}

/* ────────────────────────────────────────────── */
/*  Registry store                               */
/* ────────────────────────────────────────────── */

const registry = new Map<string, NodeTypeConfig>();

/* ────────────────────────────────────────────── */
/*  Registry API                                 */
/* ────────────────────────────────────────────── */

/**
 * Register a new node type configuration.
 * If a type with the same key is already registered, it will be overwritten.
 */
export function registerNodeType(config: NodeTypeConfig): void {
  registry.set(config.type, config);
}

/**
 * Look up a node type configuration by its type key.
 * Returns `undefined` if the type is not registered.
 */
export function getNodeTypeConfig(type: string): NodeTypeConfig | undefined {
  return registry.get(type);
}

/**
 * Get all registered node type configurations.
 * Useful for rendering type selectors in create/edit dialogs.
 */
export function getAllNodeTypeConfigs(): NodeTypeConfig[] {
  return Array.from(registry.values());
}

/**
 * Check if a node type is registered.
 */
export function isNodeTypeRegistered(type: string): boolean {
  return registry.has(type);
}

/* ────────────────────────────────────────────── */
/*  Default fallback config                      */
/* ────────────────────────────────────────────── */

/** Fallback configuration for unknown/unregistered node types */
const DEFAULT_CONFIG: Omit<NodeTypeConfig, "type"> = {
  label: "Desconocido",
  icon: FileText,
  color: "#7878a0",
  iconBg: "rgba(120, 120, 160, 0.18)",
  stripeColor: "#7878a0",
  portColor: "#7878a0",
  portColorMuted: "rgba(120, 120, 160, 0.45)",
  badgeClass: "n8n-badge n8n-badge--document",
  canHaveChildren: false,
  getSubtitle: () => "Nodo",
};

/**
 * Get a node type config with a safe fallback.
 * If the type is not registered, returns a default config with
 * the requested type key preserved.
 */
export function getNodeTypeConfigOrDefault(type: string): NodeTypeConfig {
  return registry.get(type) ?? { ...DEFAULT_CONFIG, type };
}

/* ────────────────────────────────────────────── */
/*  Built-in node types                          */
/* ────────────────────────────────────────────── */

registerNodeType({
  type: "folder",
  label: "Carpeta",
  icon: Folder,
  color: "#ffb74d",
  iconBg: "rgba(255, 183, 77, 0.18)",
  stripeColor: "#ffb74d",
  portColor: "#ffb74d",
  portColorMuted: "rgba(255, 183, 77, 0.45)",
  badgeClass: "n8n-badge n8n-badge--folder",
  canHaveChildren: true,
  getSubtitle: (node) =>
    `${node.children.length} elemento${node.children.length !== 1 ? "s" : ""}`,
});

registerNodeType({
  type: "document",
  label: "Documento",
  icon: FileText,
  color: "#64b5f6",
  iconBg: "rgba(100, 181, 246, 0.18)",
  stripeColor: "#64b5f6",
  portColor: "#64b5f6",
  portColorMuted: "rgba(100, 181, 246, 0.45)",
  badgeClass: "n8n-badge n8n-badge--document",
  canHaveChildren: false,
  getSubtitle: (node) => node.metadata?.["formato"] ?? "Documento",
});
