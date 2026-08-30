import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ExamOCRReviewProps {
  initialText: string;
  isAnalyzing: boolean;
  onConfirmSubmit: (finalText: string) => void;
}

export const ExamOCRReview: React.FC<ExamOCRReviewProps> = ({
  initialText,
  isAnalyzing,
  onConfirmSubmit,
}) => {
  const [text, setText] = useState(initialText || '');
  const toast = useToast();

  const handleConfirm = () => {
    if (!text.trim()) {
      toast.warning('請先輸入或校對作文文字內容後再送交評析。');
      return;
    }
    onConfirmSubmit(text);
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto p-4">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-xl text-text-main">
          確認與校對 OCR 辨識結果
        </h2>
        <p className="text-xs text-text-muted">
          請核對文字是否與紙本稿紙一致，可直接在下方編輯修改後送交評析。
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary flex items-center space-x-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>請確認文字內容完整無誤後，即可送交 AI 進行多面向評析。</span>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-xs space-y-2">
        <Textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="font-display text-base leading-relaxed"
          placeholder="請在此輸入或校對稿紙文字內容..."
        />
        <div className="flex justify-between text-xs text-text-muted px-1">
          <span>共 {text.replace(/\s+/g, '').length} 字</span>
          <span>支援手動校正所有字詞</span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={handleConfirm}
          isLoading={isAnalyzing}
          disabled={!text.trim()}
          className="rounded-xl w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          確認送出，開始深度作文評析
        </Button>
      </div>
    </div>
  );
};
