import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { SelectionToolbar } from './SelectionToolbar';
import { AIResultModal } from './AIResultModal';
import { RevisionTimeline } from './RevisionTimeline';
import { EssaysAPI, VocabularyAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Clock, Send, Check, BookmarkCheck, FileText, ChevronRight } from 'lucide-react';

interface EssayEditorProps {
  essayId?: string;
  initialTitle?: string;
  initialContent?: string;
  promptTitle?: string;
  promptText?: string;
  onSubmitForAnalysis: (title: string, content: string) => void;
}

export const EssayEditor: React.FC<EssayEditorProps> = ({
  essayId,
  initialTitle = '無標題作文',
  initialContent = '',
  promptTitle,
  promptText,
  onSubmitForAnalysis,
}) => {
  const { checkAccess, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ from: number; to: number } | null>(null);

  // AI Assist Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ original: string; suggestion: string; explanation: string }>({
    original: '',
    suggestion: '',
    explanation: '',
  });

  // Operation log state
  const [operations, setOperations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Hard character marking state
  const [hardCharModal, setHardCharModal] = useState(false);
  const [hardChar, setHardChar] = useState('');
  const [hardZhuyin, setHardZhuyin] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Placeholder.configure({
        placeholder: '開始書寫你的作文...每一段請按 Enter 開啟新段落。',
      }),
    ],
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }: any) => {
      setSaveStatus('saving');
    },
    onSelectionUpdate: ({ editor }: any) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (text.trim()) {
          setSelectedText(text);
          setSelectedRange({ from, to });

          // Get selection coordinates for floating toolbar
          const view = editor.view;
          const coords = view.coordsAtPos(from);
          setSelectionPos({ top: coords.top, left: coords.left });
          return;
        }
      }
      setSelectionPos(null);
    },
  });

  // Debounced Autosave
  useEffect(() => {
    if (!editor || saveStatus !== 'saving') return;
    const timer = setTimeout(async () => {
      const content = editor.getText();
      await EssaysAPI.save({
        id: essayId,
        title,
        content,
      });
      setSaveStatus('saved');
    }, 1200);

    return () => clearTimeout(timer);
  }, [editor?.getText(), title, saveStatus]);

  // Trigger AI Assist
  const handleAIAction = async (
    action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene'
  ) => {
    if (!selectedText) return;
    setSelectionPos(null);

    if (!checkAccess('essay_ai_assist')) {
      openAuthModal();
      showToast('warning', 'AI 寫作修辭輔助為會員專屬功能，請登入 Google 帳號免費解鎖！');
      return;
    }

    try {
      const res = await EssaysAPI.assist(selectedText, action, editor?.getText());
      setAiResult(res);
      setAiModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Accept AI Rewrite Suggestion
  const handleAcceptAISuggestion = (newText: string) => {
    if (!editor || !selectedRange) return;
    editor
      .chain()
      .focus()
      .deleteRange(selectedRange)
      .insertContentAt(selectedRange.from, newText)
      .run();

    const newOp = {
      id: 'op_' + Date.now(),
      operation_type: 'AI_ACCEPT',
      old_content: selectedText,
      new_content: newText,
      created_at: Date.now(),
    };
    setOperations((prev) => [newOp, ...prev]);
  };

  // Mark Hard Character
  const handleOpenMarkHardChar = () => {
    setHardChar(selectedText.slice(0, 1) || '');
    setHardCharModal(true);
    setSelectionPos(null);
  };

  const handleSaveHardChar = async () => {
    if (!hardChar) return;
    await VocabularyAPI.add(hardChar, hardZhuyin);
    setHardCharModal(false);
    setHardChar('');
    setHardZhuyin('');
  };

  const wordCount = editor?.storage.characterCount.characters() || 0;

  return (
    <div className="relative flex flex-col h-full bg-page-bg">
      {/* Editor Top Bar */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md border-b border-border-subtle px-4 py-2.5 flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('saving');
            }}
            placeholder="請輸入作文標題..."
            className="w-full bg-transparent border-0 font-display font-bold text-lg text-text-main focus:outline-none placeholder:opacity-40"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs shrink-0">
          <span className="text-text-muted flex items-center">
            {saveStatus === 'saving' ? '儲存中...' : '已儲存'}
          </span>
          <span className="text-text-soft font-mono px-2 py-0.5 bg-neutral-100 rounded-md">
            {wordCount} 字
          </span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-neutral-100 transition-colors"
            title="歷程紀錄"
          >
            <Clock className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            onClick={() => {
              if (!checkAccess('essay_analysis')) {
                openAuthModal();
                showToast('warning', '作文八大面向評析為會員專屬功能，請登入 Google 帳號免費解鎖！');
                return;
              }
              onSubmitForAnalysis(title, editor?.getText() || '');
            }}
            className="text-xs py-1 px-3"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            交卷評析
          </Button>
        </div>
      </div>

      {/* Prompt Reference Box if attached */}
      {promptText && (
        <div className="mx-4 mt-3 p-3 bg-surface border border-border-subtle rounded-xl text-xs text-text-soft flex items-start space-x-2">
          <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold text-text-main block mb-0.5">題目：{promptTitle || '指定題目'}</span>
            {promptText}
          </div>
        </div>
      )}

      {/* Main Tiptap Writing Sheet */}
      <div className="flex-1 px-4 py-6 max-w-3xl w-full mx-auto overflow-y-auto no-scrollbar">
        <div className="min-h-125 bg-surface rounded-2xl p-6 sm:p-10 border border-border-subtle shadow-xs">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Floating Selection Toolbar */}
      {selectionPos && (
        <SelectionToolbar
          position={selectionPos}
          selectedText={selectedText}
          onAction={handleAIAction}
          onMarkHardCharacter={handleOpenMarkHardChar}
          onClose={() => setSelectionPos(null)}
        />
      )}

      {/* AI Suggestion Comparison Modal */}
      <AIResultModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        originalText={aiResult.original}
        suggestion={aiResult.suggestion}
        explanation={aiResult.explanation}
        onAccept={handleAcceptAISuggestion}
      />

      {/* Hard Character Marking Modal */}
      <Modal
        isOpen={hardCharModal}
        onClose={() => setHardCharModal(false)}
        title="標記為個人生難字"
        maxWidth="sm"
      >
        <div className="space-y-3 text-sm">
          <div className="text-center py-2">
            <span className="text-4xl font-display font-bold text-text-main">{hardChar}</span>
          </div>
          <Input
            label="注音符號"
            placeholder="例如：ㄒㄧㄢˋ"
            value={hardZhuyin}
            onChange={(e) => setHardZhuyin(e.target.value)}
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setHardCharModal(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleSaveHardChar}>
              <BookmarkCheck className="w-3.5 h-3.5 mr-1" />
              存入生難字庫
            </Button>
          </div>
        </div>
      </Modal>

      {/* Operation Log Drawer Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="寫作思考與修改歷程"
      >
        <RevisionTimeline operations={operations} />
      </Modal>
    </div>
  );
};
