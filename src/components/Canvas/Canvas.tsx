import React, { useState, useCallback, useRef } from "react";
import { useTreeStore } from "../../store/useTreeStore";
import { NodeCard, NODE_WIDTH, NODE_HEIGHT } from "./NodeCard";
import { ConnectionLine } from "./ConnectionLine";
import type { TreeNode, Position } from "../../types";

interface CanvasProps {
  onNodeSelect: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
}

/* ── Helpers ─────────────────────────────────── */

/** Collect every node in the tree (all levels, no filtering). */
const flattenAll = (nodeList: TreeNode[], out: TreeNode[] = []): TreeNode[] => {
  for (const n of nodeList) {
    out.push(n);
    if (n.children.length > 0) flattenAll(n.children, out);
  }
  return out;
};

interface Edge { id: string; sourceId: string; targetId: string }

/** Collect every parent→child edge in the tree. */
const collectEdges = (nodeList: TreeNode[], out: Edge[] = []): Edge[] => {
  for (const n of nodeList) {
    for (const c of n.children) {
      out.push({ id: `${n.id}→${c.id}`, sourceId: n.id, targetId: c.id });
      collectEdges([c], out);
    }
  }
  return out;
};

/** Center of the OUTPUT port (right side) of a node. */
const outputPort = (pos: Position): Position => ({
  x: pos.x + NODE_WIDTH,
  y: pos.y + NODE_HEIGHT / 2,
});

/** Center of the INPUT port (left side) of a node. */
const inputPort = (pos: Position): Position => ({
  x: pos.x,
  y: pos.y + NODE_HEIGHT / 2,
});

/* ── Component ───────────────────────────────── */

export const Canvas: React.FC<CanvasProps> = ({ onNodeSelect, onNodeMove }) => {
  const nodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const zoom = useTreeStore((s) => s.viewport.zoom);
  const pan = useTreeStore((s) => s.viewport.pan);
  const updateViewport = useTreeStore((s) => s.updateViewport);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [, setDraggingId] = useState<string | null>(null);

  /* Show EVERY node and EVERY edge — no expand/collapse filtering */
  const allNodes = flattenAll(nodes);
  const allEdges = collectEdges(nodes);

  /* ── Wheel zoom ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      updateViewport({
        zoom: Math.min(Math.max(zoom * factor, 0.15), 3),
        pan,
      });
    },
    [zoom, pan, updateViewport],
  );

  /* ── Pan ── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const t = e.target as HTMLElement;
      if (
        t === canvasRef.current ||
        t.classList.contains("canvas-bg") ||
        t.classList.contains("canvas-content")
      ) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      updateViewport({
        zoom,
        pan: { x: e.clientX - panStart.x, y: e.clientY - panStart.y },
      });
    },
    [isPanning, panStart, zoom, updateViewport],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  /* ── Node drag ── */
  const handleDragStart = useCallback((id: string) => setDraggingId(id), []);

  const handleDragMove = useCallback(
    (_id: string, _dx: number, _dy: number) => {
      /* Final position committed in handleDragEnd */
    },
    [],
  );

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      onNodeMove(id, { x, y });
      setDraggingId(null);
    },
    [onNodeMove],
  );

  return (
    <div
      ref={canvasRef}
      className="canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isPanning ? "grabbing" : "default",
      }}
    >
      {/* ── Transformed world ── */}
      <div
        className="canvas-content"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      >
        {/* Dot-grid background */}
        <div
          className="canvas-bg"
          style={{
            position: "absolute",
            top: -5000,
            left: -5000,
            width: 10000,
            height: 10000,
            pointerEvents: "none",
          }}
        />

        {/* ── SVG connections (drawn BELOW nodes) ── */}
        <svg
          style={{
            position: "absolute",
            top: -5000,
            left: -5000,
            width: 10000,
            height: 10000,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          {allEdges.map((edge) => {
            const src = allNodes.find((n) => n.id === edge.sourceId);
            const tgt = allNodes.find((n) => n.id === edge.targetId);
            if (!src?.position || !tgt?.position) return null;
            const isActive =
              selectedNodeId === edge.sourceId ||
              selectedNodeId === edge.targetId;
            return (
              <ConnectionLine
                key={edge.id}
                startX={outputPort(src.position).x}
                startY={outputPort(src.position).y}
                endX={inputPort(tgt.position).x}
                endY={inputPort(tgt.position).y}
                selected={isActive}
              />
            );
          })}
        </svg>

        {/* ── Nodes ── */}
        <div style={{ position: "absolute", inset: 0 }}>
          {allNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              position={node.position ?? { x: 80, y: 80 }}
              onSelect={onNodeSelect}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
