import React from 'react';
import { EssayOperation } from '../../types';
import { Plus, Trash2, Sparkles, RefreshCw, Feather, Edit3 } from 'lucide-react';

interface RevisionTimelineProps {
  operations: EssayOperation[];
}

export const RevisionTimeline: React.FC<RevisionTimelineProps> = ({ operations }) => {
  if (!operations || operations.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted text-xs">
        尚未有詳細操作歷程紀錄。當你在編輯器中進行輸入、刪除、替換或採用 AI 建議時，系統會自動留存思考歷程。
      </div>
    );
  }

  const getOpIcon = (type: string) => {
    switch (type) {
      case 'INSERT':
        return <Plus className="w-3 h-3 text-status-success" />;
      case 'DELETE':
        return <Trash2 className="w-3 h-3 text-status-danger" />;
      case 'AI_ACCEPT':
        return <Sparkles className="w-3 h-3 text-primary" />;
      case 'AI_SUGGESTION':
        return <Feather className="w-3 h-3 text-accent-warm" />;
      case 'REPLACE':
        return <RefreshCw className="w-3 h-3 text-status-info" />;
      default:
        return <Edit3 className="w-3 h-3 text-text-muted" />;
    }
  };

  const getOpLabel = (op: EssayOperation) => {
    switch (op.operation_type) {
      case 'INSERT':
        return `新增了文字 (${op.new_content?.slice(0, 18) || ''}...)`;
      case 'DELETE':
        return `刪除了一段文字 (${op.old_content?.slice(0, 18) || ''}...)`;
      case 'AI_ACCEPT':
        return `採用了 AI 修飾建議`;
      case 'AI_SUGGESTION':
        return op.new_content || `觸發了 AI 修辭思考引導`;
      case 'REPLACE':
        return `替換了部分文字`;
      default:
        return `編輯修改`;
    }
  };

  return (
    <div className="space-y-3 p-2">
      <div className="relative pl-4 border-l-2 border-border-subtle space-y-4">
        {operations.map((op, idx) => (
          <div key={op.id || idx} className="relative group">
            <div className="absolute -left-5.25 top-0.5 w-4 h-4 rounded-full bg-surface border border-border-subtle flex items-center justify-center shadow-xs">
              {getOpIcon(op.operation_type)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-main leading-relaxed">
                  {getOpLabel(op)}
                </p>
                <span className="text-[10px] text-text-muted shrink-0 ml-2">
                  {new Date(op.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Show text diff snippet if available */}
              {(op.operation_type === 'AI_ACCEPT' || op.operation_type === 'REPLACE') && (op.old_content || op.new_content) && (
                <div className="text-[11px] bg-surface-elevated border border-border-subtle rounded-lg p-2 space-y-1">
                  {op.old_content && (
                    <div className="text-text-muted line-through">
                      <span className="font-semibold text-status-danger mr-1">-</span>
                      {op.old_content}
                    </div>
                  )}
                  {op.new_content && (
                    <div className="text-primary font-medium">
                      <span className="font-semibold text-status-success mr-1">+</span>
                      {op.new_content}
                    </div>
                  )}
                </div>
              )}

              {op.operation_type === 'INSERT' && op.new_content && (
                <div className="text-[11px] bg-surface-elevated border border-border-subtle rounded-lg p-2 text-text-soft">
                  <span className="font-semibold text-status-success mr-1">+</span>
                  {op.new_content}
                </div>
              )}

              {op.operation_type === 'DELETE' && op.old_content && (
                <div className="text-[11px] bg-surface-elevated border border-border-subtle rounded-lg p-2 text-status-danger/90">
                  <span className="font-semibold mr-1">已刪除：</span>
                  {op.old_content}
                </div>
              )}

              {op.operation_type === 'AI_SUGGESTION' && op.old_content && (
                <div className="text-[11px] bg-surface-elevated border border-border-subtle rounded-lg p-2 text-text-muted">
                  <span className="font-semibold text-text-soft mr-1">針對選句：</span>
                  {op.old_content}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
