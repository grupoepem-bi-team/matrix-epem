import React from "react";
import { FileText, ChevronRight, Edit, Trash2, Plus } from "lucide-react";
import { useTreeStore } from "@/store/useTreeStore";
import { findNodeById, getNodePath } from "@/utils/tree";
import { getNodeTypeConfigOrDefault } from "@/registry";

interface NodeDetailProps {
  onEdit: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeDetail: React.FC<NodeDetailProps> = ({ onEdit, onAddChild, onDelete }) => {
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const nodes = useTreeStore((s) => s.nodes);
  const selectNode = useTreeStore((s) => s.selectNode);

  const selectedNode = selectedNodeId ? findNodeById(nodes, selectedNodeId) : null;
  const path = selectedNodeId ? getNodePath(nodes, selectedNodeId) : [];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!selectedNode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
          <FileText size={32} className="text-text-tertiary opacity-40" />
        </div>
        <h3 className="text-lg font-medium text-text mb-1">Selecciona un documento</h3>
        <p className="text-sm text-text-tertiary text-center max-w-sidebar">
          Haz click en un nodo del arbol para ver su informacion aqui.
        </p>
      </div>
    );
  }

  const config = getNodeTypeConfigOrDefault(selectedNode.type);
  const IconComponent = config.icon;

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="n8n-breadcrumb mb-6 flex items-center gap-1 flex-wrap">
        {path.map((p, i) => (
          <React.Fragment key={p.id}>
            {i > 0 && (
              <ChevronRight size={12} className="n8n-breadcrumb__separator text-text-tertiary" />
            )}
            <button
              className="n8n-breadcrumb__item text-text-secondary hover:text-accent"
              onClick={() => selectNode(p.id)}
            >
              {p.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="n8n-card p-6 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: config.iconBg,
              border: `1px solid ${config.color}4D`,
            }}
          >
            <IconComponent size={24} style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={config.badgeClass}>{config.label.toUpperCase()}</span>
            <h2 className="text-xl font-semibold text-text truncate mt-1">{selectedNode.name}</h2>
          </div>
        </div>
        {selectedNode.description && (
          <p className="text-sm text-text-secondary leading-relaxed mb-5">
            {selectedNode.description}
          </p>
        )}
        {Object.keys(selectedNode.metadata).length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
              Metadatos
            </h4>
            <table className="n8n-meta-table">
              <tbody>
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-xs text-text-tertiary">
          <p>
            Creado:{" "}
            <span className="text-text-secondary">{formatDate(selectedNode.createdAt)}</span>
          </p>
          <p>
            Actualizado:{" "}
            <span className="text-text-secondary">{formatDate(selectedNode.updatedAt)}</span>
          </p>
        </div>
      </div>

      {config.canHaveChildren && selectedNode.children.length > 0 && (
        <div className="n8n-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-text">Contenido</h4>
              <p className="text-xs text-text-tertiary mt-0.5">
                {selectedNode.children.length} elemento
                {selectedNode.children.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              className="n8n-btn n8n-btn--primary n8n-btn--sm"
              onClick={() => onAddChild(selectedNode.id)}
            >
              <Plus size={14} />
              Agregar
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="n8n-btn n8n-btn--ghost flex-1"
          onClick={() => onEdit(selectedNode.id)}
        >
          <Edit size={14} />
          Editar
        </button>
        {config.canHaveChildren && (
          <button
            type="button"
            className="n8n-btn n8n-btn--ghost"
            onClick={() => onAddChild(selectedNode.id)}
          >
            <Plus size={14} />
            Agregar hijo
          </button>
        )}
        <button
          type="button"
          className="n8n-btn n8n-btn--danger"
          onClick={() => onDelete(selectedNode.id)}
        >
          <Trash2 size={14} />
          Eliminar
        </button>
      </div>
    </div>
  );
};
