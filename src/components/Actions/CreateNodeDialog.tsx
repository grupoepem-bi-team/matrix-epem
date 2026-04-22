import { useState, useRef, useEffect, useCallback } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import type { NodeType } from "@/types";

/* ────────────────────────────────────────────── */
/*  Props                                        */
/* ────────────────────────────────────────────── */

interface CreateNodeDialogProps {
  /** If provided, the new node will be created as a child of this parent */
  parentId?: string;
  /** Callback to dismiss the panel */
  onClose: () => void;
}

/* ────────────────────────────────────────────── */
/*  Local state shape for metadata entries       */
/* ────────────────────────────────────────────── */

interface MetadataEntry {
  id: number;
  key: string;
  value: string;
}

/* ────────────────────────────────────────────── */
/*  Component                                    */
/* ────────────────────────────────────────────── */

let metadataIdCounter = 0;

export function CreateNodeDialog({ parentId, onClose }: CreateNodeDialogProps) {
  const createChildNode = useTreeStore((s) => s.createChildNode);
  const createRootNode = useTreeStore((s) => s.createRootNode);
  const expandNode = useTreeStore((s) => s.expandNode);

  /* ── Form state ── */
  const [name, setName] = useState("");
  const [nodeType, setNodeType] = useState<NodeType>("folder");
  const [description, setDescription] = useState("");
  const [metadataEntries, setMetadataEntries] = useState<MetadataEntry[]>([]);
  const [nameError, setNameError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ── Ref for auto-focus ── */
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  /* ── Metadata helpers ── */
  const addMetadataEntry = useCallback(() => {
    metadataIdCounter += 1;
    setMetadataEntries((prev) => [...prev, { id: metadataIdCounter, key: "", value: "" }]);
  }, []);

  const removeMetadataEntry = useCallback((entryId: number) => {
    setMetadataEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const updateMetadataKey = useCallback((entryId: number, newKey: string) => {
    setMetadataEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, key: newKey } : e)));
  }, []);

  const updateMetadataValue = useCallback((entryId: number, newValue: string) => {
    setMetadataEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, value: newValue } : e)),
    );
  }, []);

  /* ── Convert metadata entries to Record ── */
  const buildMetadata = useCallback((): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const entry of metadataEntries) {
      const trimmedKey = entry.key.trim();
      if (trimmedKey.length > 0) {
        result[trimmedKey] = entry.value;
      }
    }
    return result;
  }, [metadataEntries]);

  /* ── Validation ── */
  const validate = useCallback((): boolean => {
    const isValid = name.trim().length > 0;
    setNameError(!isValid);
    return isValid;
  }, [name]);

  /* ── Submit handler ── */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitted(true);

      if (!validate()) return;

      const data = {
        name: name.trim(),
        type: nodeType,
        description: description.trim() || undefined,
        metadata: buildMetadata(),
      };

      if (parentId) {
        createChildNode(parentId, data);
        expandNode(parentId);
      } else {
        createRootNode(data);
      }

      onClose();
    },
    [
      validate,
      name,
      nodeType,
      description,
      buildMetadata,
      parentId,
      createChildNode,
      createRootNode,
      expandNode,
      onClose,
    ],
  );

  /* ── Escape key handler ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  /* ── Render ── */
  return (
    <div className="animate-slide-up">
      <div className="n8n-card p-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-n8n-text">
            {parentId ? "Nuevo nodo hijo" : "Nuevo nodo raíz"}
          </h3>
          <button
            type="button"
            className="n8n-btn n8n-btn--ghost n8n-btn--icon n8n-btn--sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <div className="n8n-divider" />

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Name ── */}
          <div className="mb-4">
            <label
              htmlFor="create-node-name"
              className="block text-sm font-medium text-n8n-text-secondary mb-1"
            >
              Nombre <span className="text-n8n-danger">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="create-node-name"
              type="text"
              className={`n8n-input ${nameError && submitted ? "border-n8n-danger" : ""}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim().length > 0) setNameError(false);
              }}
              placeholder="Ingrese el nombre del nodo"
              autoComplete="off"
            />
            {nameError && submitted && (
              <p className="mt-1 text-xs text-n8n-danger">El nombre es obligatorio</p>
            )}
          </div>

          {/* ── Type (radio) ── */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-n8n-text-secondary mb-2">Tipo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="node-type"
                  value="folder"
                  checked={nodeType === "folder"}
                  onChange={() => setNodeType("folder")}
                  className="accent-n8n-accent"
                />
                <span className="n8n-badge n8n-badge--folder">Carpeta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="node-type"
                  value="document"
                  checked={nodeType === "document"}
                  onChange={() => setNodeType("document")}
                  className="accent-n8n-accent"
                />
                <span className="n8n-badge n8n-badge--document">Documento</span>
              </label>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="mb-4">
            <label
              htmlFor="create-node-desc"
              className="block text-sm font-medium text-n8n-text-secondary mb-1"
            >
              Descripción
            </label>
            <textarea
              id="create-node-desc"
              className="n8n-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional del nodo"
              style={{ resize: "vertical" }}
            />
          </div>

          {/* ── Metadata ── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-n8n-text-secondary">Metadatos</label>
              <button
                type="button"
                className="n8n-btn n8n-btn--ghost n8n-btn--sm"
                onClick={addMetadataEntry}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="7" y1="1" x2="7" y2="13" />
                  <line x1="1" y1="7" x2="13" y2="7" />
                </svg>
                Agregar
              </button>
            </div>

            {metadataEntries.length === 0 && (
              <p className="text-xs text-n8n-text-tertiary italic">
                Sin metadatos. Hacé clic en "Agregar" para añadir pares clave-valor.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {metadataEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="n8n-input"
                    style={{ flex: 1 }}
                    value={entry.key}
                    onChange={(e) => updateMetadataKey(entry.id, e.target.value)}
                    placeholder="Clave"
                    autoComplete="off"
                  />
                  <span className="text-n8n-text-tertiary text-sm">=</span>
                  <input
                    type="text"
                    className="n8n-input"
                    style={{ flex: 1 }}
                    value={entry.value}
                    onChange={(e) => updateMetadataValue(entry.id, e.target.value)}
                    placeholder="Valor"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="n8n-btn n8n-btn--ghost n8n-btn--icon n8n-btn--sm"
                    onClick={() => removeMetadataEntry(entry.id)}
                    aria-label="Eliminar metadato"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="3" y1="3" x2="11" y2="11" />
                      <line x1="11" y1="3" x2="3" y2="11" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="n8n-divider" />

          {/* ── Action buttons ── */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <button type="button" className="n8n-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="n8n-btn n8n-btn--primary">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="7" y1="1" x2="7" y2="13" />
                <line x1="1" y1="7" x2="13" y2="7" />
              </svg>
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
