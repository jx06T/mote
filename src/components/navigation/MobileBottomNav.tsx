import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, PenTool, Sparkles, User } from 'lucide-react';
import { clsx } from 'clsx';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: '首頁', icon: Home },
    { to: '/materials', label: '素材庫', icon: BookOpen },
    { to: '/editor', label: '寫作', icon: PenTool },
    { to: '/analysis', label: '弱點', icon: Sparkles },
    { to: '/settings', label: '我的', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-subtle safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center flex-1 py-1 text-[11px] transition-colors',
                  isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-main'
                )
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
