import React, { useState, useCallback } from "react";
import { Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const [showSidebar, setShowSidebar] = useState(true);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const deleteNode = useTreeStore((s) => s.deleteNode);
  const updateNodePosition = useTreeStore((s) => s.updateNodePosition);

  const handleClose = () => setDialog({ kind: "none" });

  const handleEdit = (nodeId: string) => setDialog({ kind: "edit", nodeId });

  const handleAddChild = (parentId: string) =>
    setDialog({ kind: "addChild", parentId });

  const handleAddRoot = () => setDialog({ kind: "addRoot" });

  const handleDelete = (nodeId: string) => {
    deleteNode(nodeId);
  };

  const handleNodeSelect = useCallback((nodeId: string) => {
    useTreeStore.getState().selectNode(nodeId);
  }, []);

  const handleNodeMove = useCallback(
    (nodeId: string, position: Position) => {
      updateNodePosition(nodeId, position);
    },
    [updateNodePosition],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-bg">
      {/* Canvas Area */}
      <div className="flex-1 relative">
        <Canvas onNodeSelect={handleNodeSelect} onNodeMove={handleNodeMove} />

        {/* Toggle Sidebar Button */}
        <button
          type="button"
          className="absolute top-4 left-4 z-50 n8n-btn n8n-btn--icon n8n-btn--ghost"
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? "Ocultar panel" : "Mostrar panel"}
        >
          {showSidebar ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>

        {/* Floating Add Button */}
        <button
          type="button"
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent hover:bg-accent-hover text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-40"
          onClick={handleAddRoot}
          title="Agregar elemento"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Right Sidebar - Node Details */}
      {showSidebar && selectedNodeId && (
        <div
          className="w-80 shrink-0 bg-panel-bg border-l border-border overflow-y-auto"
          style={{ boxShadow: "-4px 0 16px rgba(0,0,0,0.3)" }}
        >
          <NodeDetail
            onEdit={handleEdit}
            onAddChild={handleAddChild}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Dialogs */}
      {dialog.kind === "edit" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md animate-slide-up">
            <EditNodeDialog nodeId={dialog.nodeId} onClose={handleClose} />
          </div>
        </div>
      )}

      {(dialog.kind === "addChild" || dialog.kind === "addRoot") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md animate-slide-up">
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
