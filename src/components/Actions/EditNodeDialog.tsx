import { useState, useEffect, useRef, useCallback } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import { findNodeById } from "@/utils/tree";
import { getNodeTypeConfigOrDefault } from "@/registry";

/* ────────────────────────────────────────────── */
/*  Types                                        */
/* ────────────────────────────────────────────── */

interface EditNodeDialogProps {
  nodeId: string;
  onClose: () => void;
}

interface MetadataEntry {
  id: string;
  key: string;
  value: string;
}

/* ────────────────────────────────────────────── */
/*  Helpers                                      */
/* ────────────────────────────────────────────── */

const generateEntryId = (): string => crypto.randomUUID();

const formatDateEsAR = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ────────────────────────────────────────────── */
/*  Component                                    */
/* ────────────────────────────────────────────── */

export function EditNodeDialog({ nodeId, onClose }: EditNodeDialogProps) {
  const nodes = useTreeStore((s) => s.nodes);
  const updateNode = useTreeStore((s) => s.updateNode);

  const node = findNodeById(nodes, nodeId);

  /* ── Form state ── */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metadataEntries, setMetadataEntries] = useState<MetadataEntry[]>([]);
  const [nameError, setNameError] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  /* ── Pre-fill fields when node becomes available ── */
  useEffect(() => {
    if (!node) return;

    // Capture node data to avoid stale references in deferred update
    const nodeName = node.name;
    const nodeDescription = node.description;
    const nodeMetadata = node.metadata;

    // Defer setState to avoid synchronous state update in effect
    // which can trigger cascading renders
    queueMicrotask(() => {
      setName(nodeName);
      setDescription(nodeDescription);

      const entries: MetadataEntry[] = Object.entries(nodeMetadata).map(([k, v]) => ({
        id: generateEntryId(),
        key: k,
        value: v,
      }));
      setMetadataEntries(entries);
    });
  }, [node]);

  /* ── Auto-focus name field on mount ── */
  useEffect(() => {
    // Small delay so the pre-fill effect runs first
    const timer = setTimeout(() => {
      nameRef.current?.focus();
      nameRef.current?.select();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  /* ── Metadata helpers ── */
  const addMetadataEntry = useCallback(() => {
    setMetadataEntries((prev) => [...prev, { id: generateEntryId(), key: "", value: "" }]);
  }, []);

  const removeMetadataEntry = useCallback((entryId: string) => {
    setMetadataEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const updateMetadataEntry = useCallback(
    (entryId: string, field: "key" | "value", val: string) => {
      setMetadataEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, [field]: val } : e)),
      );
    },
    [],
  );

  /* ── Validation ── */
  const validate = (): boolean => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      nameRef.current?.focus();
      return false;
    }
    setNameError(false);
    return true;
  };

  /* ── Submit ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !node) return;

    // Build metadata object, skipping entries with empty keys
    const metadata: Record<string, string> = {};
    for (const entry of metadataEntries) {
      const trimmedKey = entry.key.trim();
      if (trimmedKey) {
        metadata[trimmedKey] = entry.value;
      }
    }

    updateNode(nodeId, {
      name: name.trim(),
      description: description.trim(),
      metadata,
    });

    onClose();
  };

  /* ── Cancel ── */
  const handleCancel = () => {
    onClose();
  };

  /* ── Handle Escape key ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  /* ── Guard: node not found ── */
  if (!node) {
    return (
      <div className="animate-slide-up" onKeyDown={handleKeyDown}>
        <div className="n8n-card p-6">
          <p className="text-sm text-(--color-n8n-text-tertiary)">
            No se encontró el nodo solicitado.
          </p>
          <button
            type="button"
            className="n8n-btn n8n-btn--ghost n8n-btn--sm mt-3"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const config = getNodeTypeConfigOrDefault(node.type);

  return (
    <div className="animate-slide-up" onKeyDown={handleKeyDown}>
      <div className="n8n-card p-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-(--color-n8n-text)">Editar nodo</h3>
          <button
            type="button"
            className="n8n-btn n8n-btn--ghost n8n-btn--icon n8n-btn--sm"
            onClick={handleCancel}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="n8n-divider" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* ── Node type (read-only) ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-(--color-n8n-text-secondary)">Tipo</label>
            <span className={config.badgeClass}>{config.label.toUpperCase()}</span>
          </div>

          {/* ── Name ── */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-node-name"
              className="text-xs font-medium text-(--color-n8n-text-secondary)"
            >
              Nombre <span className="text-(--color-n8n-danger)">*</span>
            </label>
            <input
              ref={nameRef}
              id="edit-node-name"
              type="text"
              className={`n8n-input ${nameError ? "border-(--color-n8n-danger)" : ""}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(false);
              }}
              placeholder="Nombre del nodo"
              autoComplete="off"
            />
            {nameError && (
              <span className="text-xs text-(--color-n8n-danger)">El nombre es obligatorio</span>
            )}
          </div>

          {/* ── Description ── */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-node-description"
              className="text-xs font-medium text-(--color-n8n-text-secondary)"
            >
              Descripción
            </label>
            <textarea
              id="edit-node-description"
              className="n8n-input resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional del nodo"
            />
          </div>

          {/* ── Metadata ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-(--color-n8n-text-secondary)">
                Metadatos
              </label>
              <button
                type="button"
                className="n8n-btn n8n-btn--ghost n8n-btn--sm"
                onClick={addMetadataEntry}
              >
                + Agregar
              </button>
            </div>

            {metadataEntries.length === 0 && (
              <p className="text-xs text-(--color-n8n-text-tertiary)">
                Sin metadatos. Presioná "Agregar" para añadir campos.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {metadataEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="n8n-input flex-1"
                    value={entry.key}
                    onChange={(e) => updateMetadataEntry(entry.id, "key", e.target.value)}
                    placeholder="Clave"
                    autoComplete="off"
                  />
                  <input
                    type="text"
                    className="n8n-input flex-1"
                    value={entry.value}
                    onChange={(e) => updateMetadataEntry(entry.id, "value", e.target.value)}
                    placeholder="Valor"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="n8n-btn n8n-btn--ghost n8n-btn--icon n8n-btn--sm text-(--color-n8n-danger)"
                    onClick={() => removeMetadataEntry(entry.id)}
                    aria-label="Eliminar metadato"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="n8n-divider" />

          {/* ── Last modified ── */}
          <p className="text-xs text-(--color-n8n-text-tertiary)">
            Última modificación: {formatDateEsAR(node.updatedAt)}
          </p>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" className="n8n-btn n8n-btn--sm" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="n8n-btn n8n-btn--primary n8n-btn--sm">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditNodeDialog;
