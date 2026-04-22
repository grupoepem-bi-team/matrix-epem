import React, { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      confirmRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const variantColors = {
    danger: { icon: "#f44336", btn: "n8n-btn--danger" },
    warning: { icon: "#ff9800", btn: "n8n-btn--primary" },
    info: { icon: "#2196f3", btn: "n8n-btn--primary" },
  };

  const colors = variantColors[variant];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal-backdrop" />
      <div className="modal-content animate-slide-up" style={{ maxWidth: 400 }}>
        <div className="n8n-card p-6">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${colors.icon}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <AlertTriangle size={20} style={{ color: colors.icon }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e8e8f0", marginBottom: 6 }}>
                {title}
              </h3>
              <p style={{ fontSize: 13, color: "#a0a0b8", lineHeight: 1.5 }}>
                {message}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              className="n8n-btn"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              className={`n8n-btn ${colors.btn}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
