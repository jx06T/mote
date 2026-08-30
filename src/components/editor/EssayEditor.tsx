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
import { Clock, Send, BookmarkCheck, FileText, Loader2 } from 'lucide-react';

interface EssayEditorProps {
  essayId?: string;
  initialTitle?: string;
  initialContent?: string;
  promptTitle?: string;
  promptText?: string;
  onSubmitForAnalysis: (title: string, content: string) => void;
}

const formatToHtml = (content: string) => {
  if (!content) return '<p></p>';
  if (content.trim().startsWith('<p>') || content.trim().startsWith('<')) {
    return content;
  }
  return content
    .split(/\n+/)
    .filter((line) => line.trim())
    .map((line) => `<p>${line}</p>`)
    .join('');
};

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
  const [currentEssayId, setCurrentEssayId] = useState<string | undefined>(essayId);
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ from: number; to: number } | null>(null);

  // AI Assist Modal & Loading State
  const [isAssisting, setIsAssisting] = useState(false);
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
    content: formatToHtml(initialContent),
    onUpdate: () => {
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

  // Update essay ID if prop changes
  useEffect(() => {
    if (essayId) {
      setCurrentEssayId(essayId);
    }
  }, [essayId]);

  // Load existing essay operations or details if essayId is provided
  useEffect(() => {
    async function loadEssayDetails() {
      if (!currentEssayId) return;
      try {
        const data = await EssaysAPI.get(currentEssayId);
        if (data) {
          if (data.essay?.title && data.essay.title !== '無標題作文') {
            setTitle(data.essay.title);
          }
          if (data.operations && data.operations.length > 0) {
            setOperations(data.operations);
          }
          if (editor && editor.isEmpty && data.essay?.current_content) {
            editor.commands.setContent(formatToHtml(data.essay.current_content));
          }
        }
      } catch (err) {
        console.error('[Load Essay Details Error]', err);
      }
    }
    loadEssayDetails();
  }, [currentEssayId, editor]);

  // Debounced Autosave
  useEffect(() => {
    if (!editor || saveStatus !== 'saving') return;
    const timer = setTimeout(async () => {
      const content = editor.getText();
      try {
        const saved = await EssaysAPI.save({
          id: currentEssayId,
          title,
          content,
          operations,
        });
        if (saved?.id && !currentEssayId) {
          setCurrentEssayId(saved.id);
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('[Autosave Error]', err);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [editor?.getText(), title, saveStatus, operations, currentEssayId]);

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

    setIsAssisting(true);
    try {
      const res = await EssaysAPI.assist(selectedText, action, editor?.getText());
      setAiResult(res);
      setAiModalOpen(true);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'AI 修辭建議生成失敗，請稍後再試。');
    } finally {
      setIsAssisting(false);
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
    setSaveStatus('saving');
  };

  // Mark Hard Character
  const handleOpenMarkHardChar = () => {
    setHardChar(selectedText.slice(0, 1) || '');
    setHardCharModal(true);
    setSelectionPos(null);
  };

  const handleSaveHardChar = async () => {
    if (!hardChar.trim()) return;
    try {
      await VocabularyAPI.add(hardChar.trim(), hardZhuyin.trim(), currentEssayId);
      showToast('success', `已成功將「${hardChar.trim()}」標記並存入生難字庫！`);
      setHardCharModal(false);
      setHardChar('');
      setHardZhuyin('');
    } catch (err: any) {
      showToast('error', err.message || '儲存生難字失敗');
    }
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
          <span className="text-text-soft font-mono px-2 py-0.5 bg-surface-elevated border border-border-subtle rounded-md">
            {wordCount} 字
          </span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
            title="寫作歷程"
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

      {/* AI Assisting Spinner Feedback */}
      {isAssisting && (
        <div className="fixed bottom-6 right-6 z-40 bg-surface/95 backdrop-blur-md border border-border-subtle shadow-lg rounded-xl px-3.5 py-2 flex items-center space-x-2 text-xs text-primary font-medium animate-in fade-in">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>AI 正在思考修辭建議...</span>
        </div>
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

