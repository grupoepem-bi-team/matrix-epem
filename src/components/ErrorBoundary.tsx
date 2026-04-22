import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#12121a",
          color: "#e8e8f0",
          fontFamily: "Inter, sans-serif",
          padding: "2rem",
        }}>
          <div style={{
            background: "#1e1e2f",
            border: "1px solid #f44336",
            borderRadius: 12,
            padding: "2rem",
            maxWidth: 480,
            textAlign: "center",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#f44336" }}>
              Algo salió mal
            </h2>
            <p style={{ fontSize: 13, color: "#a0a0b8", marginBottom: 16 }}>
              Se produjo un error inesperado en la aplicación.
            </p>
            <pre style={{
              fontSize: 11,
              color: "#7878a0",
              background: "#12121a",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
              maxHeight: 120,
              marginBottom: 16,
              textAlign: "left",
            }}>
              {this.state.error?.message}
            </pre>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: "#ff6d5a",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
