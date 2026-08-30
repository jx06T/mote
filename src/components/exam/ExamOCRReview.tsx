import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { CheckCircle2, AlertCircle, Sparkles, Send } from 'lucide-react';

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
  const [text, setText] = useState(
    initialText ||
      `今天放學時，天色漸漸暗了下來。校門口老槐樹的葉子在初秋的微風中沙沙作響。我看著熟悉的小徑，忽然意識到這段天天走過的路，也許在幾個月後就會變成回憶。我們總是在匆忙中長大，卻常常忘了停下腳步，好好看一眼身邊的風景。`
  );

  return (
    <div className="space-y-5 max-w-xl mx-auto p-4">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-xl text-text-main">
          確認與校對 OCR 辨識結果
        </h2>
        <p className="text-xs text-text-muted">
          OCR 辨識已完成。請核對文字是否與紙本原稿一致，可直接在下方編輯修改。
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary flex items-center space-x-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>辨識信心度 94%！確認文字無誤後即可送交 AI 進行多面向評析。</span>
      </div>

      <div className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-xs space-y-2">
        <Textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="font-display text-base leading-relaxed"
          placeholder="請確認手寫作文內容..."
        />
        <div className="flex justify-between text-xs text-text-muted px-1">
          <span>共 {text.replace(/\s+/g, '').length} 字</span>
          <span>支援手動校正所有字詞</span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={() => onConfirmSubmit(text)}
          isLoading={isAnalyzing}
          className="rounded-xl w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          確認送出，開始深度作文評析
        </Button>
      </div>
    </div>
  );
};
