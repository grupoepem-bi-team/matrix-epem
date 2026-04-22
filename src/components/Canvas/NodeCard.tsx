import React, { useState, useCallback, useRef, useEffect } from "react";
import type { TreeNode, Position } from "@/types";
import { getNodeTypeConfigOrDefault } from "@/registry";

/* ── Layout constants (must match utils/treeLayout.ts) ── */
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 80;

interface NodeCardProps {
  node: TreeNode;
  isSelected: boolean;
  position: Position;
  zoom: number;
  onSelect: (nodeId: string) => void;
  onDragStart: (nodeId: string) => void;
  onDragEnd: (nodeId: string, position: Position) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  position,
  zoom,
  onSelect,
  onDragStart,
  onDragEnd,
}) => {
  /* ── State ───────────────────────────────────── */
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const rafRef = useRef<number>(0);

  /* ── Cleanup ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ── Registry-based visual config ──────────────── */
  const config = getNodeTypeConfigOrDefault(node.type);
  const IconComponent = config.icon;
  const subtitle = config.getSubtitle(node);

  const accentColor = "#ff6d5a";
  const portColor = isSelected ? accentColor : config.portColorMuted;
  const portGlow = isSelected
    ? `0 0 0 3px rgba(255, 109, 90, 0.25)`
    : `0 0 0 3px ${config.color}38`;

  /* ── Drag handling ───────────────────────────── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // left button only
      e.stopPropagation();
      e.preventDefault();

      dragRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      };

      setIsDragging(true);
      setDragOffset({ x: 0, y: 0 });
      onDragStart(node.id);
      onSelect(node.id);

      /* We attach move/up listeners to `document` so the drag
         continues even if the cursor leaves the node.             */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const start = dragRef.current;
        if (!start) return;

        /* Convert screen-pixel delta to canvas-pixel delta
           by dividing by the current zoom factor.              */
        const dx = (moveEvent.clientX - start.startClientX) / zoom;
        const dy = (moveEvent.clientY - start.startClientY) / zoom;

        /* Batch via requestAnimationFrame for smooth 60 fps */
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          setDragOffset({ x: dx, y: dy });
        });
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        const start = dragRef.current;
        if (!start) return;

        const dx = (upEvent.clientX - start.startClientX) / zoom;
        const dy = (upEvent.clientY - start.startClientY) / zoom;

        const finalPos: Position = {
          x: start.startPosX + dx,
          y: start.startPosY + dy,
        };

        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        dragRef.current = null;

        onDragEnd(node.id, finalPos);

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [node.id, position.x, position.y, zoom, onDragStart, onDragEnd, onSelect],
  );

  /* ── Computed visual position ─────────────────── */
  const displayX = position.x + dragOffset.x;
  const displayY = position.y + dragOffset.y;

  /* ── CSS class for node type ──────────────────── */
  const typeClass = config.canHaveChildren ? "wf-node--folder" : "wf-node--document";

  /* ── Render ───────────────────────────────────── */
  return (
    <div
      className={[
        "wf-node",
        typeClass,
        isSelected ? "wf-node--selected" : "",
        isDragging ? "wf-node--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: displayX,
        top: displayY,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        zIndex: isDragging ? 1000 : undefined,
        boxShadow: isDragging
          ? "0 18px 44px rgba(0, 0, 0, 0.85)"
          : isSelected
            ? "0 0 0 3px rgba(255, 109, 90, 0.22), 0 8px 28px rgba(0, 0, 0, 0.7)"
            : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* ── Left coloured stripe ── */}
      <div className="wf-node__stripe" style={{ backgroundColor: config.stripeColor }} />

      {/* ── Input port (left side) ── */}
      <div
        className="wf-port wf-port--input"
        style={{
          backgroundColor: portColor,
          borderColor: "#2c2c3f",
          boxShadow: isSelected ? portGlow : undefined,
        }}
      />

      {/* ── Icon area ── */}
      <div className="wf-node__icon" style={{ background: config.iconBg, color: config.color }}>
        <IconComponent size={20} />
      </div>

      {/* ── Title & subtitle ── */}
      <div className="wf-node__body">
        <span className="wf-node__title">{node.name}</span>
        <span className="wf-node__subtitle">{subtitle}</span>
      </div>

      {/* ── Status checkmark (top-right) ── */}
      <div className="wf-node__status">
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

      {/* ── Output port (right side) ── */}
      <div
        className="wf-port wf-port--output"
        style={{
          backgroundColor: portColor,
          borderColor: "#2c2c3f",
          boxShadow: isSelected ? portGlow : undefined,
        }}
      />
    </div>
  );
};

/* ── React.memo with custom comparator ──────────── */
const NodeCardMemo = React.memo(NodeCard, (prev, next) => {
  return (
    prev.node.id === next.node.id &&
    prev.node.type === next.node.type &&
    prev.node.name === next.node.name &&
    prev.isSelected === next.isSelected &&
    prev.position.x === next.position.x &&
    prev.position.y === next.position.y &&
    prev.zoom === next.zoom
  );
});

export { NodeCardMemo as NodeCard };
