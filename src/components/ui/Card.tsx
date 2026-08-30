import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ hoverable = false, className, children, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface border border-border-subtle rounded-xl p-4 shadow-xs transition-all',
          hoverable && 'hover:border-primary/40 hover:shadow-sm active:scale-[0.995] cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
