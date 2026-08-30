import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Essay, PromptItem } from '../types';
import { EssaysAPI, PromptsAPI } from '../services/api';
import { EssayCard } from '../components/editor/EssayCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Search, Plus, PenTool, BookOpen, CheckCircle, FileEdit, Layers } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const EssaysPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted' | 'analyzed'>('all');
  const [isLoading, setIsLoading] = useState(true);

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
      console.error('[Load Essays Page Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteEssay = async (essay: Essay) => {
    try {
      const ok = await EssaysAPI.delete(essay.id);
      if (ok) {
        toast.success(`已成功刪除「${essay.title || '無標題作文'}」`);
        await loadData();
      } else {
        toast.error('刪除作文失敗，請稍後重試。');
      }
    } catch (err: any) {
      toast.error(err.message || '刪除作文失敗');
    }
  };

  const totalWords = essays.reduce((acc, cur) => acc + (cur.word_count || 0), 0);
  const draftCount = essays.filter((e) => e.status === 'draft').length;
  const submittedCount = essays.filter((e) => e.status === 'submitted').length;
  const analyzedCount = essays.filter((e) => e.status === 'analyzed').length;

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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-text-main">
            我的寫作紀錄與文章庫
          </h1>
          <p className="text-xs text-text-muted">
            完整保存每篇作文草稿、累積字數、評析結果與寫作思考歷程。
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/editor')}
          className="rounded-xl text-xs py-2 px-3.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          開啟全新寫作
        </Button>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-surface border-border-subtle flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted">總文章數</p>
            <p className="font-display font-bold text-base text-text-main">{essays.length} 篇</p>
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
            <p className="text-[11px] text-text-muted">進行中草稿</p>
            <p className="font-display font-bold text-base text-text-main">{draftCount} 篇</p>
          </div>
        </Card>

        <Card className="p-3.5 bg-surface border-border-subtle flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center shrink-0">
            <CheckCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] text-text-muted">已完成評析</p>
            <p className="font-display font-bold text-base text-text-main">{analyzedCount + submittedCount} 篇</p>
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
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            全部 ({essays.length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              statusFilter === 'draft'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            草稿 ({draftCount})
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              statusFilter === 'submitted'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface border border-border-subtle text-text-soft hover:text-text-main'
            }`}
          >
            已交卷 ({submittedCount})
          </button>
          <button
            onClick={() => setStatusFilter('analyzed')}
            className={`px-3 py-1.5 rounded-xl transition-all font-medium shrink-0 ${
              statusFilter === 'analyzed'
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
          載入文章庫中...
        </div>
      ) : filteredEssays.length === 0 ? (
        <div className="py-16 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle p-8 space-y-4 shadow-xs">
          <Layers className="w-10 h-10 text-primary/60 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-text-main">
              {searchQuery || statusFilter !== 'all' ? '查無符合條件的作文' : '目前尚無文章紀錄'}
            </h3>
            <p className="text-xs text-text-soft max-w-sm mx-auto">
              開啟電子寫作，系統會在您輸入時即時自動保存草稿，並完整記錄各階段的修改思考歷程。
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => navigate('/editor')}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              開始第一篇寫作
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEssays.map((essay) => (
            <EssayCard
              key={essay.id}
              essay={essay}
              promptTitle={essay.prompt_id ? prompts[essay.prompt_id] : undefined}
              onSelect={(selected) => navigate(`/editor?id=${selected.id}`)}
              onDelete={handleDeleteEssay}
            />
          ))}
        </div>
      )}
    </div>
  );
};
