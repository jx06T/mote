import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, PenTool, Award, Sparkles, User, FileText } from 'lucide-react';
import { clsx } from 'clsx';

export const DesktopSidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: '首頁總覽', icon: Home },
    { to: '/quick-notes', label: '隨手筆記', icon: FileText },
    { to: '/materials', label: '素材庫', icon: BookOpen },
    { to: '/editor', label: '電子寫作', icon: PenTool },
    { to: '/exams', label: '紙本模擬考', icon: Award },
    { to: '/analysis', label: '弱點分析', icon: Sparkles },
    { to: '/settings', label: '個人設定', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border-subtle bg-surface/60 backdrop-blur-md p-4 shrink-0">
      <div className="flex items-center space-x-3 px-3 py-4 mb-6">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-serif font-bold text-base shadow-xs">
          墨
        </div>
        <div>
          <h1 className="font-display font-bold text-text-main text-lg tracking-wide leading-tight">
            Mote
          </h1>
          <p className="text-xs text-text-muted">高中作文思考訓練</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-text-soft hover:bg-neutral-100 hover:text-text-main'
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 bg-neutral-100 rounded-xl text-xs text-text-muted">
        <p className="font-medium text-text-soft mb-1">思考訓練原則</p>
        <p className="leading-relaxed">AI 優先引導提問，文章由自己寫出。</p>
      </div>
    </aside>
  );
};
