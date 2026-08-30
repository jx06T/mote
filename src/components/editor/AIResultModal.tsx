import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Check, X, Sparkles } from 'lucide-react';

interface AIResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  suggestion: string;
  explanation: string;
  onAccept: (newText: string) => void;
}

export const AIResultModal: React.FC<AIResultModalProps> = ({
  isOpen,
  onClose,
  originalText,
  suggestion,
  explanation,
  onAccept,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI 寫作修辭建議">
      <div className="space-y-4 text-sm">
        {/* Original Sentence */}
        <div>
          <span className="block text-xs font-semibold text-text-muted mb-1">
            原句：
          </span>
          <div className="p-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-soft font-display leading-relaxed">
            {originalText}
          </div>
        </div>

        {/* AI Suggested Sentence */}
        <div>
          <span className="flex items-center text-xs font-semibold text-primary mb-1">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            建議修飾：
          </span>
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-text-main font-display leading-relaxed font-medium">
            {suggestion}
          </div>
        </div>

        {/* AI Explanation */}
        {explanation && (
          <div className="p-3 bg-surface border border-border-subtle rounded-xl text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-text-soft block mb-0.5">思考解析：</span>
            {explanation}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border-subtle">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            <X className="w-3.5 h-3.5 mr-1" />
            保留原句
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onAccept(suggestion);
              onClose();
            }}
            className="text-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            採用建議
          </Button>
        </div>
      </div>
    </Modal>
  );
};
