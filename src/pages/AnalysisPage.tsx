import React, { useState, useEffect } from 'react';
import { AnalysisAPI } from '../services/api';
import { WeaknessItem, EssayAnalysis } from '../types';
import { EssayAnalysisView } from '../components/analysis/EssayAnalysisView';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Sparkles, TrendingUp, Compass, AlertTriangle, CheckCircle } from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<EssayAnalysis | null>(null);

  useEffect(() => {
    async function load() {
      const list = await AnalysisAPI.getWeaknesses();
      setWeaknesses(list);

      // Load mock/latest analysis
      const res = await AnalysisAPI.evaluate(
        '當我轉身看見那道光',
        '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。風吹得雨絲斜斜掃進來，大家相視苦笑。我看著水窪倒映出的微光，忽然明白那些看似狼狽的等待，也是時光留給我們的溫柔片刻。'
      );
      setLatestAnalysis(res.analysis);
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
          常態寫作特徵分析
        </h2>

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
      </Card>

      {/* Latest Evaluation Report */}
      {latestAnalysis && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-text-soft flex items-center">
            <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
            最近一篇作文完整分析報告
          </h2>
          <EssayAnalysisView analysis={latestAnalysis} title="當我轉身看見那道光" />
        </div>
      )}
    </div>
  );
};
