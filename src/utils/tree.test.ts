import { describe, it, expect } from "vitest";
import type { TreeNode, NodeType } from "../types";
import {
  generateId,
  createNode,
  findNodeById,
  findParentNode,
  getNodePath,
  addNodeToParent,
  addRootNode,
  updateNodeById,
  removeNodeById,
  searchNodes,
  countNodes,
  countDocuments,
  countFolders,
  flattenAll,
  collectEdges,
  buildNodeMap,
  calculateNewNodePosition,
  calcSubtreeHeight,
  autoLayout,
  NODE_WIDTH,
  NODE_HEIGHT,
  HORIZONTAL_GAP,
  VERTICAL_GAP,
} from "./tree";

/* ────────────────────────────────────────────── */
/*  Test helpers                                */
/* ────────────────────────────────────────────── */

const makeNode = (
  id: string,
  name: string,
  type: NodeType = "folder",
  children: TreeNode[] = [],
  overrides: Partial<TreeNode> = {},
): TreeNode => ({
  id,
  name,
  type,
  description: "",
  children,
  metadata: {},
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  ...overrides,
});

/**
 * Build a sample tree for reuse across tests:
 *
 *  root (folder)
 *  ├── folderA (folder)
 *  │   ├── doc1 (document)
 *  │   └── doc2 (document)
 *  ├── folderB (folder)
 *  │   └── subFolder (folder)
 *  │       └── doc3 (document)
 *  └── doc4 (document)
 */
const buildSampleTree = (): TreeNode[] => {
  const doc1 = makeNode("d1", "Doc 1", "document", [], {
    description: "First document",
    metadata: { formato: "PDF", tamaño: "1.0 MB" },
  });
  const doc2 = makeNode("d2", "Doc 2", "document", [], {
    description: "Second document",
    metadata: { formato: "XLSX", tamaño: "2.5 MB" },
  });
  const doc3 = makeNode("d3", "Doc 3", "document", [], {
    description: "Third document inside subfolder",
    metadata: { formato: "PPTX" },
  });
  const doc4 = makeNode("d4", "Doc 4", "document", [], {
    description: "Root level document",
  });

  const subFolder = makeNode("sf", "Sub Folder", "folder", [doc3], {
    description: "A sub folder",
  });
  const folderA = makeNode("fa", "Folder A", "folder", [doc1, doc2], {
    description: "Contains documents",
  });
  const folderB = makeNode("fb", "Folder B", "folder", [subFolder], {
    description: "Contains a subfolder",
  });

  const root = makeNode("root", "Root", "folder", [folderA, folderB, doc4], {
    description: "Root node",
  });

  return [root];
};

/* ══════════════════════════════════════════════ */
/*  generateId                                  */
/* ══════════════════════════════════════════════ */

describe("generateId", () => {
  it("should return a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
  });

  it("should return a valid UUID format (v4)", () => {
    const id = generateId();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // y is one of 8, 9, a, b
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });

  it("should generate unique IDs across multiple calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("should use the fallback when crypto.randomUUID is not available", () => {
    const originalRandomUUID = crypto.randomUUID;
    // @ts-expect-error — intentionally removing the function for testing
    crypto.randomUUID = undefined;

    const id = generateId();
    expect(typeof id).toBe("string");

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);

    // Restore
    crypto.randomUUID = originalRandomUUID;
  });
});

/* ══════════════════════════════════════════════ */
/*  createNode                                  */
/* ══════════════════════════════════════════════ */

describe("createNode", () => {
  it("should create a node with correct defaults", () => {
    const node = createNode("Test Node", "folder");
    expect(node.name).toBe("Test Node");
    expect(node.type).toBe("folder");
    expect(node.description).toBe("");
    expect(node.children).toEqual([]);
    expect(node.metadata).toEqual({});
  });

  it("should set description when provided", () => {
    const node = createNode("Test", "document", "A test description");
    expect(node.description).toBe("A test description");
  });

  it("should set metadata when provided", () => {
    const node = createNode("Test", "document", "", {
      formato: "PDF",
      tamaño: "1.0 MB",
    });
    expect(node.metadata).toEqual({ formato: "PDF", tamaño: "1.0 MB" });
  });

  it("should set createdAt and updatedAt to valid ISO strings", () => {
    const before = new Date().toISOString();
    const node = createNode("Test", "folder");
    const after = new Date().toISOString();

    expect(node.createdAt >= before).toBe(true);
    expect(node.createdAt <= after).toBe(true);
    expect(node.updatedAt >= before).toBe(true);
    expect(node.updatedAt <= after).toBe(true);

    // Verify they are valid ISO date strings
    expect(new Date(node.createdAt).toISOString()).toBe(node.createdAt);
    expect(new Date(node.updatedAt).toISOString()).toBe(node.updatedAt);
  });

  it("should set createdAt and updatedAt to the same value", () => {
    const node = createNode("Test", "document");
    expect(node.createdAt).toBe(node.updatedAt);
  });

  it("should generate a unique ID", () => {
    const node1 = createNode("Node 1", "folder");
    const node2 = createNode("Node 2", "folder");
    expect(node1.id).not.toBe(node2.id);
  });

  it("should create a document type node", () => {
    const node = createNode("Doc", "document");
    expect(node.type).toBe("document");
  });
});

/* ══════════════════════════════════════════════ */
/*  findNodeById                                */
/* ══════════════════════════════════════════════ */

describe("findNodeById", () => {
  it("should find a root node by ID", () => {
    const tree = buildSampleTree();
    const found = findNodeById(tree, "root");
    expect(found).not.toBeNull();
    expect(found!.id).toBe("root");
    expect(found!.name).toBe("Root");
  });

  it("should find a deeply nested node by ID", () => {
    const tree = buildSampleTree();
    const found = findNodeById(tree, "d3");
    expect(found).not.toBeNull();
    expect(found!.id).toBe("d3");
    expect(found!.name).toBe("Doc 3");
  });

  it("should return null for a non-existent ID", () => {
    const tree = buildSampleTree();
    const found = findNodeById(tree, "nonexistent");
    expect(found).toBeNull();
  });

  it("should return null for an empty tree", () => {
    const found = findNodeById([], "any");
    expect(found).toBeNull();
  });

  it("should find a node at an intermediate level", () => {
    const tree = buildSampleTree();
    const found = findNodeById(tree, "fa");
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Folder A");
  });
});

/* ══════════════════════════════════════════════ */
/*  findParentNode                              */
/* ══════════════════════════════════════════════ */

describe("findParentNode", () => {
  it("should find the parent of a direct child", () => {
    const tree = buildSampleTree();
    const parent = findParentNode(tree, "d1");
    expect(parent).not.toBeNull();
    expect(parent!.id).toBe("fa");
  });

  it("should find the parent of a deeply nested child", () => {
    const tree = buildSampleTree();
    const parent = findParentNode(tree, "d3");
    expect(parent).not.toBeNull();
    expect(parent!.id).toBe("sf");
  });

  it("should return null for root nodes", () => {
    const tree = buildSampleTree();
    const parent = findParentNode(tree, "root");
    expect(parent).toBeNull();
  });

  it("should return null for non-existent ID", () => {
    const tree = buildSampleTree();
    const parent = findParentNode(tree, "nonexistent");
    expect(parent).toBeNull();
  });

  it("should return null for an empty tree", () => {
    const parent = findParentNode([], "any");
    expect(parent).toBeNull();
  });

  it("should find the parent of a folder", () => {
    const tree = buildSampleTree();
    const parent = findParentNode(tree, "fb");
    expect(parent).not.toBeNull();
    expect(parent!.id).toBe("root");
  });
});

/* ══════════════════════════════════════════════ */
/*  getNodePath                                 */
/* ══════════════════════════════════════════════ */

describe("getNodePath", () => {
  it("should return the full path from root to a deeply nested node", () => {
    const tree = buildSampleTree();
    const path = getNodePath(tree, "d3");
    const pathIds = path.map((n) => n.id);
    expect(pathIds).toEqual(["root", "fb", "sf", "d3"]);
  });

  it("should return just the root node if the target is root", () => {
    const tree = buildSampleTree();
    const path = getNodePath(tree, "root");
    expect(path).toHaveLength(1);
    expect(path[0].id).toBe("root");
  });

  it("should return an empty array for a non-existent ID", () => {
    const tree = buildSampleTree();
    const path = getNodePath(tree, "nonexistent");
    expect(path).toEqual([]);
  });

  it("should return an empty array for an empty tree", () => {
    const path = getNodePath([], "any");
    expect(path).toEqual([]);
  });

  it("should work with intermediate nodes", () => {
    const tree = buildSampleTree();
    const path = getNodePath(tree, "fa");
    const pathIds = path.map((n) => n.id);
    expect(pathIds).toEqual(["root", "fa"]);
  });
});

/* ══════════════════════════════════════════════ */
/*  addNodeToParent                             */
/* ══════════════════════════════════════════════ */

describe("addNodeToParent", () => {
  it("should add a child to the correct parent", () => {
    const tree = buildSampleTree();
    const newNode = makeNode("new1", "New Node", "document");
    const result = addNodeToParent(tree, "fa", newNode);

    const parent = findNodeById(result, "fa");
    expect(parent).not.toBeNull();
    expect(parent!.children).toHaveLength(3);
    expect(parent!.children.some((c) => c.id === "new1")).toBe(true);
  });

  it("should not modify the original tree (immutability)", () => {
    const tree = buildSampleTree();
    const originalChildren = findNodeById(tree, "fa")!.children.length;
    const newNode = makeNode("new1", "New Node", "document");
    addNodeToParent(tree, "fa", newNode);

    // Original should be unchanged
    expect(findNodeById(tree, "fa")!.children).toHaveLength(originalChildren);
  });

  it("should not modify other branches", () => {
    const tree = buildSampleTree();
    const newNode = makeNode("new1", "New Node", "document");
    const result = addNodeToParent(tree, "fa", newNode);

    // folderB should be unchanged
    const folderB = findNodeById(result, "fb");
    expect(folderB!.children).toHaveLength(1);
  });

  it("should add child to a deeply nested parent", () => {
    const tree = buildSampleTree();
    const newNode = makeNode("new1", "New Node", "document");
    const result = addNodeToParent(tree, "sf", newNode);

    const subFolder = findNodeById(result, "sf");
    expect(subFolder!.children).toHaveLength(2);
    expect(subFolder!.children.some((c) => c.id === "new1")).toBe(true);
  });

  it("should update the parent's updatedAt timestamp", () => {
    const tree = buildSampleTree();
    const newNode = makeNode("new1", "New Node", "document");
    const result = addNodeToParent(tree, "fa", newNode);

    const parent = findNodeById(result, "fa");
    expect(parent!.updatedAt).not.toBe("2025-01-01T00:00:00.000Z");
  });

  it("should return unchanged tree if parentId does not exist", () => {
    const tree = buildSampleTree();
    const newNode = makeNode("new1", "New Node", "document");
    const result = addNodeToParent(tree, "nonexistent", newNode);
    // Tree should be structurally the same (no node added)
    expect(countNodes(result)).toBe(countNodes(tree));
  });
});

/* ══════════════════════════════════════════════ */
/*  addRootNode                                 */
/* ══════════════════════════════════════════════ */

describe("addRootNode", () => {
  it("should add a node at root level", () => {
    const tree = buildSampleTree();
    const newNode = makeNode("newRoot", "New Root", "folder");
    const result = addRootNode(tree, newNode);

    expect(result).toHaveLength(2);
    expect(result[1].id).toBe("newRoot");
  });

  it("should not modify the original tree (immutability)", () => {
    const tree = buildSampleTree();
    const newNode = makeNode("newRoot", "New Root", "folder");
    addRootNode(tree, newNode);
    expect(tree).toHaveLength(1);
  });

  it("should add a node to an empty tree", () => {
    const newNode = makeNode("root1", "Root 1", "folder");
    const result = addRootNode([], newNode);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("root1");
  });
});

/* ══════════════════════════════════════════════ */
/*  updateNodeById                              */
/* ══════════════════════════════════════════════ */

describe("updateNodeById", () => {
  it("should update the correct node", () => {
    const tree = buildSampleTree();
    const result = updateNodeById(tree, "d1", { name: "Updated Doc 1" });
    const updated = findNodeById(result, "d1");
    expect(updated!.name).toBe("Updated Doc 1");
  });

  it("should update a deeply nested node", () => {
    const tree = buildSampleTree();
    const result = updateNodeById(tree, "d3", { description: "New desc" });
    const updated = findNodeById(result, "d3");
    expect(updated!.description).toBe("New desc");
  });

  it("should update the updatedAt timestamp", () => {
    const tree = buildSampleTree();
    const result = updateNodeById(tree, "d1", { name: "Updated" });
    const updated = findNodeById(result, "d1");
    expect(updated!.updatedAt).not.toBe("2025-01-01T00:00:00.000Z");
  });

  it("should not affect other nodes", () => {
    const tree = buildSampleTree();
    const result = updateNodeById(tree, "d1", { name: "Updated Doc 1" });
    const other = findNodeById(result, "d2");
    expect(other!.name).toBe("Doc 2");
  });

  it("should not modify the original tree (immutability)", () => {
    const tree = buildSampleTree();
    updateNodeById(tree, "d1", { name: "Updated" });
    const original = findNodeById(tree, "d1");
    expect(original!.name).toBe("Doc 1");
  });

  it("should return unchanged tree if ID does not exist", () => {
    const tree = buildSampleTree();
    const result = updateNodeById(tree, "nonexistent", { name: "Nope" });
    expect(countNodes(result)).toBe(countNodes(tree));
  });

  it("should preserve children when updating a folder", () => {
    const tree = buildSampleTree();
    const result = updateNodeById(tree, "fa", { name: "Renamed Folder A" });
    const updated = findNodeById(result, "fa");
    expect(updated!.children).toHaveLength(2);
    expect(updated!.name).toBe("Renamed Folder A");
  });
});

/* ══════════════════════════════════════════════ */
/*  removeNodeById                              */
/* ══════════════════════════════════════════════ */

describe("removeNodeById", () => {
  it("should remove a leaf node", () => {
    const tree = buildSampleTree();
    const result = removeNodeById(tree, "d1");
    expect(findNodeById(result, "d1")).toBeNull();
  });

  it("should remove a node and its entire subtree", () => {
    const tree = buildSampleTree();
    const result = removeNodeById(tree, "fa");
    // fa, d1, d2 should all be gone
    expect(findNodeById(result, "fa")).toBeNull();
    expect(findNodeById(result, "d1")).toBeNull();
    expect(findNodeById(result, "d2")).toBeNull();
  });

  it("should not affect siblings", () => {
    const tree = buildSampleTree();
    const result = removeNodeById(tree, "fa");
    // folderB and its subtree should remain
    expect(findNodeById(result, "fb")).not.toBeNull();
    expect(findNodeById(result, "sf")).not.toBeNull();
    expect(findNodeById(result, "d3")).not.toBeNull();
  });

  it("should remove a root node", () => {
    const tree = buildSampleTree();
    const result = removeNodeById(tree, "root");
    expect(result).toHaveLength(0);
  });

  it("should not modify the original tree (immutability)", () => {
    const tree = buildSampleTree();
    removeNodeById(tree, "d1");
    expect(findNodeById(tree, "d1")).not.toBeNull();
  });

  it("should return unchanged tree if ID does not exist", () => {
    const tree = buildSampleTree();
    const result = removeNodeById(tree, "nonexistent");
    expect(countNodes(result)).toBe(countNodes(tree));
  });

  it("should handle removing from an empty tree", () => {
    const result = removeNodeById([], "any");
    expect(result).toEqual([]);
  });

  it("should remove a deeply nested node", () => {
    const tree = buildSampleTree();
    const result = removeNodeById(tree, "d3");
    expect(findNodeById(result, "d3")).toBeNull();
    // SubFolder should still exist but with no children
    const sf = findNodeById(result, "sf");
    expect(sf).not.toBeNull();
    expect(sf!.children).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════ */
/*  searchNodes                                 */
/* ══════════════════════════════════════════════ */

describe("searchNodes", () => {
  it("should find nodes by name", () => {
    const tree = buildSampleTree();
    const results = searchNodes(tree, "Doc 1");
    expect(results.some((n) => n.id === "d1")).toBe(true);
  });

  it("should find nodes by description", () => {
    const tree = buildSampleTree();
    const results = searchNodes(tree, "First document");
    expect(results.some((n) => n.id === "d1")).toBe(true);
  });

  it("should find nodes by metadata value", () => {
    const tree = buildSampleTree();
    const results = searchNodes(tree, "PDF");
    // d1 has formato: "PDF"
    expect(results.some((n) => n.id === "d1")).toBe(true);
  });

  it("should be case-insensitive", () => {
    const tree = buildSampleTree();
    const resultsUpper = searchNodes(tree, "DOC 1");
    const resultsLower = searchNodes(tree, "doc 1");
    expect(resultsUpper.length).toBeGreaterThan(0);
    expect(resultsLower.length).toBeGreaterThan(0);
    expect(resultsUpper.length).toBe(resultsLower.length);
  });

  it("should return empty array for empty query", () => {
    const tree = buildSampleTree();
    expect(searchNodes(tree, "")).toEqual([]);
    expect(searchNodes(tree, "   ")).toEqual([]);
  });

  it("should return empty array when nothing matches", () => {
    const tree = buildSampleTree();
    expect(searchNodes(tree, "zzznonexistent")).toEqual([]);
  });

  it("should return empty array for an empty tree", () => {
    expect(searchNodes([], "test")).toEqual([]);
  });

  it("should find multiple matching nodes", () => {
    const tree = buildSampleTree();
    const results = searchNodes(tree, "Doc");
    // d1, d2, d3, d4 have "Doc" in name; fa description "Contains documents" also matches
    expect(results.length).toBe(5);
  });

  it("should search across deeply nested nodes", () => {
    const tree = buildSampleTree();
    const results = searchNodes(tree, "subfolder");
    // d3 description: "Third document inside subfolder"
    expect(results.some((n) => n.id === "d3")).toBe(true);
  });

  it("should match partial strings in metadata", () => {
    const tree = buildSampleTree();
    const results = searchNodes(tree, "XLSX");
    // d2 has formato: "XLSX"
    expect(results.some((n) => n.id === "d2")).toBe(true);
  });
});

/* ══════════════════════════════════════════════ */
/*  countNodes / countFolders / countDocuments  */
/* ══════════════════════════════════════════════ */

describe("countNodes", () => {
  it("should count all nodes in the sample tree", () => {
    const tree = buildSampleTree();
    // root, fa, fb, sf, d1, d2, d3, d4 = 8
    expect(countNodes(tree)).toBe(8);
  });

  it("should return 0 for an empty tree", () => {
    expect(countNodes([])).toBe(0);
  });

  it("should count a single node", () => {
    const tree = [makeNode("s", "Single", "folder")];
    expect(countNodes(tree)).toBe(1);
  });
});

describe("countFolders", () => {
  it("should count only folder nodes", () => {
    const tree = buildSampleTree();
    // root, fa, fb, sf = 4 folders
    expect(countFolders(tree)).toBe(4);
  });

  it("should return 0 for an empty tree", () => {
    expect(countFolders([])).toBe(0);
  });

  it("should return 0 for a tree with only documents", () => {
    const tree = [makeNode("d1", "Doc", "document")];
    expect(countFolders(tree)).toBe(0);
  });
});

describe("countDocuments", () => {
  it("should count only document nodes", () => {
    const tree = buildSampleTree();
    // d1, d2, d3, d4 = 4 documents
    expect(countDocuments(tree)).toBe(4);
  });

  it("should return 0 for an empty tree", () => {
    expect(countDocuments([])).toBe(0);
  });

  it("should return 0 for a tree with only folders", () => {
    const tree = [makeNode("f1", "Folder", "folder")];
    expect(countDocuments(tree)).toBe(0);
  });
});

it("countNodes should equal countFolders + countDocuments", () => {
  const tree = buildSampleTree();
  expect(countNodes(tree)).toBe(countFolders(tree) + countDocuments(tree));
});

/* ══════════════════════════════════════════════ */
/*  flattenAll                                  */
/* ══════════════════════════════════════════════ */

describe("flattenAll", () => {
  it("should flatten the entire tree into a flat array", () => {
    const tree = buildSampleTree();
    const flat = flattenAll(tree);
    expect(flat).toHaveLength(8);
  });

  it("should include all node IDs", () => {
    const tree = buildSampleTree();
    const flat = flattenAll(tree);
    const ids = flat.map((n) => n.id);
    expect(ids).toContain("root");
    expect(ids).toContain("fa");
    expect(ids).toContain("d3");
    expect(ids).toContain("d4");
  });

  it("should return an empty array for an empty tree", () => {
    expect(flattenAll([])).toEqual([]);
  });

  it("should flatten a single node", () => {
    const node = makeNode("s", "Single", "folder");
    const flat = flattenAll([node]);
    expect(flat).toHaveLength(1);
    expect(flat[0].id).toBe("s");
  });

  it("should use depth-first traversal", () => {
    const tree = buildSampleTree();
    const flat = flattenAll(tree);
    // root first, then folderA (first child), then its children...
    expect(flat[0].id).toBe("root");
    expect(flat[1].id).toBe("fa");
    expect(flat[2].id).toBe("d1");
  });
});

/* ══════════════════════════════════════════════ */
/*  collectEdges                                */
/* ══════════════════════════════════════════════ */

describe("collectEdges", () => {
  it("should collect all parent→child edges", () => {
    const tree = buildSampleTree();
    const edges = collectEdges(tree);
    // root→fa, root→fb, root→d4, fa→d1, fa→d2, fb→sf, sf→d3 = 7 edges
    expect(edges).toHaveLength(7);
  });

  it("should create edge IDs in source→target format", () => {
    const tree = buildSampleTree();
    const edges = collectEdges(tree);
    const rootToFolderA = edges.find((e) => e.sourceId === "root" && e.targetId === "fa");
    expect(rootToFolderA).not.toBeUndefined();
    expect(rootToFolderA!.id).toBe("root→fa");
  });

  it("should return an empty array for a tree with no children", () => {
    const tree = [makeNode("leaf", "Leaf", "document")];
    const edges = collectEdges(tree);
    expect(edges).toHaveLength(0);
  });

  it("should return an empty array for an empty tree", () => {
    expect(collectEdges([])).toEqual([]);
  });

  it("should correctly set sourceId and targetId", () => {
    const child = makeNode("c", "Child", "document");
    const parent = makeNode("p", "Parent", "folder", [child]);
    const edges = collectEdges([parent]);
    expect(edges).toHaveLength(1);
    expect(edges[0].sourceId).toBe("p");
    expect(edges[0].targetId).toBe("c");
  });
});

/* ══════════════════════════════════════════════ */
/*  buildNodeMap                                */
/* ══════════════════════════════════════════════ */

describe("buildNodeMap", () => {
  it("should build a Map with all nodes for O(1) lookup", () => {
    const tree = buildSampleTree();
    const map = buildNodeMap(tree);
    expect(map.size).toBe(8);
    expect(map.get("root")).not.toBeUndefined();
    expect(map.get("d3")).not.toBeUndefined();
  });

  it("should return an empty Map for an empty tree", () => {
    const map = buildNodeMap([]);
    expect(map.size).toBe(0);
  });

  it("should map ID to the correct node", () => {
    const tree = buildSampleTree();
    const map = buildNodeMap(tree);
    expect(map.get("d1")!.name).toBe("Doc 1");
    expect(map.get("sf")!.name).toBe("Sub Folder");
  });

  it("should work with a single node", () => {
    const node = makeNode("only", "Only", "document");
    const map = buildNodeMap([node]);
    expect(map.size).toBe(1);
    expect(map.get("only")!.name).toBe("Only");
  });
});

/* ══════════════════════════════════════════════ */
/*  calcSubtreeHeight                           */
/* ══════════════════════════════════════════════ */

describe("calcSubtreeHeight", () => {
  it("should return NODE_HEIGHT for a leaf node", () => {
    const leaf = makeNode("leaf", "Leaf", "document");
    expect(calcSubtreeHeight(leaf)).toBe(NODE_HEIGHT);
  });

  it("should return NODE_HEIGHT for a folder with no children", () => {
    const folder = makeNode("f", "Empty Folder", "folder");
    expect(calcSubtreeHeight(folder)).toBe(NODE_HEIGHT);
  });

  it("should calculate height for a node with one child", () => {
    const child = makeNode("c", "Child", "document");
    const parent = makeNode("p", "Parent", "folder", [child]);
    // one child: NODE_HEIGHT (no VERTICAL_GAP between siblings when only 1)
    expect(calcSubtreeHeight(parent)).toBe(NODE_HEIGHT);
  });

  it("should calculate height for a node with multiple children", () => {
    const c1 = makeNode("c1", "C1", "document");
    const c2 = makeNode("c2", "C2", "document");
    const parent = makeNode("p", "Parent", "folder", [c1, c2]);
    // 2 * NODE_HEIGHT + (2-1) * VERTICAL_GAP = 160 + 30 = 190
    expect(calcSubtreeHeight(parent)).toBe(2 * NODE_HEIGHT + 1 * VERTICAL_GAP);
  });

  it("should return at least NODE_HEIGHT even if children sum is smaller", () => {
    const child = makeNode("c", "Child", "document");
    const parent = makeNode("p", "Parent", "folder", [child]);
    // Single child has NODE_HEIGHT, which is not larger than NODE_HEIGHT
    // Math.max(NODE_HEIGHT, NODE_HEIGHT) = NODE_HEIGHT
    expect(calcSubtreeHeight(parent)).toBe(NODE_HEIGHT);
  });

  it("should handle deeply nested subtrees", () => {
    const leaf = makeNode("leaf", "Leaf", "document");
    const mid = makeNode("mid", "Mid", "folder", [leaf]);
    const root = makeNode("root", "Root", "folder", [mid]);
    // leaf: NODE_HEIGHT, mid: NODE_HEIGHT, root: NODE_HEIGHT
    // (single-child chain, all are NODE_HEIGHT)
    expect(calcSubtreeHeight(root)).toBe(NODE_HEIGHT);
  });

  it("should handle a node with many children", () => {
    const children = Array.from({ length: 5 }, (_, i) =>
      makeNode(`c${i}`, `Child ${i}`, "document"),
    );
    const parent = makeNode("p", "Parent", "folder", children);
    // 5 * NODE_HEIGHT + (5-1) * VERTICAL_GAP = 400 + 120 = 520
    expect(calcSubtreeHeight(parent)).toBe(5 * NODE_HEIGHT + 4 * VERTICAL_GAP);
  });
});

/* ══════════════════════════════════════════════ */
/*  calculateNewNodePosition                    */
/* ══════════════════════════════════════════════ */

describe("calculateNewNodePosition", () => {
  it("should return default position for an empty tree with no parentId", () => {
    const pos = calculateNewNodePosition([]);
    expect(pos).toEqual({ x: 80, y: 40 });
  });

  it("should place a child to the right of parent when parent has no existing children", () => {
    const parent = makeNode("p", "Parent", "folder", [], {
      position: { x: 100, y: 200 },
    });
    const pos = calculateNewNodePosition([parent], "p");
    expect(pos.x).toBe(100 + NODE_WIDTH + HORIZONTAL_GAP);
    expect(pos.y).toBe(200);
  });

  it("should place an additional child below the last existing child", () => {
    const existingChild = makeNode("c1", "Child 1", "document", [], {
      position: { x: 400, y: 200 },
    });
    const parent = makeNode("p", "Parent", "folder", [existingChild], {
      position: { x: 100, y: 200 },
    });
    const pos = calculateNewNodePosition([parent], "p");
    expect(pos.x).toBe(100 + NODE_WIDTH + HORIZONTAL_GAP);
    // maxY = existingChild.y + NODE_HEIGHT (subtree height of leaf) = 200 + 80 = 280
    // y = 280 + VERTICAL_GAP = 310
    expect(pos.y).toBe(280 + VERTICAL_GAP);
  });

  it("should place a root node below the last root node", () => {
    const root1 = makeNode("r1", "Root 1", "folder", [], {
      position: { x: 80, y: 40 },
    });
    const pos = calculateNewNodePosition([root1]);
    // maxY = 40 + NODE_HEIGHT = 120
    // y = 120 + VERTICAL_GAP = 150
    expect(pos.x).toBe(80);
    expect(pos.y).toBe(40 + NODE_HEIGHT + VERTICAL_GAP);
  });

  it("should handle parent not found (fall back to root placement)", () => {
    const root1 = makeNode("r1", "Root 1", "folder", [], {
      position: { x: 80, y: 40 },
    });
    const pos = calculateNewNodePosition([root1], "nonexistent");
    // Falls through to root node logic since parent not found
    expect(pos.x).toBe(80);
    expect(pos.y).toBe(40 + NODE_HEIGHT + VERTICAL_GAP);
  });

  it("should handle root nodes without positions", () => {
    const root1 = makeNode("r1", "Root 1", "folder");
    // No position set on root1
    const pos = calculateNewNodePosition([root1]);
    expect(pos.x).toBe(80);
    expect(pos.y).toBe(40); // maxY stays -Infinity, so fallback 40
  });

  it("should position below the subtree of the last root (accounting for children)", () => {
    const child1 = makeNode("c1", "Child", "document", [], {
      position: { x: 400, y: 40 },
    });
    const child2 = makeNode("c2", "Child 2", "document", [], {
      position: { x: 400, y: 40 + NODE_HEIGHT + VERTICAL_GAP },
    });
    const root1 = makeNode("r1", "Root 1", "folder", [child1, child2], {
      position: { x: 80, y: 40 },
    });
    const pos = calculateNewNodePosition([root1]);
    // Subtree height of root1 = 2 * NODE_HEIGHT + VERTICAL_GAP = 190
    // maxY = root1.position.y + subtreeH = 40 + 190 = 230
    // y = 230 + VERTICAL_GAP = 260
    expect(pos.x).toBe(80);
    expect(pos.y).toBe(40 + 2 * NODE_HEIGHT + VERTICAL_GAP + VERTICAL_GAP);
  });
});

/* ══════════════════════════════════════════════ */
/*  autoLayout                                  */
/* ══════════════════════════════════════════════ */

describe("autoLayout", () => {
  it("should assign positions to all nodes", () => {
    const tree = buildSampleTree();
    const laid = autoLayout(tree);
    const flat = flattenAll(laid);
    for (const node of flat) {
      expect(node.position).not.toBeUndefined();
      expect(typeof node.position!.x).toBe("number");
      expect(typeof node.position!.y).toBe("number");
    }
  });

  it("should position children to the right of their parent", () => {
    const child = makeNode("c", "Child", "document");
    const parent = makeNode("p", "Parent", "folder", [child]);
    const laid = autoLayout([parent]);
    const laidChild = findNodeById(laid, "c");
    const laidParent = findNodeById(laid, "p");
    expect(laidChild!.position!.x).toBe(laidParent!.position!.x + NODE_WIDTH + HORIZONTAL_GAP);
  });

  it("should use the provided x0 and y0 offsets", () => {
    const node = makeNode("n", "Node", "document");
    const laid = autoLayout([node], 200, 300);
    expect(laid[0].position!.x).toBe(200);
    expect(laid[0].position!.y).toBe(300);
  });

  it("should use default x0=80 and y0=40", () => {
    const node = makeNode("n", "Node", "document");
    const laid = autoLayout([node]);
    expect(laid[0].position!.x).toBe(80);
    expect(laid[0].position!.y).toBe(40);
  });

  it("should center parent vertically within its subtree allocation", () => {
    const c1 = makeNode("c1", "C1", "document");
    const c2 = makeNode("c2", "C2", "document");
    const parent = makeNode("p", "Parent", "folder", [c1, c2]);
    const laid = autoLayout([parent]);

    const laidParent = findNodeById(laid, "p");
    // subtreeH = 2 * NODE_HEIGHT + VERTICAL_GAP = 190
    // parent Y = y0 + (subtreeH - NODE_HEIGHT) / 2 = 40 + (190 - 80) / 2 = 40 + 55 = 95
    expect(laidParent!.position!.y).toBe(40 + (2 * NODE_HEIGHT + VERTICAL_GAP - NODE_HEIGHT) / 2);
  });

  it("should stack sibling subtrees vertically with VERTICAL_GAP", () => {
    const c1 = makeNode("c1", "C1", "document");
    const c2 = makeNode("c2", "C2", "document");
    const parent = makeNode("p", "Parent", "folder", [c1, c2]);
    const laid = autoLayout([parent]);

    const laidC1 = findNodeById(laid, "c1");
    const laidC2 = findNodeById(laid, "c2");

    // c1 should be above c2
    expect(laidC1!.position!.y).toBeLessThan(laidC2!.position!.y);
    // The gap should be at least VERTICAL_GAP + NODE_HEIGHT difference for leaf nodes
    expect(laidC2!.position!.y - laidC1!.position!.y).toBe(NODE_HEIGHT + VERTICAL_GAP);
  });

  it("should handle a single leaf node", () => {
    const leaf = makeNode("l", "Leaf", "document");
    const laid = autoLayout([leaf]);
    expect(laid[0].position).toEqual({ x: 80, y: 40 });
  });

  it("should handle an empty tree", () => {
    const laid = autoLayout([]);
    expect(laid).toEqual([]);
  });

  it("should handle multiple root nodes", () => {
    const r1 = makeNode("r1", "Root 1", "document");
    const r2 = makeNode("r2", "Root 2", "document");
    const laid = autoLayout([r1, r2]);

    expect(laid).toHaveLength(2);
    // Both should have positions
    expect(laid[0].position).not.toBeUndefined();
    expect(laid[1].position).not.toBeUndefined();
    // r2 should be below r1
    expect(laid[1].position!.y).toBeGreaterThan(laid[0].position!.y);
  });

  it("should produce a valid horizontal L→R layout where children are always to the right of parents", () => {
    const d1 = makeNode("d1", "Doc 1", "document");
    const d2 = makeNode("d2", "Doc 2", "document");
    const f1 = makeNode("f1", "Folder 1", "folder", [d1, d2]);
    const root = makeNode("root", "Root", "folder", [f1]);
    const laid = autoLayout([root]);

    const laidRoot = findNodeById(laid, "root");
    const laidF1 = findNodeById(laid, "f1");
    const laidD1 = findNodeById(laid, "d1");
    const laidD2 = findNodeById(laid, "d2");

    // root < f1 < d1, d2 on X axis
    expect(laidF1!.position!.x).toBeGreaterThan(laidRoot!.position!.x);
    expect(laidD1!.position!.x).toBeGreaterThan(laidF1!.position!.x);
    expect(laidD2!.position!.x).toBeGreaterThan(laidF1!.position!.x);
  });
});

/* ══════════════════════════════════════════════ */
/*  Layout constants                            */
/* ══════════════════════════════════════════════ */

describe("layout constants", () => {
  it("should export correct NODE_WIDTH", () => {
    expect(NODE_WIDTH).toBe(220);
  });

  it("should export correct NODE_HEIGHT", () => {
    expect(NODE_HEIGHT).toBe(80);
  });

  it("should export correct HORIZONTAL_GAP", () => {
    expect(HORIZONTAL_GAP).toBe(80);
  });

  it("should export correct VERTICAL_GAP", () => {
    expect(VERTICAL_GAP).toBe(30);
  });
});
