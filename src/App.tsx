import React, { useState, useCallback } from "react";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Database,
  X,
  RotateCcw,
} from "lucide-react";
import { useTreeStore } from "./store/useTreeStore";
import { Canvas } from "./components/Canvas/Canvas";
import { NodeDetail } from "./components/Detail/NodeDetail";
import { CreateNodeDialog } from "./components/Actions/CreateNodeDialog";
import { EditNodeDialog } from "./components/Actions/EditNodeDialog";
import type { Position } from "./types";

type DialogState =
  | { kind: "none" }
  | { kind: "edit"; nodeId: string }
  | { kind: "addChild"; parentId: string }
  | { kind: "addRoot" };

export const App: React.FC = () => {
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [showPanel, setShowPanel] = useState(false);

  const deleteNode = useTreeStore((s) => s.deleteNode);
  const updateNodePosition = useTreeStore((s) => s.updateNodePosition);
  const zoom = useTreeStore((s) => s.viewport.zoom);
  const pan = useTreeStore((s) => s.viewport.pan);
  const updateViewport = useTreeStore((s) => s.updateViewport);
  const resetToDefault = useTreeStore((s) => s.resetToDefault);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  const handleClose = () => setDialog({ kind: "none" });
  const handleEdit = (nodeId: string) => setDialog({ kind: "edit", nodeId });
  const handleAddChild = (parentId: string) =>
    setDialog({ kind: "addChild", parentId });
  const handleAddRoot = () => setDialog({ kind: "addRoot" });

  const handleDelete = (nodeId: string) => {
    deleteNode(nodeId);
    setShowPanel(false);
  };

  const handleNodeSelect = useCallback((nodeId: string) => {
    useTreeStore.getState().selectNode(nodeId);
    setShowPanel(true);
  }, []);

  const handleNodeMove = useCallback(
    (nodeId: string, position: Position) => {
      updateNodePosition(nodeId, position);
    },
    [updateNodePosition],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#12121a",
      }}
    >
      {/* ══════════════════════════════════════════════ */}
      {/*  TOP BAR                                      */}
      {/* ══════════════════════════════════════════════ */}
      <header className="app-topbar">
        {/* Left – logo + workflow name */}
        <div className="app-topbar__left">
          <div className="app-topbar__logo">
            <Database size={15} />
          </div>
          <span className="app-topbar__name">EPEM BI</span>
          <span className="app-topbar__sep" />
          <span className="app-topbar__wf">
            Documentos
            <ChevronDown size={13} style={{ marginLeft: 4, opacity: 0.5 }} />
          </span>
        </div>

        {/* Right – actions */}
        <div className="app-topbar__right">
          <button
            type="button"
            className="n8n-btn n8n-btn--ghost n8n-btn--sm"
            onClick={resetToDefault}
            title="Reiniciar datos"
          >
            <RotateCcw size={13} />
            Reiniciar
          </button>
          <button
            type="button"
            className="n8n-btn n8n-btn--primary"
            onClick={handleAddRoot}
          >
            <Plus size={14} />
            Agregar Nodo
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════ */}
      {/*  CANVAS + RIGHT PANEL                         */}
      {/* ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Canvas onNodeSelect={handleNodeSelect} onNodeMove={handleNodeMove} />

          {/* Zoom controls – bottom right */}
          <div className="zoom-controls">
            <button
              type="button"
              className="n8n-btn n8n-btn--icon"
              onClick={() =>
                updateViewport({ zoom: Math.min(zoom * 1.2, 2.5), pan })
              }
              title="Acercar"
            >
              <ZoomIn size={15} />
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="n8n-btn n8n-btn--icon"
              onClick={() =>
                updateViewport({ zoom: Math.max(zoom * 0.8, 0.2), pan })
              }
              title="Alejar"
            >
              <ZoomOut size={15} />
            </button>
            <div className="zoom-divider" />
            <button
              type="button"
              className="n8n-btn n8n-btn--icon"
              onClick={() => updateViewport({ zoom: 1, pan: { x: 80, y: 80 } })}
              title="Restablecer vista"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* ── Node detail panel ── */}
        {showPanel && selectedNodeId && (
          <aside className="detail-panel">
            <button
              type="button"
              className="detail-panel__close"
              onClick={() => setShowPanel(false)}
              title="Cerrar panel"
            >
              <X size={16} />
            </button>
            <NodeDetail
              onEdit={handleEdit}
              onAddChild={handleAddChild}
              onDelete={handleDelete}
            />
          </aside>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  DIALOGS                                       */}
      {/* ══════════════════════════════════════════════ */}
      {dialog.kind === "edit" && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="modal-backdrop" />
          <div className="modal-content animate-slide-up">
            <EditNodeDialog nodeId={dialog.nodeId} onClose={handleClose} />
          </div>
        </div>
      )}

      {(dialog.kind === "addChild" || dialog.kind === "addRoot") && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="modal-backdrop" />
          <div className="modal-content animate-slide-up">
            <CreateNodeDialog
              parentId={
                dialog.kind === "addChild" ? dialog.parentId : undefined
              }
              onClose={handleClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
