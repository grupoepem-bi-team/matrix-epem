import React, { useMemo } from "react";

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  strokeWidth?: number;
  selected?: boolean;
}

/**
 * n8n-style horizontal bezier connection line.
 *
 * Draws a smooth cubic bezier from a parent's output port (right side)
 * to a child's input port (left side). The curve exits horizontally
 * from the source and arrives horizontally at the target, with control
 * points offset proportionally to the horizontal distance (minimum 60 px
 * curvature) to guarantee a graceful S-curve even for short connections.
 */
export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  startX,
  startY,
  endX,
  endY,
  color = "#555570",
  strokeWidth = 2,
  selected = false,
}) => {
  /* ── Derived values ─────────────────────────── */

  const activeColor = selected ? "#ff6d5a" : color;
  const activeWidth = selected ? 2.5 : strokeWidth;

  /* Control-point offset: proportional to distance, but at least 60 px
     so short connections still look like proper S-curves. */
  const dx = Math.abs(endX - startX);
  const curvature = Math.max(dx * 0.45, 60);

  const cp1X = startX + curvature;
  const cp1Y = startY;
  const cp2X = endX - curvature;
  const cp2Y = endY;

  const path = useMemo(
    () =>
      `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`,
    [startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY],
  );

  /* ── Arrow head ───────────────────────────────
     Small triangle pointing in the direction of the bezier tangent
     at the endpoint. We approximate the tangent from the last control
     point to the endpoint.                                        */

  const { arrowPoints } = useMemo(() => {
    const angle = Math.atan2(endY - cp2Y, endX - cp2X);
    const arrowLen = 8;
    const arrowHalf = 4.5;
    // Arrow tip sits exactly at (endX, endY)
    const baseCenterX = endX - arrowLen * Math.cos(angle);
    const baseCenterY = endY - arrowLen * Math.sin(angle);
    const perpAngle = angle + Math.PI / 2;
    const ax1 = baseCenterX + arrowHalf * Math.cos(perpAngle);
    const ay1 = baseCenterY + arrowHalf * Math.sin(perpAngle);
    const ax2 = baseCenterX - arrowHalf * Math.cos(perpAngle);
    const ay2 = baseCenterY - arrowHalf * Math.sin(perpAngle);
    return {
      arrowPoints: `${endX},${endY} ${ax1},${ay1} ${ax2},${ay2}`,
    };
  }, [endX, endY, cp2X, cp2Y]);

  /* ── Render ──────────────────────────────────── */
  return (
    <g
      className={`connection-line${selected ? " connection-line--selected" : ""}`}
    >
      {/* Background shadow for depth */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0, 0, 0, 0.4)"
        strokeWidth={activeWidth + 4}
        strokeLinecap="round"
      />

      {/* Glow when selected */}
      {selected && (
        <path
          d={path}
          fill="none"
          stroke="rgba(255, 109, 90, 0.18)"
          strokeWidth={activeWidth + 10}
          strokeLinecap="round"
        />
      )}

      {/* Main bezier line */}
      <path
        d={path}
        fill="none"
        stroke={activeColor}
        strokeWidth={activeWidth}
        strokeLinecap="round"
        className="connection-line__path"
      />

      {/* Animated overlay for "running" state (toggled via CSS) */}
      <path
        d={path}
        fill="none"
        stroke={activeColor}
        strokeWidth={activeWidth}
        strokeLinecap="round"
        className="connection-line__animated"
        strokeDasharray="8 6"
        opacity={0.5}
      />

      {/* Arrow head */}
      <polygon
        points={arrowPoints}
        fill={activeColor}
        opacity={selected ? 1 : 0.85}
      />
    </g>
  );
};
