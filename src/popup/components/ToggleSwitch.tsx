// src/popup/components/ToggleSwitch.tsx
import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-10 h-5 bg-slate-700 rounded-full shadow-inner transition-colors" />
        <div
          className={`dot absolute left-0 top-0 w-5 h-5 bg-celeste rounded-full transition transform ${checked ? 'translate-x-full bg-celeste' : ''}`}
        />
      </div>
    </label>
  );
};
