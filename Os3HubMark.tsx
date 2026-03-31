import React from 'react';
import './Os3HubMark.css';

interface Os3HubMarkProps {
  size?: 'sm' | 'md';
}

export const Os3HubMark: React.FC<Os3HubMarkProps> = ({ size = 'md' }) => {
  const isSmall = size === 'sm';
  const dim = isSmall ? 36 : 48;
  const radius = isSmall ? 10 : 14;
  const statusStyle = isSmall ? { width: 4, height: 4, right: 2, bottom: 2 } : undefined;

  return (
    <div className="os3-hub-mark" style={{ width: dim, height: dim, borderRadius: radius, padding: 0, overflow: 'hidden' }}>
      <img src="./favicon.svg" alt="OS³ VoiceGrid" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius }} />
      <span className="os3-hub-status" style={statusStyle} />
    </div>
  );
};
