import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedWritingItem } from '../../types';
import { EssaysAPI } from '../../services/api';
import { EssayCard } from './EssayCard';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Plus, Search, Layers, BookOpen, PenTool, Award } from 'lucide-react';
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
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState<UnifiedWritingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'editor' | 'mock_exam' | 'draft' | 'analyzed'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const unifiedList = await EssaysAPI.listUnified();
      setItems(unifiedList);
    } catch (err) {
      console.error('[Load Unified in Drawer Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleDeleteItem = async (item: UnifiedWritingItem | any) => {
    try {
      if (item.sourceType === 'mock_exam') {
        toast.info('紙本模擬考為正式測驗紀錄，不提供刪除。');
        return;
      }
      const ok = await EssaysAPI.delete(item.id);
      if (ok) {
        toast.success(`已成功刪除「${item.title || '無標題作文'}」`);
        await loadData();
        if (currentEssayId === item.id) {
          onCreateNewEssay();
        }
      } else {
        toast.error('刪除作文失敗，請重試。');
      }
    } catch (err: any) {
      toast.error(err.message || '刪除作文失敗');
    }
  };

  const handleSelectItem = (selected: UnifiedWritingItem | any) => {
    if (selected.sourceType === 'mock_exam') {
      onClose();
      navigate(`/essays/${selected.id}`);
      return;
    }
    onSelectEssay(selected.id);
    onClose();
  };

  const filteredItems = items.filter((item) => {
    if (filterMode === 'editor' && item.sourceType !== 'editor') return false;
    if (filterMode === 'mock_exam' && item.sourceType !== 'mock_exam') return false;
    if (filterMode === 'draft' && item.status !== 'draft') return false;
    if (filterMode === 'analyzed' && item.status !== 'analyzed' && item.status !== 'submitted') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = (item.title || '').toLowerCase().includes(q);
    const matchContent = (item.content || '').toLowerCase().includes(q);
    return matchTitle || matchContent;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="我的寫作作品庫（電子作文與紙本模考）"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Top Action & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋作品標題或內容關鍵字..."
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
        <div className="flex items-center space-x-1 border-b border-border-subtle pb-2 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium shrink-0 ${
              filterMode === 'all'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            全部作品 ({items.length})
          </button>
          <button
            onClick={() => setFilterMode('editor')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium shrink-0 ${
              filterMode === 'editor'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            電子寫作 ({items.filter((i) => i.sourceType === 'editor').length})
          </button>
          <button
            onClick={() => setFilterMode('mock_exam')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium shrink-0 ${
              filterMode === 'mock_exam'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            紙本模考 ({items.filter((i) => i.sourceType === 'mock_exam').length})
          </button>
          <button
            onClick={() => setFilterMode('draft')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium shrink-0 ${
              filterMode === 'draft'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            草稿中 ({items.filter((i) => i.status === 'draft').length})
          </button>
          <button
            onClick={() => setFilterMode('analyzed')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium shrink-0 ${
              filterMode === 'analyzed'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            已評析 (
            {
              items.filter((i) => i.status === 'analyzed' || i.status === 'submitted').length
            }
            )
          </button>
        </div>

        {/* List Grid / Scrollable */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              載入寫作作品中...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted bg-page-bg rounded-2xl border border-border-subtle/60 p-6 space-y-3">
              <Layers className="w-8 h-8 text-text-muted/60 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-text-main">
                  {searchQuery || filterMode !== 'all' ? '查無符合條件的寫作紀錄' : '目前尚無儲存的作品紀錄'}
                </p>
                <p className="text-[11px]">
                  在電子寫作中書寫或完成紙本模擬考，系統皆會自動同步至此作品庫。
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
                立即開啟新寫作
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <EssayCard
                  key={item.id}
                  essay={item}
                  isActive={item.id === currentEssayId}
                  onSelect={handleSelectItem}
                  onEdit={(selected) => {
                    onSelectEssay(selected.id);
                    onClose();
                  }}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
