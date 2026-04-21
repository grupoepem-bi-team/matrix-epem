import React from "react";
import { ChevronsDown, ChevronsUp, Search, FolderOpen } from "lucide-react";
import { useTreeStore } from "../../store/useTreeStore";
import { countNodes, countFolders, countDocuments } from "../../utils/tree";
import { TreeNode } from "./TreeNode";

/* ────────────────────────────────────────────── */
/*  Main TreeView container                       */
/* ────────────────────────────────────────────── */

export const TreeView: React.FC = () => {
  const nodes = useTreeStore((s) => s.nodes);
  const searchQuery = useTreeStore((s) => s.searchQuery);
  const searchResults = useTreeStore((s) => s.searchResults);
  const expandAll = useTreeStore((s) => s.expandAll);
  const collapseAll = useTreeStore((s) => s.collapseAll);

  const isSearchMode = searchQuery.trim().length > 0;
  const hasNodes = nodes.length > 0;

  const totalNodes = countNodes(nodes);
  const folderCount = countFolders(nodes);
  const documentCount = countDocuments(nodes);

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar: Expand All / Collapse All ── */}
      {!isSearchMode && hasNodes && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-sidebar-border">
          <button
            type="button"
            className="n8n-btn n8n-btn--ghost n8n-btn--sm text-text-secondary hover:text-accent"
            onClick={expandAll}
          >
            <ChevronsDown size={14} />
            Expandir todo
          </button>
          <button
            type="button"
            className="n8n-btn n8n-btn--ghost n8n-btn--sm text-text-secondary hover:text-accent"
            onClick={collapseAll}
          >
            <ChevronsUp size={14} />
            Colapsar todo
          </button>
        </div>
      )}

      {/* ── Tree content – smooth scrolling container ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        {isSearchMode ? (
          /* ── Search mode: flat list of results ── */
          searchResults.length > 0 ? (
            <div className="tree animate-fade-in" role="list">
              {searchResults.map((node) => (
                <div key={node.id} className="level">
                  <TreeNode node={node} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={48} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm text-text-tertiary">Sin resultados</p>
              <p className="text-xs mt-1 text-text-tertiary">
                No se encontraron documentos para &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )
        ) : hasNodes ? (
          /* ── Normal mode: recursive tree ── */
          <div className="tree" role="tree">
            {nodes.map((node) => (
              <div key={node.id} className="level">
                <TreeNode node={node} />
              </div>
            ))}
          </div>
        ) : (
          /* ── Empty state: no nodes at all ── */
          <div className="empty-state animate-fade-in">
            <FolderOpen size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm text-text-tertiary">No hay documentos</p>
            <p className="text-xs mt-1 text-text-tertiary">
              Crea una carpeta para comenzar
            </p>
          </div>
        )}
      </div>

      {/* ── Footer: node count summary ── */}
      {hasNodes && <div className="n8n-divider" />}
      {hasNodes && (
        <div className="px-3 py-2 text-text-tertiary text-xs flex items-center gap-2 flex-wrap">
          {isSearchMode ? (
            <span>
              {searchResults.length} resultado
              {searchResults.length !== 1 ? "s" : ""}
            </span>
          ) : (
            <>
              <span>{totalNodes} elementos</span>
              <span className="text-border-light">·</span>
              <span>
                {folderCount} carpeta{folderCount !== 1 ? "s" : ""}
              </span>
              <span className="text-border-light">·</span>
              <span>
                {documentCount} documento{documentCount !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
