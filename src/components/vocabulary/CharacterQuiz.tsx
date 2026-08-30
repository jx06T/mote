import React, { useState } from 'react';
import { HardCharacter } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Check, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';

interface CharacterQuizProps {
  characters: HardCharacter[];
  onFinish?: () => void;
}

export const CharacterQuiz: React.FC<CharacterQuizProps> = ({ characters, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  if (characters.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted text-xs">
        目前生難字庫中沒有字詞，請在電子寫作時反白生字並標記。
      </div>
    );
  }

  const current = characters[currentIndex];
  const isFinished = currentIndex >= characters.length;

  const handleCheck = () => {
    setShowAnswer(true);
    if (userAnswer.trim() === current.character_text.trim()) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setShowAnswer(false);
    setUserAnswer('');
    if (currentIndex + 1 < characters.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      if (onFinish) onFinish();
    }
  };

  if (isFinished) {
    return (
      <Card className="text-center p-6 space-y-4 max-w-sm mx-auto">
        <Sparkles className="w-8 h-8 text-primary mx-auto" />
        <h3 className="font-display font-bold text-lg text-text-main">生難字測驗完成！</h3>
        <p className="text-sm text-text-muted">
          本次測驗得分：{score} / {characters.length}
        </p>
        <Button size="sm" onClick={() => setCurrentIndex(0)} className="w-full">
          再次練習
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-sm mx-auto space-y-5 bg-surface border-border-subtle shadow-xs">
      <div className="flex justify-between text-xs text-text-muted">
        <span>生難字自我測驗</span>
        <span>
          {currentIndex + 1} / {characters.length}
        </span>
      </div>

      <div className="text-center py-4 bg-page-bg rounded-2xl border border-border-subtle/60">
        <span className="text-xs text-text-muted block mb-1">請寫出注音對應的正確國字：</span>
        <span className="font-mono font-bold text-3xl text-primary tracking-widest">
          {current.zhuyin || '（暫無注音）'}
        </span>
      </div>

      {!showAnswer ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCheck();
          }}
          className="space-y-3"
        >
          <Input
            placeholder="請輸入一個字..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="text-center text-lg font-display"
            autoFocus
          />
          <Button type="submit" size="md" className="w-full" disabled={!userAnswer.trim()}>
            送出核對
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center animate-in fade-in duration-150">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-1">
            <span className="text-xs text-text-muted block">正確答案：</span>
            <span className="font-display font-bold text-4xl text-text-main">
              {current.character_text}
            </span>
          </div>

          <p className="text-xs font-medium">
            {userAnswer.trim() === current.character_text.trim() ? (
              <span className="text-status-success flex items-center justify-center">
                <Check className="w-4 h-4 mr-1" />
                回答正確！
              </span>
            ) : (
              <span className="text-status-warning">
                你的回答：{userAnswer || '未作答'}
              </span>
            )}
          </p>

          <Button size="md" onClick={handleNext} className="w-full">
            下一題
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
};
