import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, BookOpen, PenTool, Award, Sparkles, User, FileText, Lock, Cloud } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';

export const DesktopSidebar: React.FC = () => {
  const { isLoggedIn, currentUser, openAuthModal, logout } = useAuth();

  const navItems = [
    { to: '/', label: '首頁總覽', icon: Home },
    { to: '/quick-notes', label: '隨手筆記', icon: FileText },
    { to: '/materials', label: '素材庫', icon: BookOpen },
    { to: '/editor', label: '電子寫作', icon: PenTool },
    { to: '/exams', label: '紙本模擬考', icon: Award, memberOnly: true },
    { to: '/analysis', label: '弱點分析', icon: Sparkles, memberOnly: true },
    { to: '/settings', label: '個人設定', icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border-subtle bg-surface/60 backdrop-blur-md p-4 shrink-0 justify-between">
      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-3 py-2">
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

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'text-text-soft hover:bg-neutral-100 hover:text-text-main'
                  )
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.memberOnly && !isLoggedIn && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-text-muted flex items-center">
                    <Lock className="w-2.5 h-2.5 mr-0.5" />
                    會員
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 pt-4 border-t border-border-subtle">
        {/* User / Guest Status Card */}
        {isLoggedIn ? (
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold">
                {currentUser?.name?.slice(0, 1) || '學'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-main truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-text-muted truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-[11px] text-text-muted hover:text-status-danger transition-colors block text-right w-full"
            >
              登出
            </button>
          </div>
        ) : (
          <div className="p-3 bg-neutral-100 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-text-soft">
              <span className="font-semibold">訪客模式</span>
              <span className="text-[10px] text-text-muted">本機暫存</span>
            </div>
            <Button
              size="sm"
              onClick={openAuthModal}
              className="w-full text-xs py-1.5 rounded-lg shadow-xs"
            >
              <Cloud className="w-3.5 h-3.5 mr-1" />
              登入解鎖完整功能
            </Button>
          </div>
        )}

        <div className="p-2.5 text-[11px] text-text-muted leading-relaxed">
          AI 優先引導提問，文章由自己寫出。
        </div>
      </div>
    </aside>
  );
};
