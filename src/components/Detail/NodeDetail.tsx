import { useMemo } from 'react';
import { useTreeStore } from '../../store/useTreeStore';
import { findNodeById, getNodePath } from '../../utils/tree';
import type { TreeNode } from '../../types';

/* ────────────────────────────────────────────── */
/*  Props                                        */
/* ────────────────────────────────────────────── */

interface NodeDetailProps {
  /** Called when the user clicks the Edit action button */
  onEdit?: (nodeId: string) => void;
  /** Called when the user clicks the "Add child" button on a folder */
  onAddChild?: (parentId: string) => void;
}

/* ────────────────────────────────────────────── */
/*  Helpers                                      */
/* ────────────────────────────────────────────── */

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const TYPE_LABELS: Record<TreeNode['type'], string> = {
  folder: 'Carpeta',
  document: 'Documento',
};

/* ────────────────────────────────────────────── */
/*  Component                                    */
/* ────────────────────────────────────────────── */

export function NodeDetail({ onEdit, onAddChild }: NodeDetailProps) {
  const nodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const selectNode = useTreeStore((s) => s.selectNode);
  const deleteNode = useTreeStore((s) => s.deleteNode);

  const selectedNode = useMemo<TreeNode | null>(
    () => (selectedNodeId ? findNodeById(nodes, selectedNodeId) : null),
    [nodes, selectedNodeId],
  );

  const breadcrumbPath = useMemo<TreeNode[]>(
    () => (selectedNodeId ? getNodePath(nodes, selectedNodeId) : []),
    [nodes, selectedNodeId],
  );

  const metadataEntries = useMemo<[string, string][]>(
    () => (selectedNode ? Object.entries(selectedNode.metadata) : []),
    [selectedNode],
  );

  /* ── Empty state ── */

  if (!selectedNode) {
    return (
      <div className="empty-state">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--color-n8n-text-secondary)',
            maxWidth: '240px',
          }}
        >
          Seleccioná un documento para ver sus detalles
        </p>
      </div>
    );
  }

  /* ── Detail view ── */

  const badgeClass =
    selectedNode.type === 'folder'
      ? 'n8n-badge n8n-badge--folder'
      : 'n8n-badge n8n-badge--document';

  const childCount = selectedNode.children.length;
  const childLabel =
    childCount === 1 ? 'elemento hijo' : 'elementos hijos';

  return (
    <div
      key={selectedNode.id}
      className="animate-fade-in"
      style={{ padding: '20px' }}
    >
      {/* ── Breadcrumb ── */}
      <nav
        aria-label="Ruta del nodo"
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2px',
          fontSize: '13px',
        }}
      >
        {breadcrumbPath.map((node, index) => {
          const isLast = index === breadcrumbPath.length - 1;
          return (
            <span
              key={node.id}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              {index > 0 && (
                <span style={{ color: 'var(--color-n8n-text-tertiary)', margin: '0 2px' }}>
                  /
                </span>
              )}
              {isLast ? (
                <span
                  style={{ color: 'var(--color-n8n-text)', fontWeight: 600 }}
                >
                  {node.name}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => selectNode(node.id)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--color-n8n-accent)',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {node.name}
                </button>
              )}
            </span>
          );
        })}
      </nav>

      {/* ── Detail Card ── */}
      <div className="n8n-card" style={{ padding: '24px' }}>
        {/* Badge + Name */}
        <div>
          <span className={badgeClass}>{TYPE_LABELS[selectedNode.type]}</span>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              marginTop: '8px',
              color: 'var(--color-n8n-text)',
              lineHeight: 1.3,
            }}
          >
            {selectedNode.name}
          </h2>
        </div>

        {/* Description */}
        {selectedNode.description && (
          <>
            <div className="n8n-divider" />
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-n8n-text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {selectedNode.description}
            </p>
          </>
        )}

        {/* Metadata table */}
        {metadataEntries.length > 0 && (
          <>
            <div className="n8n-divider" />
            <div>
              <h3
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-n8n-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  margin: '0 0 8px 0',
                }}
              >
                Metadatos
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                  {metadataEntries.map(([key, value]) => (
                    <tr
                      key={key}
                      style={{ borderBottom: '1px solid var(--color-n8n-border-light)' }}
                    >
                      <td
                        style={{
                          padding: '8px 12px 8px 0',
                          color: 'var(--color-n8n-text-secondary)',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          width: '40%',
                        }}
                      >
                        {key}
                      </td>
                      <td style={{ padding: '8px 0', color: 'var(--color-n8n-text)' }}>
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Folder-specific: child count + Add child button */}
        {selectedNode.type === 'folder' && (
          <>
            <div className="n8n-divider" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--color-n8n-text-secondary)' }}>
                {childCount} {childLabel}
              </span>
              {onAddChild && (
                <button
                  type="button"
                  className="n8n-btn n8n-btn--primary n8n-btn--sm"
                  onClick={() => onAddChild(selectedNode.id)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14m-7-7h14" />
                  </svg>
                  Agregar hijo
                </button>
              )}
            </div>
          </>
        )}

        {/* Dates */}
        <div className="n8n-divider" />
        <div
          style={{
            display: 'flex',
            gap: '24px',
            fontSize: '12px',
            color: 'var(--color-n8n-text-tertiary)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span style={{ fontWeight: 600 }}>Creado:</span>{' '}
            {formatDate(selectedNode.createdAt)}
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>Modificado:</span>{' '}
            {formatDate(selectedNode.updatedAt)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="n8n-divider" />
        <div style={{ display: 'flex', gap: '8px' }}>
          {onEdit && (
            <button
              type="button"
              className="n8n-btn n8n-btn--sm"
              onClick={() => onEdit(selectedNode.id)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          )}
          <button
            type="button"
            className="n8n-btn n8n-btn--sm n8n-btn--danger"
            onClick={() => deleteNode(selectedNode.id)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 0v10m4-10v10m1-10V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default NodeDetail;
