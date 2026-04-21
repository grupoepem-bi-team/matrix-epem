import React from "react";

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  strokeWidth?: number;
  selected?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  startX,
  startY,
  endX,
  endY,
  color = "#555570",
  strokeWidth = 2,
  selected = false,
}) => {
  const dist = Math.abs(endX - startX);
  const curvature = Math.max(dist * 0.45, 60);

  const cp1X = startX + curvature;
  const cp1Y = startY;
  const cp2X = endX - curvature;
  const cp2Y = endY;

  const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

  const strokeColor = selected ? "#ff6d5a" : color;
  const sw = selected ? strokeWidth + 1 : strokeWidth;

  /* Arrow head — small triangle pointing in the direction of the bezier
     at the target. We approximate the tangent from the last control
     point to the endpoint. */
  const angle = Math.atan2(endY - cp2Y, endX - cp2X);
  const arrowLen = 9;
  const arrowAngle = 0.45; // radians half-spread
  const ax1 = endX - arrowLen * Math.cos(angle - arrowAngle);
  const ay1 = endY - arrowLen * Math.sin(angle - arrowAngle);
  const ax2 = endX - arrowLen * Math.cos(angle + arrowAngle);
  const ay2 = endY - arrowLen * Math.sin(angle + arrowAngle);

  return (
    <g className="connection-line">
      {/* Glow / shadow */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={sw + 3}
        strokeLinecap="round"
      />

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={sw}
        strokeLinecap="round"
        opacity={0.85}
      />

      {/* Arrow head */}
      <polygon
        points={`${endX},${endY} ${ax1},${ay1} ${ax2},${ay2}`}
        fill={strokeColor}
        opacity={0.85}
      />
    </g>
  );
};
