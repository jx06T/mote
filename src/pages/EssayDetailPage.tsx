import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UnifiedWritingItem, EssayAnalysis } from '../types';
import { EssaysAPI, AnalysisAPI } from '../services/api';
import { EssayAnalysisView } from '../components/analysis/EssayAnalysisView';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  FileText,
  Clock,
  PenTool,
  Award,
  Sparkles,
  Edit3,
  Columns,
  BookOpen,
  CheckCircle,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { clsx } from 'clsx';

export const EssayDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [item, setItem] = useState<UnifiedWritingItem | null>(null);
  const [analysis, setAnalysis] = useState<EssayAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'analysis' | 'split'>('content');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const writingItem = await EssaysAPI.getUnified(id);
      setItem(writingItem);

      if (writingItem) {
        // Fetch dedicated analysis for this item
        const report = await AnalysisAPI.getForTarget(id);
        setAnalysis(report || writingItem.analysis || null);
        // If already analyzed, default tab to analysis if coming from report intent
        if (report || writingItem.analysis) {
          if (writingItem.status === 'analyzed') {
            setActiveTab('analysis');
          }
        }
      }
    } catch (err) {
      console.error('[Load Essay Detail Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!item) return;
    const cleanContent = item.content.replace(/<[^>]*>?/gm, ' ').trim();
    if (!cleanContent) {
      toast.error('文章內容不可為空，無法進行評析。');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await AnalysisAPI.evaluate(
        item.title,
        cleanContent,
        item.promptTitle,
        item.sourceType === 'editor' ? item.id : undefined,
        item.sourceType === 'mock_exam' ? item.id : undefined
      );

      setAnalysis(res.analysis);
      setItem((prev) => (prev ? { ...prev, status: 'analyzed', analysis: res.analysis } : null));
      setActiveTab('analysis');
      toast.success('AI 八大面向作文評析已完成！');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '評析失敗，請稍後重試。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-text-muted">
        載入寫作作品中...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-status-warning mx-auto" />
        <div className="space-y-1">
          <h2 className="font-display font-bold text-base text-text-main">查無此作品紀錄</h2>
          <p className="text-xs text-text-muted">該篇文章或模考紀錄可能已被刪除或不存在。</p>
        </div>
        <Button size="sm" onClick={() => navigate('/essays')}>
          返回作品庫
        </Button>
      </div>
    );
  }

  const isMockExam = item.sourceType === 'mock_exam';
  const displayTitle = item.title?.trim() || (isMockExam ? '紙本模擬考作答' : '無標題作文');
  const formattedDate = new Date(item.updatedAt || item.createdAt).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusBadge = () => {
    switch (item.status) {
      case 'analyzed':
        return <Badge variant="success">已完成評析</Badge>;
      case 'submitted':
        return <Badge variant="primary">{isMockExam ? '已交卷評析' : '已交卷'}</Badge>;
      case 'draft':
      default:
        return <Badge variant="neutral">草稿中</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/essays')}
            className="text-xs text-text-muted hover:text-text-main transition-colors flex items-center font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            返回作品庫
          </button>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-text-main">
              {displayTitle}
            </h1>
            {isMockExam ? (
              <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium flex items-center">
                <Award className="w-3 h-3 mr-1" />
                紙本模擬考（{item.durationMinutes || 50} 分鐘手寫）
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-md bg-surface-elevated text-text-soft font-medium flex items-center">
                <PenTool className="w-3 h-3 mr-1" />
                電子寫作
              </span>
            )}
            {getStatusBadge()}
          </div>

          <div className="flex items-center space-x-4 text-xs text-text-muted flex-wrap gap-y-1">
            {item.promptTitle && (
              <span className="flex items-center text-primary/80">
                <FileText className="w-3.5 h-3.5 mr-1 shrink-0" />
                題目：{item.promptTitle}
              </span>
            )}
            <span className="font-mono">{item.wordCount || 0} 字</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
          {!isMockExam && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/editor?id=${item.id}`)}
              className="text-xs py-1.5 px-3 rounded-xl bg-surface"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1 text-primary" />
              進入編輯器
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="text-xs py-1.5 px-3 rounded-xl shadow-xs"
          >
            {isAnalyzing ? (
              <>
                <RotateCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                AI 評析中...
              </>
            ) : analysis ? (
              <>
                <RotateCw className="w-3.5 h-3.5 mr-1" />
                重新評析
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                進行 AI 評析
              </>
            )}
          </Button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setActiveTab('content')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl transition-all font-medium flex items-center',
              activeTab === 'content'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            學生原文檢視
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl transition-all font-medium flex items-center',
              activeTab === 'analysis'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            專屬評析報告 {analysis ? '(已產出)' : ''}
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={clsx(
              'hidden lg:flex px-3.5 py-1.5 rounded-xl transition-all font-medium items-center',
              activeTab === 'split'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-text-muted hover:text-text-main hover:bg-surface-elevated'
            )}
          >
            <Columns className="w-3.5 h-3.5 mr-1.5" />
            左右對照模式
          </button>
        </div>
      </div>

      {/* View 1: Original Content View */}
      {activeTab === 'content' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {isMockExam && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-text-soft flex items-center justify-between">
              <span className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-primary shrink-0" />
                此為 50 分鐘實體稿紙全真手寫作答，經相機拍照並由 OCR 文字辨識完整匯入。
              </span>
            </div>
          )}

          <Card className="p-6 sm:p-8 bg-surface border-border-subtle shadow-xs space-y-6">
            <div className="border-b border-border-subtle/60 pb-4 space-y-1">
              <h2 className="font-display font-bold text-lg text-text-main text-center">
                {displayTitle}
              </h2>
              {item.promptTitle && (
                <p className="text-xs text-text-muted text-center">
                  題目：{item.promptTitle}
                </p>
              )}
            </div>

            {/* Essay Content Body */}
            <div className="text-sm sm:text-base text-text-main leading-loose whitespace-pre-wrap font-serif tracking-wide py-2 min-h-[300px]">
              {item.content || '尚無文字內容'}
            </div>

            <div className="pt-4 border-t border-border-subtle/60 flex items-center justify-between text-xs text-text-muted">
              <span>全文統計：{item.wordCount || 0} 字</span>
              <span>寫作來源：{isMockExam ? '紙本模擬考' : '電子線上編輯'}</span>
            </div>
          </Card>
        </div>
      )}

      {/* View 2: Dedicated AI Analysis View */}
      {activeTab === 'analysis' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {analysis ? (
            <EssayAnalysisView
              analysis={analysis}
              title={`作文專屬評析報告：${displayTitle}`}
            />
          ) : (
            <div className="py-16 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle p-8 space-y-4 shadow-xs">
              <Sparkles className="w-10 h-10 text-primary mx-auto" />
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-text-main">
                  本篇作品尚未進行 AI 評析
                </h3>
                <p className="text-xs text-text-soft max-w-md mx-auto">
                  點擊下方按鈕，AI 將從「切題、立意、素材、結構、描寫、語言、情感、結尾」八大維度深入剖析本篇文章。
                </p>
              </div>
              <div className="pt-2">
                <Button
                  size="md"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="text-xs px-4"
                >
                  {isAnalyzing ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      AI 評析生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      立即進行 AI 八維評析
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 3: Split View (Side-by-Side) */}
      {activeTab === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Original Essay */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-soft flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-primary" />
              學生原文
            </h3>
            <Card className="p-6 bg-surface border-border-subtle shadow-xs space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
              <div className="border-b border-border-subtle/60 pb-3">
                <h2 className="font-display font-bold text-base text-text-main">
                  {displayTitle}
                </h2>
                {item.promptTitle && (
                  <p className="text-xs text-text-muted mt-0.5">
                    題目：{item.promptTitle}
                  </p>
                )}
              </div>
              <div className="text-sm text-text-main leading-relaxed whitespace-pre-wrap font-serif py-1">
                {item.content || '尚無文字內容'}
              </div>
            </Card>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-soft flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
              AI 專屬評析
            </h3>
            <div className="max-h-[75vh] overflow-y-auto no-scrollbar">
              {analysis ? (
                <EssayAnalysisView
                  analysis={analysis}
                  title={`評析報告：${displayTitle}`}
                />
              ) : (
                <Card className="py-16 text-center text-xs text-text-muted bg-surface border-border-subtle p-6 space-y-3">
                  <Sparkles className="w-8 h-8 text-primary mx-auto" />
                  <p className="font-semibold text-text-main">尚未進行 AI 評析</p>
                  <Button
                    size="sm"
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="text-xs mt-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    立即評析
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
