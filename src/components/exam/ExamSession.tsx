import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Award, Clock, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

interface ExamSessionProps {
  promptTitle: string;
  promptText: string;
  durationMinutes?: number;
  onFinishExam: () => void;
}

export const ExamSession: React.FC<ExamSessionProps> = ({
  promptTitle,
  promptText,
  durationMinutes = 50,
  onFinishExam,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onFinishExam();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onFinishExam]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-page-bg items-center justify-between p-6 max-w-xl mx-auto text-center">
      {/* Strict Mode Indicator */}
      <div className="w-full bg-surface border border-border-subtle rounded-2xl p-4 shadow-xs flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center text-status-warning font-medium">
          <ShieldAlert className="w-4 h-4 mr-1.5" />
          全真紙本模擬考模式中
        </span>
        <span>已停用 AI 與電子編輯器</span>
      </div>

      {/* Center Focus Area: Prompt & Big Timer */}
      <div className="my-auto space-y-6 w-full">
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-text-main">
            {promptTitle}
          </h2>
          <p className="text-sm text-text-soft leading-relaxed max-w-lg mx-auto bg-surface p-4 rounded-xl border border-border-subtle">
            {promptText}
          </p>
        </div>

        {/* Big Timer */}
        <div className="py-6">
          <div className="inline-flex items-center space-x-3 px-8 py-4 bg-surface border border-border-subtle rounded-3xl shadow-sm">
            <Clock className="w-8 h-8 text-primary" />
            <span className="font-mono text-4xl sm:text-5xl font-bold tracking-wider text-text-main">
              {formatTime(secondsLeft)}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-3">請在實體稿紙上手寫作答</p>
        </div>
      </div>

      {/* Bottom Finish Button */}
      <div className="w-full pb-4">
        <Button
          size="lg"
          onClick={() => setIsConfirmModalOpen(true)}
          className="w-full max-w-sm rounded-xl"
        >
          完成紙本作答，開始拍照交卷
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="交卷確認"
        maxWidth="sm"
      >
        <div className="space-y-4 text-sm text-left">
          <p className="text-text-soft leading-relaxed">
            確定要結束計時並交卷嗎？交卷後將立即進入多頁拍照上傳與 OCR 文字確認流程。
          </p>
          <div className="flex justify-end space-x-2 pt-2 border-t border-border-subtle">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              繼續作答
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsConfirmModalOpen(false);
                onFinishExam();
              }}
            >
              確定交卷
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
