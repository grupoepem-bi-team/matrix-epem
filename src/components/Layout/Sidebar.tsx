import React from "react";
import { Database, RotateCcw } from "lucide-react";
import { SearchBar } from "../Search/SearchBar";
import { TreeView } from "../Tree/TreeView";
import { useTreeStore } from "../../store/useTreeStore";

export const Sidebar: React.FC = () => {
  const resetToDefault = useTreeStore((s) => s.resetToDefault);

  return (
    <aside className="n8n-sidebar flex flex-col h-full w-[280px] shrink-0 bg-sidebar-bg border-r border-sidebar-border">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
          <Database size={16} className="text-accent" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-text">EPEM BI</h1>
          <p className="text-[11px] text-text-tertiary">Documentos</p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-3 py-3 shrink-0">
        <SearchBar />
      </div>

      {/* ── Tree ── */}
      <div className="flex-1 overflow-hidden min-h-0">
        <TreeView />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-3 py-3 border-t border-sidebar-border shrink-0">
        <button
          type="button"
          className="n8n-btn n8n-btn--ghost n8n-btn--sm text-text-tertiary hover:text-text"
          onClick={resetToDefault}
        >
          <RotateCcw size={12} />
          Reiniciar
        </button>
        <span className="text-[11px] text-text-tertiary">v0.1.0</span>
      </div>
    </aside>
  );
};
