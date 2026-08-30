import React from 'react';
import { Essay, UnifiedWritingItem } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FileText, Clock, Trash2, Edit3, Award, BookOpen, PenTool } from 'lucide-react';
import { clsx } from 'clsx';

interface EssayCardProps {
  essay: UnifiedWritingItem | Essay;
  promptTitle?: string;
  isActive?: boolean;
  onSelect: (essay: UnifiedWritingItem | Essay) => void;
  onEdit?: (essay: UnifiedWritingItem | Essay) => void;
  onDelete?: (essay: UnifiedWritingItem | Essay) => void;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};

export const EssayCard: React.FC<EssayCardProps> = ({
  essay,
  promptTitle,
  isActive = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const isMockExam = 'sourceType' in essay && essay.sourceType === 'mock_exam';
  const contentRaw = 'current_content' in essay ? essay.current_content : (essay as any).content || '';
  const previewText = stripHtml(contentRaw) || (isMockExam ? '紙本手寫作答完成，點擊查看評析與辨識全文。' : '尚無內容...');
  const displayTitle = essay.title?.trim() || (isMockExam ? '紙本模擬考作答' : '無標題作文');
  const actualPromptTitle = promptTitle || ('promptTitle' in essay ? (essay as any).promptTitle : undefined);
  const wordCount = 'word_count' in essay ? essay.word_count : (essay as any).wordCount || 0;
  const updatedAt = 'updated_at' in essay ? essay.updated_at : (essay as any).updatedAt || ('created_at' in essay ? essay.created_at : (essay as any).createdAt);

  const getStatusBadge = () => {
    switch (essay.status) {
      case 'analyzed':
        return <Badge variant="success">已完成評析</Badge>;
      case 'submitted':
        return <Badge variant="primary">{isMockExam ? '已交卷評析' : '已交卷'}</Badge>;
      case 'draft':
      default:
        return <Badge variant="neutral">草稿中</Badge>;
    }
  };

  const formattedDate = new Date(updatedAt || Date.now()).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card
      className={clsx(
        'group p-4 bg-surface border transition-all hover:border-primary/40 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer',
        isActive ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border-subtle'
      )}
      onClick={() => onSelect(essay)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
              <h3 className="font-display font-bold text-sm text-text-main truncate">
                {displayTitle}
              </h3>
              {isMockExam ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium flex items-center">
                  <Award className="w-2.5 h-2.5 mr-0.5" />
                  紙本模考
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-elevated text-text-soft font-medium flex items-center">
                  <PenTool className="w-2.5 h-2.5 mr-0.5" />
                  電子寫作
                </span>
              )}
              {getStatusBadge()}
            </div>
            {actualPromptTitle && (
              <p className="text-[11px] text-text-muted truncate flex items-center">
                <FileText className="w-3 h-3 mr-1 text-primary/70 shrink-0" />
                題目：{actualPromptTitle}
              </p>
            )}
          </div>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`確定要刪除「${displayTitle}」這篇寫作紀錄嗎？`)) {
                  onDelete(essay);
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-status-danger rounded-md hover:bg-surface-elevated"
              title="刪除紀錄"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-text-soft line-clamp-2 leading-relaxed font-sans">
          {previewText}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 text-[11px] text-text-muted">
        <div className="flex items-center space-x-3">
          <span className="font-mono">{wordCount} 字</span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {!isMockExam && onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(essay);
              }}
              className="text-xs py-1 px-2 h-7 rounded-lg bg-surface hover:text-primary"
              title="進入編輯器"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              編輯
            </Button>
          )}

          <Button
            size="sm"
            variant={isActive ? 'primary' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(essay);
            }}
            className="text-xs py-1 px-2.5 h-7 rounded-lg"
          >
            <BookOpen className="w-3 h-3 mr-1" />
            查看原文與評析
          </Button>
        </div>
      </div>
    </Card>
  );
};
