import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UnifiedWritingItem } from '../types';
import { EssaysAPI } from '../services/api';
import { EssayCard } from '../components/editor/EssayCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Search, Plus, PenTool, BookOpen, CheckCircle, FileEdit, Layers, Award } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const EssaysPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState<UnifiedWritingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'editor' | 'mock_exam' | 'draft' | 'analyzed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const unifiedList = await EssaysAPI.listUnified();
      setItems(unifiedList);
    } catch (err) {
      console.error('[Load Essays Page Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      } else {
        toast.error('刪除作文失敗，請稍後重試。');
      }
    } catch (err: any) {
      toast.error(err.message || '刪除作文失敗');
    }
  };

  const handleSelectItem = (selected: UnifiedWritingItem | any) => {
    if (selected.sourceType === 'mock_exam') {
      navigate('/analysis');
      return;
    }
    navigate(`/editor?id=${selected.id}`);
  };

  const totalWords = items.reduce((acc, cur) => acc + (cur.wordCount || 0), 0);
  const editorCount = items.filter((i) => i.sourceType === 'editor').length;
  const mockExamCount = items.filter((i) => i.sourceType === 'mock_exam').length;
  const draftCount = items.filter((i) => i.status === 'draft').length;
  const analyzedCount = items.filter((i) => i.status === 'analyzed' || i.status === 'submitted').length;

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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-text-main">
            我的寫作紀錄與作品庫
          </h1>
          <p className="text-xs text-text-muted">
            全面整合「電子寫作」與「紙本模擬考」所有歷史作品、累積字數、評析結果與思考歷程。
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/exams')}
            className="rounded-xl text-xs py-2 px-3 shadow-xs bg-surface"
          >
            <Award className="w-4 h-4 mr-1.5 text-primary" />
            紙本模擬考
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/editor')}
            className="rounded-xl text-xs py-2 px-3.5 shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            開啟電子寫作
          </Button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-surface border-border-subtle flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted">總寫作作品</p>
            <p className="font-display font-bold text-base text-text-main">{items.length} 篇</p>
          </div>
        </Card>

        <Card className="p-3.5 bg-surface border-border-subtle flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-surface-elevated text-text-soft flex items-center justify-center shrink-0">
            <PenTool className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted">累積寫作字數</p>
            <p className="font-display font-bold text-base text-text-main font-mono">
              {totalWords.toLocaleString()} 字
            </p>
          </div>
        </Card>

        <Card className="p-3.5 bg-surface border-border-subtle flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-status-warning/10 text-status-warning flex items-center justify-center shrink-0">
            <FileEdit className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted">電子草稿中</p>
            <p className="font-display font-bold text-base text-text-main">{draftCount} 篇</p>
          </div>
        </Card>

        <Card className="p-3.5 bg-surface border-border-subtle flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center shrink-0">
            <CheckCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted">完成評析（含模考）</p>
            <p className="font-display font-bold text-base text-text-main">{analyzedCount} 篇</p>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋作文標題或內容關鍵字..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-xl text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary/60 shadow-xs"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              filterMode === 'all'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            全部 ({items.length})
          </button>
          <button
            onClick={() => setFilterMode('editor')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              filterMode === 'editor'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            電子寫作 ({editorCount})
          </button>
          <button
            onClick={() => setFilterMode('mock_exam')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              filterMode === 'mock_exam'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            紙本模考 ({mockExamCount})
          </button>
          <button
            onClick={() => setFilterMode('draft')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              filterMode === 'draft'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            草稿 ({draftCount})
          </button>
          <button
            onClick={() => setFilterMode('analyzed')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              filterMode === 'analyzed'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            已評析 ({analyzedCount})
          </button>
        </div>
      </div>

      {/* Main Essays Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-text-muted">
          載入寫作作品庫中...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle p-8 space-y-4 shadow-xs">
          <Layers className="w-10 h-10 text-primary/60 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-text-main">
              {searchQuery || filterMode !== 'all' ? '查無符合條件的寫作紀錄' : '目前尚無作品紀錄'}
            </h3>
            <p className="text-xs text-text-soft max-w-sm mx-auto">
              開啟電子寫作或進行紙本模擬考，系統將自動為你留存每一篇作品與多面向評析報告。
            </p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <Button
              size="sm"
              onClick={() => navigate('/editor')}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              開始電子寫作
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/exams')}
              className="text-xs"
            >
              <Award className="w-3.5 h-3.5 mr-1" />
              前往模擬考
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <EssayCard
              key={item.id}
              essay={item}
              onSelect={handleSelectItem}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};
