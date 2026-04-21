import React, { useCallback } from "react";
import { Folder, FolderOpen, FileText, ChevronRight } from "lucide-react";
import { useTreeStore } from "../../store/useTreeStore";
import type { TreeNode } from "../../types";

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = React.memo(
  ({ node, depth }) => {
    const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
    const expandedNodeIds = useTreeStore((s) => s.expandedNodeIds);
    const searchQuery = useTreeStore((s) => s.searchQuery);
    const selectNode = useTreeStore((s) => s.selectNode);
    const toggleExpand = useTreeStore((s) => s.toggleExpand);

    const isSelected = selectedNodeId === node.id;
    const isExpanded = expandedNodeIds.includes(node.id);
    const isFolder = node.type === "folder";
    const isSearchMode = searchQuery.trim().length > 0;
    const childCount = node.children.length;

    const handleClick = useCallback(() => {
      selectNode(node.id);
      if (isFolder) {
        toggleExpand(node.id);
      }
    }, [selectNode, toggleExpand, node.id, isFolder]);

    const nodeClasses = [
      "n8n-node relative",
      isFolder ? "n8n-node--folder" : "n8n-node--document",
      isSelected ? "n8n-node--selected" : "",
    ].filter(Boolean).join(" ");

    const paddingLeft = isSearchMode ? "12px" : `${depth * 20 + 8}px`;

    return (
      <div
        className={nodeClasses}
        style={{ paddingLeft, marginBottom: "8px" }}
        onClick={handleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isFolder ? isExpanded : undefined}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {isFolder && childCount > 0 && (
          <span className="n8n-node__count">{childCount}</span>
        )}

        <div className="n8n-node__icon">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen size={20} />
            ) : (
              <Folder size={20} />
            )
          ) : (
            <FileText size={20} />
          )}
        </div>

        <span className="n8n-node__title">{node.name}</span>

        <span className="n8n-node__badge">
          {isFolder ? "CARPETA" : "DOC"}
        </span>

        {isFolder && (
          <ChevronRight
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 transition-transform duration-200"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        )}
      </div>
    );
  }
);

TreeNodeItem.displayName = "TreeNodeItem";
