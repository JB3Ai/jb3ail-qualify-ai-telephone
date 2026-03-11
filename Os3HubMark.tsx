import React from 'react';
import './Os3HubMark.css';

interface Os3HubMarkProps {
  size?: 'sm' | 'md';
}

export const Os3HubMark: React.FC<Os3HubMarkProps> = ({ size = 'md' }) => {
  const isSmall = size === 'sm';
  const outerStyle = isSmall ? { width: 36, height: 36, borderRadius: 10 } : undefined;
  const innerStyle = isSmall ? { width: 24, height: 24, borderRadius: 7 } : undefined;
  const glyphStyle = isSmall ? { fontSize: 10 } : undefined;
  const statusStyle = isSmall ? { width: 4, height: 4, right: 4, bottom: 4 } : undefined;

  return (
    <div className="os3-hub-mark" style={outerStyle}>
      <div className="os3-hub-mark-inner" style={innerStyle}>
        <span className="os3-hub-glyph" style={glyphStyle}>&gt;_</span>
      </div>
      <span className="os3-hub-status" style={statusStyle} />
    </div>
  );
};
