import React from 'react';
import { EssayAnalysis } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, AlertTriangle, Sparkles, TrendingUp, Compass } from 'lucide-react';

interface EssayAnalysisViewProps {
  analysis: EssayAnalysis;
  title?: string;
}

export const EssayAnalysisView: React.FC<EssayAnalysisViewProps> = ({
  analysis,
  title = '作文評析報告',
}) => {
  const dimensionNames: Record<string, string> = {
    promptMatch: '切題度',
    intentDepth: '立意深度',
    materialRichness: '素材豐富',
    structure: '篇章結構',
    description: '細節描寫',
    language: '語言修辭',
    emotion: '情感真摯',
    conclusion: '結尾餘韻',
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      {/* Top Header Card */}
      <Card className="bg-surface border-border-subtle p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-text-main flex items-center">
            <Sparkles className="w-4 h-4 text-primary mr-2" />
            {title}
          </h2>
          <Badge variant="primary">AI 思考訓練反饋</Badge>
        </div>
        <p className="text-sm text-text-soft leading-relaxed font-display">
          {analysis.overallSummary}
        </p>
      </Card>

      {/* 8-Dimension Dimension Scores */}
      <Card className="bg-surface border-border-subtle p-5 space-y-4">
        <h3 className="text-xs font-semibold text-text-muted flex items-center">
          <TrendingUp className="w-3.5 h-3.5 mr-1" />
          八大寫作維度評析
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(analysis.scores).map(([key, score]) => (
            <div key={key} className="bg-page-bg p-3 rounded-xl border border-border-subtle/50 text-center space-y-1">
              <span className="block text-xs text-text-muted">{dimensionNames[key] || key}</span>
              <span className="font-mono font-bold text-lg text-primary">{score}</span>
              <div className="w-full bg-border-subtle/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strengths Card */}
      <Card className="bg-surface border-border-subtle p-5 space-y-3">
        <h3 className="text-xs font-semibold text-status-success flex items-center">
          <CheckCircle className="w-4 h-4 mr-1.5" />
          做得很好的亮點
        </h3>
        <ul className="space-y-2 text-sm text-text-soft">
          {analysis.strengths.map((str, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success mt-2 shrink-0" />
              <span className="leading-relaxed">{str}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Weaknesses Card */}
      <Card className="bg-surface border-border-subtle p-5 space-y-3">
        <h3 className="text-xs font-semibold text-status-warning flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1.5" />
          最需要留意的調整空間
        </h3>
        <div className="space-y-3 text-sm">
          {analysis.weaknesses.map((w, idx) => (
            <div key={idx} className="bg-page-bg p-3.5 rounded-xl border border-border-subtle/60 space-y-1.5">
              <div className="flex items-center space-x-2">
                <Badge variant="warning">{w.dimension}</Badge>
                <span className="font-semibold text-text-main text-xs">{w.issue}</span>
              </div>
              <p className="text-xs text-text-soft leading-relaxed pl-1">
                建議：{w.suggestion}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Next Practice Advice */}
      <Card className="bg-primary/5 border-primary/20 p-5 space-y-2">
        <h3 className="text-xs font-semibold text-primary flex items-center">
          <Compass className="w-4 h-4 mr-1.5" />
          下一次寫作訓練定向建議
        </h3>
        <p className="text-sm text-text-main font-display leading-relaxed font-medium">
          {analysis.nextPracticeAdvice}
        </p>
      </Card>
    </div>
  );
};
