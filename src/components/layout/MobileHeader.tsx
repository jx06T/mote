import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export const MobileHeader: React.FC<{ title?: string }> = ({ title = 'Mote' }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-neutral-100 transition-colors"
        aria-label="切換深淺模式"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
};
