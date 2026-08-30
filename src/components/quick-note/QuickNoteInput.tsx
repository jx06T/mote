import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface QuickNoteInputProps {
  onSave: (content: string) => Promise<void>;
}

export const QuickNoteInput: React.FC<QuickNoteInputProps> = ({ onSave }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await onSave(content.trim());
      setContent('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative bg-surface border border-border-subtle rounded-2xl p-3.5 shadow-xs focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="今天發生了什麼？記下一句話或一個畫面..."
        rows={2}
        className="w-full bg-transparent border-0 text-text-main placeholder:opacity-50 text-sm focus:outline-none resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit(e);
          }
        }}
      />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle/50 text-xs text-text-muted">
        <span>按 Enter 換行，Ctrl+Enter 送出</span>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim()}
          isLoading={isLoading}
          className="rounded-lg px-3 py-1 text-xs"
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          記下
        </Button>
      </div>
    </form>
  );
};
