import React from "react";

interface ConnectionLineProps {
  /** Starting X position (source node's right edge) */
  startX: number;
  /** Starting Y position (source node's center) */
  startY: number;
  /** Ending X position (target node's left edge) */
  endX: number;
  /** Ending Y position (target node's center) */
  endY: number;
  /** Connection color (default: n8n green) */
  color?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Whether the connection is animated (dashed) */
  animated?: boolean;
  /** Whether the connection is selected */
  selected?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  startX,
  startY,
  endX,
  endY,
  color = "#4caf50",
  strokeWidth = 2,
  animated = false,
  selected = false,
}) => {
  // Calculate control points for bezier curve
  // The curve should flow smoothly from source to target
  const deltaX = Math.abs(endX - startX);
  const controlOffset = Math.max(deltaX * 0.5, 50);

  // Control points for smooth S-curve
  const cp1X = startX + controlOffset;
  const cp1Y = startY;
  const cp2X = endX - controlOffset;
  const cp2Y = endY;

  // Create bezier path
  const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

  // Selected style
  const strokeColor = selected ? "#ff6d5a" : color;
  const finalStrokeWidth = selected ? 3 : strokeWidth;

  return (
    <g className="connection-line">
      {/* Shadow/outline for better visibility */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={finalStrokeWidth + 2}
        strokeLinecap="round"
        opacity={0.3}
      />

      {/* Main connection line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={finalStrokeWidth}
        strokeLinecap="round"
        strokeDasharray={animated ? "5,5" : undefined}
      />

      {/* Arrow head at target */}
      <circle
        cx={endX}
        cy={endY}
        r={selected ? 5 : 3}
        fill={strokeColor}
        opacity={0.8}
      />
    </g>
  );
};
