import { useCallback } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import type { Position } from "@/types";

/**
 * Facade hook for viewport (zoom & pan) operations.
 */
export const useViewport = () => {
  const viewport = useTreeStore((s) => s.viewport);
  const updateViewport = useTreeStore((s) => s.updateViewport);

  const zoomIn = useCallback(
    (factor = 1.2) => {
      updateViewport({ zoom: Math.min(viewport.zoom * factor, 3), pan: viewport.pan });
    },
    [viewport.zoom, viewport.pan, updateViewport],
  );

  const zoomOut = useCallback(
    (factor = 0.8) => {
      updateViewport({ zoom: Math.max(viewport.zoom * factor, 0.15), pan: viewport.pan });
    },
    [viewport.zoom, viewport.pan, updateViewport],
  );

  const resetView = useCallback(() => {
    updateViewport({ zoom: 1, pan: { x: 80, y: 80 } });
  }, [updateViewport]);

  const panTo = useCallback(
    (pan: Position) => {
      updateViewport({ pan });
    },
    [updateViewport],
  );

  return {
    zoom: viewport.zoom,
    pan: viewport.pan,
    zoomIn,
    zoomOut,
    resetView,
    panTo,
    update: updateViewport,
  };
};
