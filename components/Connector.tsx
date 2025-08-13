
import React from 'react';
import { BoardItemData } from '../types';

interface ConnectorProps {
  fromItem: BoardItemData;
  toItem: BoardItemData;
}

const Connector: React.FC<ConnectorProps> = ({ fromItem, toItem }) => {
  const getCenter = (item: BoardItemData) => {
    return {
      x: item.x + item.width / 2,
      y: item.y + item.height / 2,
    };
  };

  const start = getCenter(fromItem);
  const end = getCenter(toItem);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // --- Physics-based Curve Logic ---
  
  // The midpoint of the straight line between the items.
  const midPointX = start.x + dx / 2;
  const midPointY = start.y + dy / 2;

  // Define the sag of the "string" to simulate gravity.
  // The sag increases with distance but is capped. This makes the string look
  // tauter over very long distances, fulfilling the "elastic" feel.
  const sagAmount = Math.min(distance * 0.15, 100);

  // The control point for the quadratic Bezier curve.
  // We place it below the midpoint to simulate gravity's pull.
  const controlPoint = {
    x: midPointX,
    y: midPointY + sagAmount,
  };

  const pathData = `M ${start.x} ${start.y} Q ${controlPoint.x} ${controlPoint.y} ${end.x} ${end.y}`;

  return (
    <path
      d={pathData}
      stroke="tomato"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))', pointerEvents: 'none' }}
    />
  );
};

export default Connector;
