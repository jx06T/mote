import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-status-danger shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-status-success/30';
      case 'error':
        return 'border-status-danger/30';
      case 'warning':
        return 'border-status-warning/30';
      default:
        return 'border-primary/30';
    }
  };

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 p-3.5 bg-surface/95 backdrop-blur-md border ${getBorderColor()} rounded-xl shadow-lg shadow-black/5 min-w-72 max-w-md animate-in slide-in-from-top-2 duration-200`}
    >
      <div className="flex items-start space-x-2.5 flex-1">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="space-y-0.5 flex-1">
          {toast.title && (
            <h4 className="text-xs font-semibold text-text-main leading-none">
              {toast.title}
            </h4>
          )}
          <p className="text-xs text-text-soft leading-relaxed">
            {toast.message}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-muted hover:text-text-main p-0.5 rounded-md transition-colors"
        aria-label="關閉提示"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
