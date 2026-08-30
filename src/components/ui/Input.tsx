import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '')}` : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-soft mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={twMerge(
          clsx(
            'w-full px-3.5 py-2.5 bg-surface border border-border-subtle rounded-lg text-text-main placeholder:text-text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
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
