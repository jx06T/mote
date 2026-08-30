import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisAPI } from '../services/api';
import { WeaknessItem, EssayAnalysis } from '../types';
import { EssayAnalysisView } from '../components/analysis/EssayAnalysisView';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Sparkles, TrendingUp, AlertTriangle, PenTool, Award, Compass } from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<EssayAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [wks, latest] = await Promise.all([
          AnalysisAPI.getWeaknesses(),
          AnalysisAPI.getLatest(),
        ]);
        setWeaknesses(wks);
        setLatestAnalysis(latest);
      } catch (err) {
        console.error('[Load Analysis Error]', err);
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
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-7">
      <div className="space-y-1">
        <h1 className="font-display font-bold text-2xl text-text-main">
          個人寫作特徵與弱點追蹤
        </h1>
        <p className="text-xs text-text-muted">
          系統持續追蹤你在各篇作文中反覆出現的結構、立意與修辭問題，提供定向訓練方針。
        </p>
      </div>

      {/* Weakness Profile Aggregation */}
      <Card className="bg-surface border-border-subtle p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-semibold text-text-main flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1.5 text-status-warning" />
          常態寫作特徵分析 ({weaknesses.length})
        </h2>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">
            載入個人寫作弱點特徵中...
          </div>
        ) : weaknesses.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted bg-page-bg rounded-xl border border-border-subtle/50 space-y-2">
            <Compass className="w-6 h-6 mx-auto text-text-muted/60" />
            <p>目前尚未累積足夠的寫作弱點資料。</p>
            <p className="text-[11px]">完成電子作文或紙本模擬考後，系統將自動提取常態特徵與調整建議。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weaknesses.map((wk) => (
              <div
                key={wk.id}
                className="p-3.5 bg-page-bg rounded-xl border border-border-subtle/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="warning">{wk.dimension}</Badge>
                    <span className="font-semibold text-xs text-text-main">
                      {wk.description}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs text-text-muted shrink-0">
                  <span>累積出現 {wk.occurrence_count} 次</span>
                  {getTrendBadge(wk.recent_trend)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Latest Evaluation Report */}
      {latestAnalysis ? (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-text-soft flex items-center">
            <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
            最近一次完整作文評析報告
          </h2>
          <EssayAnalysisView analysis={latestAnalysis} title="作文多面向評析" />
        </div>
      ) : (
        !isLoading && (
          <div className="py-12 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle p-6 space-y-4">
            <Sparkles className="w-8 h-8 text-primary mx-auto" />
            <div className="space-y-1">
              <h3 className="font-display font-bold text-sm text-text-main">
                尚未有作文評析紀錄
              </h3>
              <p className="text-xs text-text-soft max-w-sm mx-auto">
                開始一篇電子寫作或紙本模擬考，送交後 AI 將針對 8 大維度給出深入的評析反饋。
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <Button size="sm" onClick={() => navigate('/editor')} className="text-xs">
                <PenTool className="w-3.5 h-3.5 mr-1" />
                開啟電子寫作
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/exams')} className="text-xs">
                <Award className="w-3.5 h-3.5 mr-1" />
                開始紙本模考
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
