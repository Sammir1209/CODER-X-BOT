// src/popup/components/StatusToast.tsx
import React from 'react';

interface StatusToastProps {
  message: string;
  /** visual style of the toast */
  variant?: 'info' | 'success' | 'error' | 'warning';
  /** auto‑close after ms */
  duration?: number;
  /** callback on close */
  onClose?: () => void;
}

export const StatusToast: React.FC<StatusToastProps> = ({
  message,
  variant = 'info',
  duration,
  onClose,
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  if (!visible) return null;

  const variantColors = {
    info: { bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-100' },
    success: { bg: 'bg-emerald-800', border: 'border-emerald-600', text: 'text-emerald-100' },
    warning: { bg: 'bg-amber-800', border: 'border-amber-600', text: 'text-amber-100' },
    error: { bg: 'bg-rose-800', border: 'border-rose-600', text: 'text-rose-100' },
  } as const;

  const colors = variantColors[variant as keyof typeof variantColors];

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border ${colors.border} ${colors.bg} ${colors.text}`}
      role="alert"
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className="ml-2 text-sm font-bold hover:opacity-80"
        >
          ✕
        </button>
      )}
    </div>
  );
};
