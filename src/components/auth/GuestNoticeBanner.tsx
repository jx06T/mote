import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ShieldCheck, X, Sparkles } from 'lucide-react';

export const GuestNoticeBanner: React.FC = () => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('mote_guest_banner_dismissed') === 'true';
  });

  if (isLoggedIn || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('mote_guest_banner_dismissed', 'true');
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-xs text-text-soft transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <p className="truncate">
            <strong className="text-primary font-semibold mr-1">本機訪客試用模式</strong>
            素材與作文暫存於此瀏覽器。登入 Google 帳號即可免費啟用 iPad 跨裝置同步與 AI 評析！
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            size="sm"
            onClick={openAuthModal}
            className="text-xs py-1 px-3 rounded-lg shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            登入 / 註冊
          </Button>
          <button
            onClick={handleDismiss}
            aria-label="關閉提示"
            className="p-1 text-text-muted hover:text-text-main rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
