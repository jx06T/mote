import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { OfflineSyncManager } from '../../services/OfflineSyncManager';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { X, Check, Shield, Sparkles, Cloud, Lock } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const { showToast } = useToast();

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = () => {
    // 發起正式 Google OAuth 登入流程
    window.location.href = '/api/auth/google';
  };

  const comparisonItems = [
    {
      feature: '隨手筆記與生活素材訪談',
      guest: '本機瀏覽器暫存',
      member: 'D1 雲端持久庫',
      highlight: false,
    },
    {
      feature: '電子作文基礎編輯器',
      guest: '支援（本機草稿）',
      member: '支援（雲端自動儲存）',
      highlight: false,
    },
    {
      feature: 'AI 寫作六大修辭潤飾',
      guest: '未開放',
      member: '免費解鎖（即時建議）',
      highlight: true,
    },
    {
      feature: '作文八大面向深度評析',
      guest: '未開放',
      member: '免費解鎖（報告存檔）',
      highlight: true,
    },
    {
      feature: '全真紙本 50 分鐘模擬考與 OCR',
      guest: '未開放',
      member: '免費解鎖（多頁校對）',
      highlight: true,
    },
    {
      feature: '跨篇章常態弱點累積追蹤',
      guest: '本機簡略統計',
      member: '雲端趨勢分析',
      highlight: true,
    },
    {
      feature: 'iPad / Mac / 手機跨裝置同步',
      guest: '不支援',
      member: '即時自動同步',
      highlight: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-surface border-border-subtle shadow-xl overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-page-bg/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-text-main">
                身分與功能權限說明
              </h2>
              <p className="text-xs text-text-muted">
                登入 Google 帳號免費解鎖完整 AI 寫作訓練閉環
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            aria-label="關閉對話框"
            className="p-1.5 text-text-muted hover:text-text-main rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="border border-border-subtle rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-page-bg border-b border-border-subtle text-text-muted font-medium">
                  <th className="py-2.5 px-3">功能項目</th>
                  <th className="py-2.5 px-3 w-28">訪客試用</th>
                  <th className="py-2.5 px-3 w-32 text-primary font-semibold">登入會員</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-soft">
                {comparisonItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className={item.highlight ? 'bg-primary/5 font-medium' : 'hover:bg-neutral-50/50'}
                  >
                    <td className="py-2.5 px-3 text-text-main flex items-center space-x-1.5">
                      {item.highlight ? (
                        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      )}
                      <span>{item.feature}</span>
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">
                      {item.guest === '未開放' ? (
                        <span className="inline-flex items-center text-status-danger">
                          <Lock className="w-3 h-3 mr-1" />
                          未開放
                        </span>
                      ) : (
                        item.guest
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-primary font-medium">
                      {item.member}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-page-bg rounded-xl flex items-start space-x-2 text-text-muted text-[11px] leading-relaxed">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              登入僅讀取公開個人檔案與 Email，絕不主動分享或洩漏學生隱私。本機累積之筆記與素材將在登入時自動同步上雲。
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border-subtle bg-page-bg/50 space-y-2 shrink-0">
          <Button
            size="lg"
            onClick={handleGoogleLogin}
            className="w-full rounded-xl py-2.5 text-sm font-semibold shadow-xs justify-center"
          >
            <Cloud className="w-4 h-4 mr-2" />
            使用 Google 帳號一鍵登入 / 免費註冊
          </Button>
          <div className="text-center">
            <button
              onClick={closeAuthModal}
              className="text-xs text-text-muted hover:text-text-main underline transition-colors"
            >
              暫時繼續使用訪客模式
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
