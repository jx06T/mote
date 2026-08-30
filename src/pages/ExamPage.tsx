import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExamsAPI, PromptsAPI } from '../services/api';
import { ExamSession as ExamSessionType, PromptItem } from '../types';
import { FeatureGate } from '../components/auth/FeatureGate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Award, Clock, FileCheck, ShieldCheck } from 'lucide-react';

export const ExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamSessionType[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isSelectPromptModalOpen, setIsSelectPromptModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [examList, promptList] = await Promise.all([
        ExamsAPI.list(),
        PromptsAPI.list(),
      ]);
      setExams(examList);
      setPrompts(promptList);
    }
    load();
  }, []);

  const handleStartExam = (prompt: PromptItem) => {
    setIsSelectPromptModalOpen(false);
    navigate(
      `/exams/session?promptId=${prompt.id}&promptTitle=${encodeURIComponent(
        prompt.title
      )}&promptText=${encodeURIComponent(prompt.corrected_text || prompt.raw_text)}`
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-text-main">紙本模擬考</h1>
          <p className="text-xs text-text-muted">
            全真模擬大考現場：紙本手寫 50 分鐘，計時結束拍照 OCR 上傳並獲取評析。
          </p>
        </div>
      </div>

      <FeatureGate feature="paper_mock_exam">
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => setIsSelectPromptModalOpen(true)}
            className="rounded-xl text-xs py-1.5"
          >
            <Award className="w-3.5 h-3.5 mr-1" />
            開始模擬考
          </Button>
        </div>

        {/* Rules Notice Card */}
        <Card className="bg-surface border-border-subtle p-4 space-y-2">
          <h3 className="text-xs font-semibold text-text-main flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-primary" />
            模擬考模式守則
          </h3>
          <p className="text-xs text-text-soft leading-relaxed">
            考試期間禁止使用電子作文編輯器、AI 提示與素材搜尋。請準備紙筆與手寫稿紙，倒數計時結束後系統將引導進行多頁拍照與 OCR 文字校對。
          </p>
        </Card>

        {/* Past Mock Exam Sessions */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-text-soft">
            歷次模擬考紀錄 ({exams.length})
          </h2>

          {exams.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle">
              尚未進行過模擬考。點擊上方「開始模擬考」開啟第一次全真測驗！
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((ex) => (
                <Card
                  key={ex.id}
                  className="bg-surface border-border-subtle p-4 flex items-center justify-between shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-display font-bold text-sm text-text-main">
                        {ex.prompt_title || '模擬考作答'}
                      </h3>
                      <Badge variant="success">已交卷評析</Badge>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-text-muted">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        作答時間：{ex.duration_minutes} 分鐘
                      </span>
                      <span>
                        {new Date(ex.started_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/analysis')}
                    className="text-xs py-1 px-2.5"
                  >
                    <FileCheck className="w-3.5 h-3.5 mr-1" />
                    查看報告
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Select Prompt Modal */}
        <Modal
          isOpen={isSelectPromptModalOpen}
          onClose={() => setIsSelectPromptModalOpen(false)}
          title="選擇本次模擬考題目"
        >
          <div className="space-y-3">
            {prompts.map((p) => (
              <div
                key={p.id}
                onClick={() => handleStartExam(p)}
                className="p-3.5 bg-page-bg border border-border-subtle hover:border-primary/40 rounded-xl cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-display font-bold text-sm text-text-main">
                    {p.title}
                  </h4>
                  <Badge variant="primary">{p.prompt_type || '記敘抒情'}</Badge>
                </div>
                <p className="text-xs text-text-soft line-clamp-2 leading-relaxed">
                  {p.corrected_text || p.raw_text}
                </p>
              </div>
            ))}
          </div>
        </Modal>
      </FeatureGate>
    </div>
  );
};
