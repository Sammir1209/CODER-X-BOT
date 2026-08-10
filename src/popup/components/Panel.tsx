// src/popup/components/Panel.tsx
import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`glass rounded-xl p-4 shadow-md ${className}`}>
      {children}
    </div>
  );
};
