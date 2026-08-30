import React, { useState, useEffect } from 'react';
import { VocabularyAPI } from '../services/api';
import { HardCharacter } from '../types';
import { CharacterQuiz } from '../components/vocabulary/CharacterQuiz';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Bookmark, Sparkles, Plus, BookOpen } from 'lucide-react';

export const VocabularyPage: React.FC = () => {
  const [characters, setCharacters] = useState<HardCharacter[]>([]);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  const loadChars = async () => {
    const list = await VocabularyAPI.list();
    setCharacters(list);
  };

  useEffect(() => {
    loadChars();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-text-main">個人生難字庫</h1>
          <p className="text-xs text-text-muted">
            在寫作過程中隨手標記易錯字與生難字，隨時進行注音與填字複習。
          </p>
        </div>
        {characters.length > 0 && (
          <Button
            size="sm"
            onClick={() => setIsQuizModalOpen(true)}
            className="rounded-xl text-xs py-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            開始生字測驗
          </Button>
        )}
      </div>

      {/* Character Cards Grid */}
      {characters.length === 0 ? (
        <div className="py-16 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle space-y-3">
          <Bookmark className="w-8 h-8 mx-auto text-text-muted/60" />
          <p>目前生難字庫中沒有字詞。在電子寫作時選取單字即可標記存入！</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {characters.map((c) => (
            <Card
              key={c.id}
              className="bg-surface border-border-subtle p-4 text-center space-y-2 shadow-xs"
            >
              <div className="font-display font-bold text-3xl text-text-main py-1">
                {c.character_text}
              </div>
              <div className="font-mono text-xs text-primary font-medium tracking-wider">
                {c.zhuyin || '—'}
              </div>
              <div className="pt-2 border-t border-border-subtle/50 text-[10px] text-text-muted">
                熟悉度：等級 {c.mastery_level || 1}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      <Modal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        title="生難字自我測驗"
        maxWidth="sm"
      >
        <CharacterQuiz
          characters={characters}
          onFinish={() => {
            setIsQuizModalOpen(false);
            loadChars();
          }}
        />
      </Modal>
    </div>
  );
};
