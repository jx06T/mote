import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const MobileHeader: React.FC<{ title?: string }> = ({ title = 'Mote' }) => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-subtle px-4 h-13 flex items-center justify-between">
      <div className="flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-serif font-bold text-sm shadow-xs">
          墨
        </div>
        <span className="font-display font-semibold text-text-main text-base tracking-wide">
          {title}
        </span>
      </div>

      <div className="flex items-center space-x-1.5">
        {!isLoggedIn && (
          <Button
            size="sm"
            onClick={openAuthModal}
            className="text-[11px] py-1 px-2.5 rounded-lg mr-1 h-7"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            登入
          </Button>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
          aria-label="切換深淺模式"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
