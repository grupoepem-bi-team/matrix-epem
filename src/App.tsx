import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Sidebar } from "./components/Layout/Sidebar";
import { NodeDetail } from "./components/Detail/NodeDetail";
import { CreateNodeDialog } from "./components/Actions/CreateNodeDialog";
import { EditNodeDialog } from "./components/Actions/EditNodeDialog";
import { useTreeStore } from "./store/useTreeStore";

type DialogState =
  | { kind: "none" }
  | { kind: "edit"; nodeId: string }
  | { kind: "addChild"; parentId: string }
  | { kind: "addRoot" };

export const App: React.FC = () => {
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const deleteNode = useTreeStore((s) => s.deleteNode);

  const handleClose = () => setDialog({ kind: "none" });

  const handleEdit = (nodeId: string) => setDialog({ kind: "edit", nodeId });

  const handleAddChild = (parentId: string) =>
    setDialog({ kind: "addChild", parentId });

  const handleAddRoot = () => setDialog({ kind: "addRoot" });

  const handleDelete = (nodeId: string) => {
    deleteNode(nodeId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Main canvas area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas with dot grid pattern */}
        <div className="n8n-canvas flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            {/* NodeDetail takes full height when selected */}
            {selectedNodeId ? (
              <NodeDetail
                onEdit={handleEdit}
                onAddChild={handleAddChild}
                onDelete={handleDelete}
              />
            ) : (
              /* Empty state when nothing selected */
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mb-6 animate-scale-in">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-tertiary"
                  >
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-text mb-2 animate-fade-in">
                  Bienvenido al Navegador BI
                </h2>
                <p className="text-sm text-text-tertiary text-center max-w-md animate-fade-in">
                  Seleccioná un documento del árbol para ver sus detalles o usá
                  el botón "+" para crear un nuevo elemento raíz.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating action button */}
      <button
        type="button"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent hover:bg-accent-hover text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-40"
        onClick={handleAddRoot}
        title="Agregar elemento raíz"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

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
