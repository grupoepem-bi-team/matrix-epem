import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import { useTreeStore } from "../../store/useTreeStore";
import { NodeCard, NODE_WIDTH, NODE_HEIGHT } from "./NodeCard";
import { ConnectionLine } from "./ConnectionLine";
import type { TreeNode, Position } from "../../types";

/* ── Props ─────────────────────────────────────── */

interface CanvasProps {
  onNodeSelect: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
}

/* ── Tree helpers ───────────────────────────────── */

/** Flatten every node in the tree (depth-first, no filtering). */
const flattenAll = (nodeList: TreeNode[], out: TreeNode[] = []): TreeNode[] => {
  for (const n of nodeList) {
    out.push(n);
    if (n.children.length > 0) flattenAll(n.children, out);
  }
  return out;
};

interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

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

/* ── Constants ──────────────────────────────────── */

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;

/* ── Minimap ────────────────────────────────────── */

const MINIMAP_W = 180;
const MINIMAP_H = 120;
const MINIMAP_PAD = 12;

const Minimap: React.FC<{
  nodes: TreeNode[];
  zoom: number;
  pan: Position;
  canvasW: number;
  canvasH: number;
}> = ({ nodes, zoom, pan, canvasW, canvasH }) => {
  const allNodes = useMemo(() => flattenAll(nodes), [nodes]);

  /* Bounding box of all nodes in world-space */
  const bbox = useMemo(() => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of allNodes) {
      if (!n.position) continue;
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.position.y + NODE_HEIGHT);
    }
    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = 500;
      maxY = 400;
    }
    /* Add padding so nodes don't sit at the very edge */
    const pad = 60;
    return {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    };
  }, [allNodes]);

  /* Scale factor: fit the bounding box into the minimap */
  const scale = useMemo(
    () => Math.min(MINIMAP_W / bbox.w, MINIMAP_H / bbox.h),
    [bbox],
  );

  /* Offset so the bounding box is centered in the minimap */
  const ox = (MINIMAP_W - bbox.w * scale) / 2 - bbox.x * scale;
  const oy = (MINIMAP_H - bbox.h * scale) / 2 - bbox.y * scale;

  /* Viewport rectangle (the part of world-space currently visible) */
  const vpWorldX = -pan.x / zoom;
  const vpWorldY = -pan.y / zoom;
  const vpWorldW = canvasW / zoom;
  const vpWorldH = canvasH / zoom;

  const vpX = vpWorldX * scale + ox;
  const vpY = vpWorldY * scale + oy;
  const vpW = vpWorldW * scale;
  const vpH = vpWorldH * scale;

  return (
    <div
      style={{
        position: "absolute",
        bottom: MINIMAP_PAD,
        left: MINIMAP_PAD,
        width: MINIMAP_W,
        height: MINIMAP_H,
        background: "rgba(18, 18, 26, 0.92)",
        border: "1px solid #2a2a40",
        borderRadius: 8,
        overflow: "hidden",
        zIndex: 200,
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}
    >
      <svg width={MINIMAP_W} height={MINIMAP_H} style={{ display: "block" }}>
        {/* Nodes as tiny rounded rects */}
        {allNodes.map((n) => {
          if (!n.position) return null;
          const nx = n.position.x * scale + ox;
          const ny = n.position.y * scale + oy;
          const nw = NODE_WIDTH * scale;
          const nh = NODE_HEIGHT * scale;
          const fill = n.type === "folder" ? "#ffb74d" : "#64b5f6";
          return (
            <rect
              key={n.id}
              x={nx}
              y={ny}
              width={Math.max(nw, 2)}
              height={Math.max(nh, 2)}
              rx={2}
              fill={fill}
              opacity={0.6}
            />
          );
        })}
        {/* Viewport rectangle */}
        <rect
          x={vpX}
          y={vpY}
          width={vpW}
          height={vpH}
          fill="none"
          stroke="#ff6d5a"
          strokeWidth={1.5}
          rx={2}
          opacity={0.8}
        />
      </svg>
    </div>
  );
};

/* ── Canvas ─────────────────────────────────────── */

export const Canvas: React.FC<CanvasProps> = ({ onNodeSelect, onNodeMove }) => {
  const nodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const zoom = useTreeStore((s) => s.viewport.zoom);
  const pan = useTreeStore((s) => s.viewport.pan);
  const updateViewport = useTreeStore((s) => s.updateViewport);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  /* Track container dimensions for minimap viewport calc */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Panning state ── */
  const [isPanning, setIsPanning] = useState(false);
  const panAnchorRef = useRef<{
    mx: number;
    my: number;
    px: number;
    py: number;
  } | null>(null);
  const rafRef = useRef<number>(0);

  /* Cleanup rAF on unmount */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* Show EVERY node and EVERY edge */
  const allNodes = useMemo(() => flattenAll(nodes), [nodes]);
  const allEdges = useMemo(() => collectEdges(nodes), [nodes]);

  /* ── Wheel zoom (centered on cursor) ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.min(Math.max(zoom * factor, MIN_ZOOM), MAX_ZOOM);

      /* Zoom towards the cursor position.
         The idea: the world point under the cursor should stay under the cursor
         after the zoom change.

         screenPoint = pan + worldPoint * zoom
         After zoom change we want:
           screenPoint = newPan + worldPoint * newZoom
         => newPan = screenPoint - worldPoint * newZoom
                   = screenPoint - (screenPoint - pan) / zoom * newZoom
      */
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - ((mouseX - pan.x) / zoom) * newZoom;
      const newPanY = mouseY - ((mouseY - pan.y) / zoom) * newZoom;

      updateViewport({
        zoom: newZoom,
        pan: { x: newPanX, y: newPanY },
      });
    },
    [zoom, pan, updateViewport],
  );

  /* ── Pan: mousedown on empty canvas ── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      /* Only start panning if clicking on the canvas background itself,
         not on a node card. */
      const target = e.target as HTMLElement;
      const isBackground =
        target === containerRef.current ||
        target.classList.contains("canvas-world") ||
        target.classList.contains("canvas-grid") ||
        target.tagName === "svg" ||
        target.tagName === "rect" /* dot grid rects */ ||
        target.tagName === "circle";

      if (!isBackground) return;

      e.preventDefault();
      panAnchorRef.current = {
        mx: e.clientX,
        my: e.clientY,
        px: pan.x,
        py: pan.y,
      };
      setIsPanning(true);
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !panAnchorRef.current) return;

      const anchor = panAnchorRef.current;
      const dx = e.clientX - anchor.mx;
      const dy = e.clientY - anchor.my;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updateViewport({
          zoom,
          pan: { x: anchor.px + dx, y: anchor.py + dy },
        });
      });
    },
    [isPanning, zoom, updateViewport],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panAnchorRef.current = null;
  }, []);

  /* ── Node drag callbacks ── */
  const handleDragStart = useCallback((_id: string) => {
    /* No-op; we just need the event to stop propagation so panning doesn't start */
  }, []);

  const handleDragEnd = useCallback(
    (nodeId: string, position: Position) => {
      onNodeMove(nodeId, position);
    },
    [onNodeMove],
  );

  /* ── Compute the background grid style.
       The grid should appear to stay consistent as we zoom,
       but we don't want dots to become huge at high zoom or
       invisible at low zoom. We scale the pattern but clamp it. */
  const gridStyle = useMemo(() => {
    const baseSize = 24;
    const s = baseSize * zoom;
    const clamped = Math.max(s, 8); /* Don't let dots merge */
    return {
      backgroundSize: `${clamped}px ${clamped}px`,
      backgroundPosition: `${pan.x}px ${pan.y}px`,
    };
  }, [zoom, pan]);

  return (
    <div
      ref={containerRef}
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
        position: "relative",
        cursor: isPanning ? "grabbing" : "default",
      }}
    >
      {/* ── Dot grid background (does NOT zoom with the world,
             just pans and subtly scales the pattern) ── */}
      <div
        className="canvas-grid"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: gridStyle.backgroundSize,
          backgroundPosition: gridStyle.backgroundPosition,
        }}
      />

      {/* ── Transformed world ──
           Both SVG and node divs live inside this wrapper.
           They share the SAME coordinate space so that port
           positions in SVG match the node `left`/`top` exactly. */}
      <div
        className="canvas-world"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* ── SVG connections (rendered BELOW nodes) ── */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1,
            height: 1,
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
        {allNodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            position={node.position ?? { x: 80, y: 80 }}
            zoom={zoom}
            onSelect={onNodeSelect}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* ── Minimap ── */}
      <Minimap
        nodes={nodes}
        zoom={zoom}
        pan={pan}
        canvasW={containerSize.w}
        canvasH={containerSize.h}
      />
    </div>
  );
};
