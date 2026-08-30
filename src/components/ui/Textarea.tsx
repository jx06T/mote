import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className, id, ...props }) => {
  const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '')}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-text-soft mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={twMerge(
          clsx(
            'w-full px-3.5 py-2.5 bg-surface border border-border-subtle rounded-lg text-text-main placeholder:text-text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none',
            error && 'border-status-danger focus:ring-status-danger/30 focus:border-status-danger',
            className
          )
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
    </div>
  );
};
