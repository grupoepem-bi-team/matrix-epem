import { Database, RotateCcw } from 'lucide-react';
import { useTreeStore } from '../../store/useTreeStore';
import { SearchBar } from '../Search/SearchBar';
import { TreeView } from '../Tree/TreeView';

/* ────────────────────────────────────────────── */
/*  Sidebar                                      */
/*                                               */
/*  Fixed-width left panel with the app header,  */
/*  search bar, document tree, and a footer with  */
/*  a reset-to-defaults action.                   */
/* ────────────────────────────────────────────── */

export const Sidebar: React.FC = () => {
  const resetToDefault = useTreeStore((s) => s.resetToDefault);

  return (
    <aside
      className="n8n-sidebar flex flex-col h-full border-r border-n8n-sidebar-border"
      style={{
        width: 'var(--spacing-sidebar)',
        minWidth: 'var(--spacing-sidebar)',
        backgroundColor: 'var(--color-n8n-sidebar)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 border-b border-n8n-sidebar-border shrink-0"
      >
        <Database
          size={20}
          className="text-n8n-accent shrink-0"
          strokeWidth={2}
        />
        <span
          className="text-n8n-text-inverse font-semibold tracking-tight select-none"
          style={{ fontSize: '16px', lineHeight: 1 }}
        >
          EPEM BI
        </span>
      </div>

      {/* ── Search ── */}
      <div className="px-3 py-3 shrink-0">
        <SearchBar />
      </div>

      {/* ── Tree (flex-1 to take remaining space, scrollable) ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <TreeView />
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-n8n-sidebar-border px-3 py-2.5 flex items-center justify-between">
        <button
          type="button"
          className="n8n-btn n8n-btn--ghost n8n-btn--sm text-n8n-text-inverse-secondary hover:text-n8n-accent transition-colors"
          onClick={resetToDefault}
          title="Restaurar datos predeterminados"
        >
          <RotateCcw size={14} />
          Reiniciar datos
        </button>
        <span
          className="text-n8n-text-inverse-secondary select-none"
          style={{ fontSize: '11px', opacity: 0.6 }}
        >
          v0.1.0
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
