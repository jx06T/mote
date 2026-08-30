import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { SelectionToolbar } from './SelectionToolbar';
import { AIResultModal } from './AIResultModal';
import { RevisionTimeline, getParagraphNumber } from './RevisionTimeline';
import { EssayListDrawer } from './EssayListDrawer';
import { EssaysAPI, VocabularyAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Clock, Send, BookmarkCheck, FileText, Loader2, Layers, Plus } from 'lucide-react';

interface EssayEditorProps {
  essayId?: string;
  initialTitle?: string;
  initialContent?: string;
  promptTitle?: string;
  promptText?: string;
  onSubmitForAnalysis: (title: string, content: string) => void;
  onSelectEssay?: (essayId: string) => void;
  onCreateNew?: () => void;
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
  onSelectEssay,
  onCreateNew,
}) => {
  const { checkAccess, openAuthModal } = useAuth();
  const { showToast } = useToast();
  const [currentEssayId, setCurrentEssayId] = useState<string | undefined>(essayId);
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showListDrawer, setShowListDrawer] = useState(false);
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
  const prevTextRef = useRef<string>(initialContent || '');

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
          if (data.essay?.current_content) {
            prevTextRef.current = data.essay.current_content;
            if (editor) {
              editor.commands.setContent(formatToHtml(data.essay.current_content));
            }
          }
        }
      } catch (err) {
        console.error('[Load Essay Details Error]', err);
      }
    }
    loadEssayDetails();
  }, [currentEssayId, editor]);

  const handleSelectEssay = async (newId: string) => {
    if (onSelectEssay) {
      onSelectEssay(newId);
    } else {
      setCurrentEssayId(newId);
      try {
        const data = await EssaysAPI.get(newId);
        if (data?.essay) {
          setTitle(data.essay.title || '無標題作文');
          setOperations(data.operations || []);
          prevTextRef.current = data.essay.current_content || '';
          editor?.commands.setContent(formatToHtml(data.essay.current_content || ''));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      setCurrentEssayId(undefined);
      setTitle('無標題作文');
      setOperations([]);
      prevTextRef.current = '';
      editor?.commands.setContent('<p></p>');
      showToast('info', '已開啟新作文草稿');
    }
  };

  // Helper diff algorithm to extract changes
  const getDiff = (oldStr: string, newStr: string) => {
    let start = 0;
    while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
      start++;
    }
    let oldEnd = oldStr.length - 1;
    let newEnd = newStr.length - 1;
    while (oldEnd >= start && newEnd >= start && oldStr[oldEnd] === newStr[newEnd]) {
      oldEnd--;
      newEnd--;
    }
    const removed = oldStr.slice(start, oldEnd + 1);
    const added = newStr.slice(start, newEnd + 1);
    return { start, removed, added };
  };

  // Debounced Autosave and Operation Tracking
  useEffect(() => {
    if (!editor || saveStatus !== 'saving') return;
    const timer = setTimeout(async () => {
      const currentText = editor.getText();
      const oldText = prevTextRef.current;
      let updatedOps = operations;

      if (currentText !== oldText) {
        const diff = getDiff(oldText, currentText);
        const now = Date.now();
        const paraIndex = getParagraphNumber(currentText, diff.start);

        if (diff.removed.trim() && diff.added.trim()) {
          // Replace operation
          const newOp = {
            id: `op_${now}_${Math.random().toString(36).slice(2, 6)}`,
            essay_id: currentEssayId || '',
            operation_type: 'REPLACE',
            position: diff.start,
            length: diff.added.length,
            paragraph_index: paraIndex,
            old_content: diff.removed.trim(),
            new_content: diff.added.trim(),
            source: 'user',
            created_at: now,
          };
          updatedOps = [newOp, ...operations];
          setOperations(updatedOps);
        } else if (diff.removed.trim() && (diff.removed.trim().length >= 2 || diff.removed.includes('\n'))) {
          // Significant Delete operation
          const newOp = {
            id: `op_${now}_${Math.random().toString(36).slice(2, 6)}`,
            essay_id: currentEssayId || '',
            operation_type: 'DELETE',
            position: diff.start,
            length: diff.removed.length,
            paragraph_index: paraIndex,
            old_content: diff.removed.trim(),
            source: 'user',
            created_at: now,
          };
          updatedOps = [newOp, ...operations];
          setOperations(updatedOps);
        } else if (diff.added.trim() && (diff.added.trim().length >= 2 || diff.added.includes('\n'))) {
          // Insert operation
          const newOp = {
            id: `op_${now}_${Math.random().toString(36).slice(2, 6)}`,
            essay_id: currentEssayId || '',
            operation_type: 'INSERT',
            position: diff.start,
            length: diff.added.length,
            paragraph_index: paraIndex,
            new_content: diff.added.trim(),
            source: 'user',
            created_at: now,
          };
          updatedOps = [newOp, ...operations];
          setOperations(updatedOps);
        }

        prevTextRef.current = currentText;
      }

      try {
        const saved = await EssaysAPI.save({
          id: currentEssayId,
          title,
          content: currentText,
          operations: updatedOps,
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

    const actionLabels: Record<string, string> = {
      metaphor: '比喻',
      imitation: '仿寫',
      expand: '擴寫',
      concise: '精簡',
      emotion: '加情緒',
      scene: '加畫面',
    };

    const curText = editor?.getText() || '';
    const pos = selectedRange?.from || 0;
    const paraIndex = getParagraphNumber(curText, pos);

    // Log AI Suggestion intent
    const sugOp = {
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      essay_id: currentEssayId || '',
      operation_type: 'AI_SUGGESTION',
      position: pos,
      length: selectedText.length,
      paragraph_index: paraIndex,
      old_content: selectedText,
      new_content: `思考「${actionLabels[action] || action}」修辭引導`,
      source: 'ai',
      created_at: Date.now(),
    };
    setOperations((prev) => [sugOp, ...prev]);

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
    const pos = selectedRange.from;
    const curText = editor.getText();
    const paraIndex = getParagraphNumber(curText, pos);

    editor
      .chain()
      .focus()
      .deleteRange(selectedRange)
      .insertContentAt(selectedRange.from, newText)
      .run();

    const now = Date.now();
    const newOp = {
      id: `op_${now}_${Math.random().toString(36).slice(2, 6)}`,
      essay_id: currentEssayId || '',
      operation_type: 'AI_ACCEPT',
      position: pos,
      length: newText.length,
      paragraph_index: paraIndex,
      old_content: selectedText,
      new_content: newText,
      source: 'ai',
      created_at: now,
    };
    setOperations((prev) => [newOp, ...prev]);
    prevTextRef.current = editor.getText();
    setSaveStatus('saving');
  };

  // Locate and scroll to operation position in editor
  const handleLocateOperation = (position: number, length: number = 0) => {
    if (!editor) return;
    setShowHistory(false);
    const docSize = editor.state.doc.content.size;
    const safePos = Math.min(Math.max(1, position + 1), docSize);
    const safeTo = Math.min(safePos + Math.max(1, length), docSize);

    editor.chain().focus().setTextSelection({ from: safePos, to: safeTo }).scrollIntoView().run();
    const para = getParagraphNumber(editor.getText(), position);
    showToast('info', `已定位至第 ${para} 段對應位置`);
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
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md border-b border-border-subtle px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowListDrawer(true)}
            className="text-xs h-7.5 px-2.5 rounded-lg bg-surface-elevated/70 hover:bg-surface-elevated border-border-subtle shadow-xs"
            title="瀏覽歷史作文與草稿庫"
          >
            <Layers className="w-3.5 h-3.5 mr-1 text-primary" />
            文章庫
          </Button>

          <button
            onClick={handleCreateNew}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-elevated transition-colors"
            title="開啟新寫作草稿"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-0 mx-2">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('saving');
            }}
            placeholder="請輸入作文標題..."
            className="w-full bg-transparent border-0 font-display font-bold text-base sm:text-lg text-text-main focus:outline-none placeholder:opacity-40 truncate"
          />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 text-xs shrink-0">
          <span className="text-text-muted hidden sm:inline-flex items-center text-[11px]">
            {saveStatus === 'saving' ? '儲存中...' : '已儲存'}
          </span>
          <span className="text-text-soft font-mono px-2 py-0.5 bg-surface-elevated border border-border-subtle rounded-md text-[11px]">
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
            className="text-xs py-1 px-2.5 sm:px-3 h-7.5 rounded-lg"
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
        maxWidth="lg"
      >
        <RevisionTimeline
          operations={operations}
          currentText={editor?.getText() || ''}
          onLocate={handleLocateOperation}
        />
      </Modal>

      {/* Essay List & History Management Drawer */}
      <EssayListDrawer
        isOpen={showListDrawer}
        onClose={() => setShowListDrawer(false)}
        currentEssayId={currentEssayId}
        onSelectEssay={handleSelectEssay}
        onCreateNewEssay={handleCreateNew}
      />
    </div>
  );
};

