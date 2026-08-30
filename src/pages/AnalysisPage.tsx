import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisAPI, EssaysAPI } from '../services/api';
import { WeaknessItem, UnifiedWritingItem } from '../types';
import { FeatureGate } from '../components/auth/FeatureGate';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  AlertTriangle,
  PenTool,
  Award,
  Compass,
  ArrowRight,
  TrendingUp,
  FileCheck,
  BookOpen,
} from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [analyzedWorks, setAnalyzedWorks] = useState<UnifiedWritingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [wks, works] = await Promise.all([
          AnalysisAPI.getWeaknesses(),
          EssaysAPI.listUnified(),
        ]);
        setWeaknesses(wks);
        setAnalyzedWorks(
          works.filter((w) => w.status === 'analyzed' || w.status === 'submitted')
        );
      } catch (err) {
        console.error('[Load Global Weakness Analysis Error]', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <Badge variant="success">正在進步中</Badge>;
      case 'deteriorating':
        return <Badge variant="danger">需特別加強</Badge>;
      default:
        return <Badge variant="neutral">持續觀察</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-7">
      <div className="space-y-1">
        <h1 className="font-display font-bold text-2xl text-text-main">
          個人寫作特徵與全域弱點追蹤
        </h1>
        <p className="text-xs text-text-muted">
          整合全站所有「電子寫作」與「紙本模考」歷史作品，宏觀統計常見弱點盲區與長期演進趨勢。
        </p>
      </div>

      <FeatureGate feature="essay_analysis">
        {/* Macro Weakness Profile Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-text-main flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-status-warning" />
              常態寫作弱點特徵統計 ({weaknesses.length})
            </h2>
            <span className="text-[11px] text-text-muted">
              根據全站送交之文章評析自動聚合
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              載入個人寫作弱點特徵中...
            </div>
          ) : weaknesses.length === 0 ? (
            <Card className="p-8 text-center text-xs text-text-muted bg-surface border-border-subtle space-y-3 shadow-xs">
              <Compass className="w-8 h-8 mx-auto text-text-muted/60" />
              <div className="space-y-1">
                <h3 className="font-display font-bold text-sm text-text-main">
                  目前尚未累積足夠的弱點特徵資料
                </h3>
                <p className="text-xs text-text-soft max-w-sm mx-auto">
                  完成電子寫作或紙本模擬考並進行評析後，系統將自動提取跨文章的常態特徵與調整建議。
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-2">
                <Button size="sm" onClick={() => navigate('/editor')} className="text-xs">
                  <PenTool className="w-3.5 h-3.5 mr-1" />
                  開始電子寫作
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/exams')}
                  className="text-xs bg-surface"
                >
                  <Award className="w-3.5 h-3.5 mr-1" />
                  進行紙本模考
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weaknesses.map((wk) => (
                <Card
                  key={wk.id}
                  className="p-4 bg-surface border-border-subtle shadow-xs space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="warning">{wk.dimension}</Badge>
                      {getTrendBadge(wk.recent_trend)}
                    </div>
                    <p className="font-semibold text-xs text-text-main leading-relaxed">
                      {wk.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[11px] text-text-muted">
                    <span className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-primary" />
                      累積出現 {wk.occurrence_count} 次
                    </span>
                    <button
                      onClick={() => navigate('/essays')}
                      className="text-primary hover:underline font-medium"
                    >
                      尋找相關文章
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recently Analyzed Works Index */}
        <div className="space-y-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-text-soft flex items-center">
              <FileCheck className="w-4 h-4 mr-1.5 text-primary" />
              已評析作品專屬報告列表 ({analyzedWorks.length})
            </h2>
            <button
              onClick={() => navigate('/essays')}
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center"
            >
              前往作品庫
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          {analyzedWorks.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-muted bg-surface rounded-xl border border-border-subtle space-y-1">
              <p>尚未有已完成評析的作品。</p>
              <p className="text-[11px]">進入作品庫挑選文章，點擊「進行 AI 評析」即可產出專屬報告。</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {analyzedWorks.map((work) => (
                <div
                  key={work.id}
                  onClick={() => navigate(`/essays/${work.id}`)}
                  className="p-3.5 bg-surface border border-border-subtle hover:border-primary/40 rounded-xl transition-all shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="font-display font-bold text-xs text-text-main truncate group-hover:text-primary transition-colors">
                        {work.title || '無標題作品'}
                      </h3>
                      {work.sourceType === 'mock_exam' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex items-center">
                          <Award className="w-2.5 h-2.5 mr-0.5" />
                          紙本模考
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-soft font-medium flex items-center">
                          <PenTool className="w-2.5 h-2.5 mr-0.5" />
                          電子寫作
                        </span>
                      )}
                      <Badge variant="success">已完成評析</Badge>
                    </div>
                    {work.promptTitle && (
                      <p className="text-[11px] text-text-muted truncate">
                        題目：{work.promptTitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 text-xs text-text-muted shrink-0 pt-1 sm:pt-0">
                    <span className="font-mono">{work.wordCount || 0} 字</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/essays/${work.id}`);
                      }}
                      className="text-xs py-1 px-2.5 h-7 rounded-lg bg-surface"
                    >
                      <BookOpen className="w-3 h-3 mr-1 text-primary" />
                      查看原文與評析
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FeatureGate>
    </div>
  );
};
