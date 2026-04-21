import React, { useCallback } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight } from 'lucide-react';
import { useTreeStore } from '../../store/useTreeStore';
import type { TreeNode } from '../../types';

interface TreeNodeItemProps {
  /** The tree node to render */
  node: TreeNode;
  /** Current depth in the tree hierarchy (0 = root) */
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
    const isFolder = node.type === 'folder';
    const isSearchMode = searchQuery.trim().length > 0;
    const childCount = node.children.length;

    const handleClick = useCallback(() => {
      selectNode(node.id);
      if (isFolder) {
        toggleExpand(node.id);
      }
    }, [selectNode, toggleExpand, node.id, isFolder]);

    /* ── Styling ── */

    const containerClasses = [
      'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer select-none',
      'transition-colors duration-150',
      isSelected
        ? 'bg-n8n-sidebar-active text-n8n-text-inverse'
        : 'text-n8n-text-inverse-secondary hover:bg-n8n-sidebar-hover hover:text-n8n-text-inverse',
      isSearchMode ? 'ml-1 border-l-2 border-n8n-accent/40' : '',
    ].join(' ');

    const paddingLeft = isSearchMode ? '12px' : `${depth * 20 + 8}px`;

    return (
      <div
        className={containerClasses}
        style={{ paddingLeft }}
        onClick={handleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isFolder ? isExpanded : undefined}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Chevron – only shown for folders in normal (non-search) mode */}
        {isFolder && !isSearchMode && (
          <span
            className="flex-shrink-0 transition-transform duration-200 ease-in-out"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <ChevronRight size={14} />
          </span>
        )}

        {/* Spacer for non-folder nodes to align icons with folders (normal mode only) */}
        {!isFolder && !isSearchMode && (
          <span className="w-3.5 flex-shrink-0" />
        )}

        {/* Node icon */}
        <span className="flex-shrink-0">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-n8n-folder" />
            ) : (
              <Folder size={16} className="text-n8n-folder" />
            )
          ) : (
            <FileText size={16} className="text-n8n-document" />
          )}
        </span>

        {/* Node name – truncated with ellipsis when too long */}
        <span className="flex-1 truncate text-sm leading-tight">
          {node.name}
        </span>

        {/* Child count badge for folders */}
        {isFolder && childCount > 0 && (
          <span className="n8n-badge n8n-badge--folder flex-shrink-0 text-[10px] leading-none px-1.5 py-0.5">
            {childCount}
          </span>
        )}
      </div>
    );
  },
);

TreeNodeItem.displayName = 'TreeNodeItem';
