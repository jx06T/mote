import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastItem, ToastType } from '../components/ui/Toast';

interface ToastContextType {
  show: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  showToast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const id = 'toast_' + Math.random().toString(36).slice(2, 9) + Date.now();
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, title?: string) => show(message, 'success', title),
    [show]
  );
  const error = useCallback(
    (message: string, title?: string) => show(message, 'error', title),
    [show]
  );
  const warning = useCallback(
    (message: string, title?: string) => show(message, 'warning', title),
    [show]
  );
  const info = useCallback(
    (message: string, title?: string) => show(message, 'info', title),
    [show]
  );
  const showToast = useCallback(
    (type: ToastType, message: string, title?: string) => show(message, type, title),
    [show]
  );

  return (
    <ToastContext.Provider value={{ show, showToast, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-2"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <Toast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
