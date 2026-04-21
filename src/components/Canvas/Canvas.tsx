import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTreeStore } from "../../store/useTreeStore";
import { NodeCard } from "./NodeCard";
import { ConnectionLine } from "./ConnectionLine";
import type { TreeNode, NodeConnection, Position } from "../../types";

interface CanvasProps {
  onNodeSelect: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: Position) => void;
}

export const Canvas: React.FC<CanvasProps> = ({ onNodeSelect, onNodeMove }) => {
  const nodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const expandedNodeIds = useTreeStore((s) => s.expandedNodeIds);
  const zoom = useTreeStore((s) => s.viewport.zoom);
  const pan = useTreeStore((s) => s.viewport.pan);
  const updateViewport = useTreeStore((s) => s.updateViewport);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Flatten all visible nodes for rendering
  const flattenNodes = (
    nodeList: TreeNode[],
    result: TreeNode[] = [],
  ): TreeNode[] => {
    for (const node of nodeList) {
      result.push(node);
      if (node.type === "folder" && expandedNodeIds.includes(node.id)) {
        flattenNodes(node.children, result);
      }
    }
    return result;
  };

  const visibleNodes = flattenNodes(nodes);

  // Generate connections from parent to children
  const connections: NodeConnection[] = [];
  const createConnections = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      if (node.type === "folder" && expandedNodeIds.includes(node.id)) {
        for (const child of node.children) {
          connections.push({
            id: `${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: "hierarchy",
            createdAt: new Date().toISOString(),
          });
          if (child.type === "folder") {
            createConnections([child]);
          }
        }
      }
    }
  };
  createConnections(nodes);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * delta, 0.25), 2);
      updateViewport({ zoom: newZoom, pan });
    },
    [zoom, pan, updateViewport],
  );

  // Handle pan start (middle click or space+click)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === canvasRef.current ||
        (e.target as HTMLElement).classList.contains("canvas-bg")
      ) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [pan],
  );

  // Handle pan move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        updateViewport({
          zoom,
          pan: { x: e.clientX - panStart.x, y: e.clientY - panStart.y },
        });
      }
    },
    [isPanning, panStart, zoom, updateViewport],
  );

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle node drag start
  const handleNodeDragStart = useCallback((nodeId: string) => {
    setDraggingNodeId(nodeId);
  }, []);

  // Handle node drag move
  const handleNodeDragMove = useCallback(
    (nodeId: string, deltaX: number, deltaY: number) => {
      // Will be handled by NodeCard
    },
    [],
  );

  // Handle node drag end
  const handleNodeDragEnd = useCallback(
    (nodeId: string, newX: number, newY: number) => {
      onNodeMove(nodeId, { x: newX, y: newY });
      setDraggingNodeId(null);
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
        cursor: isPanning ? "grabbing" : "grab",
        position: "relative",
      }}
    >
      {/* Canvas content with transform */}
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
        {/* Dot grid background */}
        <div
          className="canvas-bg"
          style={{
            position: "absolute",
            top: -5000,
            left: -5000,
            width: 10000,
            height: 10000,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />

        {/* SVG layer for connections */}
        <svg
          className="connections-layer"
          style={{
            position: "absolute",
            top: -5000,
            left: -5000,
            width: 10000,
            height: 10000,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {connections.map((conn) => {
            const sourceNode = visibleNodes.find((n) => n.id === conn.source);
            const targetNode = visibleNodes.find((n) => n.id === conn.target);
            if (
              !sourceNode ||
              !targetNode ||
              !sourceNode.position ||
              !targetNode.position
            ) {
              return null;
            }

            const startX = sourceNode.position.x + 200; // Right edge of source
            const startY = sourceNode.position.y + 40; // Center of source
            const endX = targetNode.position.x; // Left edge of target
            const endY = targetNode.position.y + 40; // Center of target

            return (
              <ConnectionLine
                key={conn.id}
                startX={startX}
                startY={startY}
                endX={endX}
                endY={endY}
                color="#4caf50"
                animated={false}
                selected={
                  selectedNodeId === conn.source ||
                  selectedNodeId === conn.target
                }
              />
            );
          })}
        </svg>

        {/* Nodes layer */}
        <div className="nodes-layer">
          {visibleNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              position={node.position || { x: 0, y: 0 }}
              onSelect={onNodeSelect}
              onDragStart={handleNodeDragStart}
              onDragMove={handleNodeDragMove}
              onDragEnd={handleNodeDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          display: "flex",
          gap: 8,
          zIndex: 100,
        }}
      >
        <button
          className="n8n-btn n8n-btn--icon"
          onClick={() => updateViewport({ zoom: Math.min(zoom * 1.2, 2), pan })}
          style={{ minWidth: 36, height: 36 }}
        >
          +
        </button>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            color: "var(--color-text-secondary)",
            fontSize: 12,
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="n8n-btn n8n-btn--icon"
          onClick={() =>
            updateViewport({ zoom: Math.max(zoom * 0.8, 0.25), pan })
          }
          style={{ minWidth: 36, height: 36 }}
        >
          −
        </button>
      </div>
    </div>
  );
};
