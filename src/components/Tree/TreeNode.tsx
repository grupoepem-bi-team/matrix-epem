import React from "react";
import { Folder, FolderOpen, FileText, ChevronRight } from "lucide-react";
import { useTreeStore } from "../../store/useTreeStore";
import type { TreeNode as TreeNodeType } from "../../types";

interface TreeNodeProps {
  node: TreeNodeType;
}

export const TreeNode: React.FC<TreeNodeProps> = React.memo(({ node }) => {
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const expandedNodeIds = useTreeStore((s) => s.expandedNodeIds);
  const selectNode = useTreeStore((s) => s.selectNode);
  const toggleExpand = useTreeStore((s) => s.toggleExpand);

  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodeIds.includes(node.id);
  const isFolder = node.type === "folder";
  const childCount = node.children.length;

  const handleClick = () => {
    selectNode(node.id);
    if (isFolder) toggleExpand(node.id);
  };

  return (
    <>
      <div
        className={`node ${isFolder ? "folder" : "document"} ${isSelected ? "selected" : ""}`}
        onClick={handleClick}
      >
        <div className="node-icon">
          {isFolder ? (
            isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />
          ) : (
            <FileText size={18} />
          )}
        </div>
        <div className="node-content">
          <span className="node-label">{node.name}</span>
          <span className={`node-type ${isFolder ? "folder" : "document"}`}>
            {isFolder ? "CARPETA" : "DOCUMENTO"}
          </span>
        </div>
        {isFolder && childCount > 0 && (
          <span className="node-count">{childCount}</span>
        )}
        {isFolder && (
          <ChevronRight
            size={16}
            className={`node-chevron ${isExpanded ? "expanded" : ""}`}
          />
        )}
      </div>

      {isFolder && isExpanded && childCount > 0 && (
        <div className="children">
          {node.children.map((child) => (
            <div key={child.id} className="level">
              <TreeNode node={child} />
            </div>
          ))}
        </div>
      )}
    </>
  );
});

TreeNode.displayName = "TreeNode";
