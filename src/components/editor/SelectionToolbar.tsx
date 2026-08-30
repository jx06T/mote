import React from 'react';
import { Sparkles, BookmarkPlus, Minimize2, Maximize2, Feather, Eye, Heart } from 'lucide-react';

interface SelectionToolbarProps {
  position: { top: number; left: number };
  selectedText: string;
  onAction: (action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene') => void;
  onMarkHardCharacter: () => void;
  onClose: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  selectedText,
  onAction,
  onMarkHardCharacter,
  onClose,
}) => {
  if (!selectedText.trim()) return null;

  const actions = [
    { key: 'metaphor' as const, label: '比喻', icon: Feather },
    { key: 'imitation' as const, label: '仿寫', icon: Sparkles },
    { key: 'expand' as const, label: '擴寫', icon: Maximize2 },
    { key: 'concise' as const, label: '精簡', icon: Minimize2 },
    { key: 'emotion' as const, label: '加情緒', icon: Heart },
    { key: 'scene' as const, label: '加畫面', icon: Eye },
  ];

  // Boundary clamping to prevent toolbar from overflowing screen
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const clampedLeft = Math.min(Math.max(16, position.left - 40), Math.max(16, screenWidth - 360));
  const clampedTop = Math.max(56, position.top - 46);

  return (
    <div
      className="fixed z-50 flex items-center bg-surface/95 backdrop-blur-md border border-border-subtle rounded-xl shadow-lg p-1 space-x-1 max-w-[calc(100vw-32px)] overflow-x-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: `${clampedTop}px`,
        left: `${clampedLeft}px`,
      }}
    >
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.key}
            onClick={() => onAction(act.key)}
            className="flex items-center px-2 py-1 rounded-lg text-xs font-medium text-text-soft hover:text-primary hover:bg-surface-elevated transition-colors shrink-0"
          >
            <Icon className="w-3.5 h-3.5 mr-1" />
            {act.label}
          </button>
        );
      })}

      <div className="h-4 w-px bg-border-subtle mx-0.5 shrink-0" />

      <button
        onClick={onMarkHardCharacter}
        className="flex items-center px-2 py-1 rounded-lg text-xs font-medium text-status-warning hover:bg-status-warning/10 transition-colors shrink-0"
      >
        <BookmarkPlus className="w-3.5 h-3.5 mr-1" />
        標記難字
      </button>
    </div>
  );
};
