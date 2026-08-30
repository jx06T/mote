import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidths[maxWidth]} bg-surface rounded-2xl shadow-lg border border-border-subtle overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <h3 className="text-base font-semibold text-text-main font-display">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-5 max-h-[80vh] overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  );
};
