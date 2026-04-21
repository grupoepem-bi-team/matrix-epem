import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Sidebar } from './components/Layout/Sidebar';
import { NodeDetail } from './components/Detail/NodeDetail';
import { CreateNodeDialog } from './components/Actions/CreateNodeDialog';
import { EditNodeDialog } from './components/Actions/EditNodeDialog';

/* ────────────────────────────────────────────── */
/*  Dialog state type                            */
/* ────────────────────────────────────────────── */

type DialogState =
  | { kind: 'none' }
  | { kind: 'edit'; nodeId: string }
  | { kind: 'addChild'; parentId: string }
  | { kind: 'addRoot' };

/* ────────────────────────────────────────────── */
/*  App Component                                */
/* ────────────────────────────────────────────── */

export default function App() {
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });

  /* ── Dialog openers ── */
  const handleEdit = useCallback((nodeId: string) => {
    setDialog({ kind: 'edit', nodeId });
  }, []);

  const handleAddChild = useCallback((parentId: string) => {
    setDialog({ kind: 'addChild', parentId });
  }, []);

  const handleAddRoot = useCallback(() => {
    setDialog({ kind: 'addRoot' });
  }, []);

  /* ── Dialog closer ── */
  const handleCloseDialog = useCallback(() => {
    setDialog({ kind: 'none' });
  }, []);

  /* ── Derived flags ── */
  const isEditing = dialog.kind === 'edit';
  const isAddingChild = dialog.kind === 'addChild';
  const isAddingRoot = dialog.kind === 'addRoot';
  const showDialog = dialog.kind !== 'none';

  return (
    <div className="flex h-full">
      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Main content area ── */}
      <main className="flex-1 relative overflow-y-auto bg-n8n-bg">
        {/* Node detail or empty state */}
        <div className="max-w-3xl mx-auto py-6 px-6">
          <NodeDetail onEdit={handleEdit} onAddChild={handleAddChild} />
        </div>

        {/* ── Dialog overlay ── */}
        {showDialog && (
          <div
            className="absolute inset-0 z-40 flex items-start justify-center pt-20 px-4 bg-[rgba(0,0,0,0.3)] animate-fade-in overflow-y-auto"
            onClick={(e) => {
              // Close dialog when clicking the backdrop itself
              if (e.target === e.currentTarget) {
                handleCloseDialog();
              }
            }}
          >
            <div className="w-full max-w-lg">
              {isEditing && (
                <EditNodeDialog
                  nodeId={(dialog as { kind: 'edit'; nodeId: string }).nodeId}
                  onClose={handleCloseDialog}
                />
              )}
              {isAddingChild && (
                <CreateNodeDialog
                  parentId={(dialog as { kind: 'addChild'; parentId: string }).parentId}
                  onClose={handleCloseDialog}
                />
              )}
              {isAddingRoot && (
                <CreateNodeDialog
                  onClose={handleCloseDialog}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Floating add root button ── */}
        <button
          type="button"
          className="n8n-btn n8n-btn--primary n8n-btn--icon fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full shadow-[var(--shadow-elevated)] hover:scale-105 active:scale-95 transition-transform"
          onClick={handleAddRoot}
          aria-label="Agregar nodo raíz"
          title="Agregar nodo raíz"
        >
          <Plus size={22} />
        </button>
      </main>
    </div>
  );
}
