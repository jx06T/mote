import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, Shield, Moon, Sun, Download, Sparkles, LogOut, Cloud } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { isLoggedIn, currentUser, openAuthModal, logout } = useAuth();
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleExportData = () => {
    const data = {
      quickNotes: localStorage.getItem('mote_quick_notes'),
      materials: localStorage.getItem('mote_materials'),
      essays: localStorage.getItem('mote_essays'),
      prompts: localStorage.getItem('mote_prompts'),
      vocabulary: localStorage.getItem('mote_vocabulary'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mote-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="font-display font-bold text-2xl text-text-main">個人設定</h1>
        <p className="text-xs text-text-muted">
          管理你的帳號狀態、外觀風格與本機寫作資料備份。
        </p>
      </div>

      {/* Account Info */}
      <Card className="bg-surface border-border-subtle p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-semibold text-text-muted flex items-center">
          <User className="w-3.5 h-3.5 mr-1" />
          帳號資訊
        </h2>

        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base font-serif">
                  {currentUser?.name?.slice(0, 1) || '學'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">
                    {currentUser?.name || '高中學員'}
                  </p>
                  <p className="text-xs text-text-muted">{currentUser?.email}</p>
                </div>
              </div>
              <Badge variant="success">Google 帳號已連線</Badge>
            </div>

            <div className="pt-2 border-t border-border-subtle flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-xs text-status-danger hover:bg-status-danger/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                登出帳號
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-surface-elevated text-text-muted flex items-center justify-center font-bold text-sm font-serif border border-border-subtle">
                  訪
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">本機訪客試用模式</p>
                  <p className="text-xs text-text-muted">
                    素材、筆記與草稿僅暫存於此瀏覽器（未綁定雲端帳號）
                  </p>
                </div>
              </div>
              <Badge variant="warning">訪客試用中</Badge>
            </div>

            <div className="pt-2 border-t border-border-subtle flex justify-end">
              <Button size="sm" onClick={openAuthModal} className="text-xs shadow-xs">
                <Cloud className="w-3.5 h-3.5 mr-1" />
                登入 Google 帳號啟用雲端同步
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Appearance Settings */}
      <Card className="bg-surface border-border-subtle p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-semibold text-text-muted flex items-center">
          <Shield className="w-3.5 h-3.5 mr-1" />
          外觀與閱讀偏好
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-main">深淺色主題模式</p>
            <p className="text-xs text-text-muted">切換專注夜間模式或低飽和紙質暖色</p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="text-xs">
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 mr-1" />
                切換為淺色紙質
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 mr-1" />
                切換為深色專注
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Data Backup & Export */}
      <Card className="bg-surface border-border-subtle p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-semibold text-text-muted flex items-center">
          <Download className="w-3.5 h-3.5 mr-1" />
          資料安全與匯出
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-main">匯出完整寫作素材與作文</p>
            <p className="text-xs text-text-muted">下載 JSON 格式完整本機備份</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData} className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" />
            匯出備份
          </Button>
        </div>
      </Card>

      {/* About Mote */}
      <div className="text-center text-xs text-text-muted space-y-1 pt-4">
        <p className="font-display font-medium text-text-soft">
          Mote — 高中生 AI 作文訓練工具 V1.0
        </p>
        <p>AI 優先引導提問，協助累積生活素材與思考深度的個人寫作系統。</p>
      </div>
    </div>
  );
};
