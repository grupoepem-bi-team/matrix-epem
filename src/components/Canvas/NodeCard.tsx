import React, { useState, useCallback, useRef } from "react";
import { Folder, FileText } from "lucide-react";
import type { TreeNode, Position } from "../../types";

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 80;

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
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isFolder = node.type === "folder";
  const subtitle = isFolder
    ? `${node.children.length} elemento${node.children.length !== 1 ? "s" : ""}`
    : (node.metadata?.["formato"] ?? "Documento");

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      setIsDragging(true);
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
      onDragStart(node.id);
      onSelect(node.id);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = moveEvent.clientX - dragStartRef.current.clientX;
        const deltaY = moveEvent.clientY - dragStartRef.current.clientY;
        onDragMove(node.id, deltaX, deltaY);
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = upEvent.clientX - dragStartRef.current.clientX;
        const deltaY = upEvent.clientY - dragStartRef.current.clientY;
        onDragEnd(node.id, newX(position.x, deltaX), newY(position.y, deltaY));
        setIsDragging(false);
        dragStartRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [node.id, position, onDragStart, onDragMove, onDragEnd, onSelect],
  );

  return (
    <div
      ref={nodeRef}
      className={[
        "wf-node",
        isFolder ? "wf-node--folder" : "wf-node--document",
        isSelected ? "wf-node--selected" : "",
        isDragging ? "wf-node--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      {/* ── Input port ── */}
      <div className="wf-port wf-port--input" />

      {/* ── Icon area ── */}
      <div className="wf-node__icon">
        {isFolder ? <Folder size={22} /> : <FileText size={22} />}
      </div>

      {/* ── Content ── */}
      <div className="wf-node__body">
        <span className="wf-node__title">{node.name}</span>
        <span className="wf-node__subtitle">{subtitle}</span>
      </div>

      {/* ── Status checkmark ── */}
      <div className="wf-node__status">
        <svg
          width="11"
          height="11"
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

      {/* ── Output port ── */}
      <div className="wf-port wf-port--output" />
    </div>
  );
};

/* Small helpers to keep the drag logic readable */
const newX = (base: number, delta: number) => base + delta;
const newY = (base: number, delta: number) => base + delta;
