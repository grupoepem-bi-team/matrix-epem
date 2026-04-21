import React, { useState, useCallback, useRef } from "react";
import { Folder, FolderOpen, FileText, ChevronRight, GripVertical } from "lucide-react";
import type { TreeNode, Position } from "../../types";

interface NodeCardProps {
  node: TreeNode;
  isSelected: boolean;
  position: Position;
  onSelect: (nodeId: string) => void;
  onDragStart: (nodeId: string) => void;
  onDragMove: (nodeId: string, deltaX: number, deltaY: number) => void;
  onDragEnd: (nodeId: string, newX: number, newY: number) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  position,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<Position | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isFolder = node.type === "folder";
  const childCount = node.children.length;

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      e.stopPropagation();
      e.preventDefault();

      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      onDragStart(node.id);
      onSelect(node.id);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = moveEvent.clientX - dragStartRef.current.x;
        const deltaY = moveEvent.clientY - dragStartRef.current.y;
        onDragMove(node.id, deltaX, deltaY);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!dragStartRef.current || !nodeRef.current) return;
        const deltaX = upEvent.clientX - dragStartRef.current.x;
        const deltaY = upEvent.clientY - dragStartRef.current.y;
        const newX = position.x + deltaX;
        const newY = position.y + deltaY;
        onDragEnd(node.id, newX, newY);
        setIsDragging(false);
        dragStartRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [node.id, position, onDragStart, onDragMove, onDragEnd, onSelect]
  );

  // Handle click (without drag)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) {
        onSelect(node.id);
      }
    },
    [isDragging, node.id, onSelect]
  );

  return (
    <div
      ref={nodeRef}
      className={`node-card ${isFolder ? "folder" : "document"} ${isSelected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: 240,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Drag handle */}
      <div className="node-card__drag-handle">
        <GripVertical size={14} />
      </div>

      {/* Icon */}
      <div className="node-card__icon">
        {isFolder ? (
          <Folder size={24} />
        ) : (
          <FileText size={24} />
        )}
      </div>

      {/* Content */}
      <div className="node-card__content">
        <span className="node-card__title">{node.name}</span>
        <span className={`node-card__type ${isFolder ? "folder" : "document"}`}>
          {isFolder ? "CARPETA" : "DOCUMENTO"}
        </span>
      </div>

      {/* Child count badge */}
      {isFolder && childCount > 0 && (
        <span className="node-card__count">{childCount}</span>
      )}

      {/* Status indicator (n8n style checkmark) */}
      <div className="node-card__status">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>
  );
};
