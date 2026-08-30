import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { BookOpen, PenTool, Award, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleGuestTrial = () => {
    navigate('/');
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-page-bg">
      <Card className="max-w-md w-full p-8 text-center space-y-6 bg-surface border-border-subtle shadow-md rounded-3xl">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-serif font-bold text-2xl shadow-sm">
          墨
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-bold text-2xl text-text-main">
            歡迎來到 Mote
          </h1>
          <p className="text-xs text-text-soft leading-relaxed max-w-xs mx-auto">
            高中生專屬生活素材累積、思考深化與作文訓練系統。
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-3 gap-2 py-2 text-[11px] text-text-muted border-y border-border-subtle/60">
          <div className="space-y-1">
            <BookOpen className="w-4 h-4 mx-auto text-primary" />
            <span>素材深入訪談</span>
          </div>
          <div className="space-y-1">
            <PenTool className="w-4 h-4 mx-auto text-primary" />
            <span>電子寫作引導</span>
          </div>
          <div className="space-y-1">
            <Award className="w-4 h-4 mx-auto text-primary" />
            <span>紙本全真模考</span>
          </div>
        </div>

        {/* Google OAuth Login Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-surface hover:bg-surface-elevated border border-border-subtle text-text-main font-medium rounded-xl text-sm transition-all shadow-xs active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>使用 Google 帳號登入</span>
          </button>
          
          <button
            onClick={handleGuestTrial}
            className="text-xs text-text-muted hover:text-text-main flex items-center justify-center mx-auto space-x-1 py-1 transition-colors"
          >
            <span>以本機訪客模式試用</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </Card>
    </div>
  );
};
