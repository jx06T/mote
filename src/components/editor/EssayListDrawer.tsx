import React, { useState, useEffect } from 'react';
import { Essay, PromptItem } from '../../types';
import { EssaysAPI, PromptsAPI } from '../../services/api';
import { EssayCard } from './EssayCard';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Search, BookOpen, Layers } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface EssayListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentEssayId?: string;
  onSelectEssay: (essayId: string) => void;
  onCreateNewEssay: () => void;
}

export const EssayListDrawer: React.FC<EssayListDrawerProps> = ({
  isOpen,
  onClose,
  currentEssayId,
  onSelectEssay,
  onCreateNewEssay,
}) => {
  const toast = useToast();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted' | 'analyzed'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [essayList, promptList] = await Promise.all([
        EssaysAPI.list(),
        PromptsAPI.list(),
      ]);
      setEssays(essayList);

      const promptMap: Record<string, string> = {};
      promptList.forEach((p: PromptItem) => {
        promptMap[p.id] = p.title;
      });
      setPrompts(promptMap);
    } catch (err) {
      console.error('[Load Essays in Drawer Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleDeleteEssay = async (essay: Essay) => {
    try {
      const ok = await EssaysAPI.delete(essay.id);
      if (ok) {
        toast.success(`已成功刪除「${essay.title || '無標題作文'}」`);
        await loadData();
        if (currentEssayId === essay.id) {
          onCreateNewEssay();
        }
      } else {
        toast.error('刪除作文失敗，請重試。');
      }
    } catch (err: any) {
      toast.error(err.message || '刪除作文失敗');
    }
  };

  const filteredEssays = essays.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = (item.title || '').toLowerCase().includes(q);
    const matchContent = (item.current_content || '').toLowerCase().includes(q);
    return matchTitle || matchContent;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="我的寫作紀錄與文章庫"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Top Control Bar: Action & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋文章標題或內容關鍵字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-page-bg border border-border-subtle rounded-xl text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              onCreateNewEssay();
              onClose();
            }}
            className="text-xs py-1.5 px-3 rounded-xl shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            新建空白作文
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 border-b border-border-subtle pb-2 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              statusFilter === 'all'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            全部 ({essays.length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              statusFilter === 'draft'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            草稿 ({essays.filter((e) => e.status === 'draft').length})
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              statusFilter === 'submitted'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            已交卷 ({essays.filter((e) => e.status === 'submitted').length})
          </button>
          <button
            onClick={() => setStatusFilter('analyzed')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              statusFilter === 'analyzed'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            已評析 ({essays.filter((e) => e.status === 'analyzed').length})
          </button>
        </div>

        {/* Essay List Grid / Scrollable */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              載入文章紀錄中...
            </div>
          ) : filteredEssays.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted bg-page-bg rounded-2xl border border-border-subtle/60 p-6 space-y-3">
              <Layers className="w-8 h-8 text-text-muted/60 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-text-main">
                  {searchQuery || statusFilter !== 'all' ? '查無符合條件的作文' : '目前尚無儲存的文章紀錄'}
                </p>
                <p className="text-[11px]">
                  在編輯器中書寫時，系統將自動為你即時保存草稿與修改歷程。
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onCreateNewEssay();
                  onClose();
                }}
                className="text-xs mt-2"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                立即開始第一篇寫作
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredEssays.map((essay) => (
                <EssayCard
                  key={essay.id}
                  essay={essay}
                  promptTitle={essay.prompt_id ? prompts[essay.prompt_id] : undefined}
                  isActive={essay.id === currentEssayId}
                  onSelect={(selected) => {
                    onSelectEssay(selected.id);
                    onClose();
                  }}
                  onDelete={handleDeleteEssay}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
