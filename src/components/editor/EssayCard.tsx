import React from 'react';
import { Essay } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FileText, Clock, Trash2, Edit3 } from 'lucide-react';
import { clsx } from 'clsx';

interface EssayCardProps {
  essay: Essay;
  promptTitle?: string;
  isActive?: boolean;
  onSelect: (essay: Essay) => void;
  onDelete?: (essay: Essay) => void;
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
  onDelete,
}) => {
  const previewText = stripHtml(essay.current_content) || '尚無內容...';
  const displayTitle = essay.title?.trim() || '無標題作文';

  const getStatusBadge = () => {
    switch (essay.status) {
      case 'analyzed':
        return <Badge variant="success">已完成評析</Badge>;
      case 'submitted':
        return <Badge variant="primary">已交卷</Badge>;
      case 'draft':
      default:
        return <Badge variant="neutral">草稿中</Badge>;
    }
  };

  const formattedDate = new Date(essay.updated_at || essay.created_at).toLocaleDateString([], {
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
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-display font-bold text-sm text-text-main truncate">
                {displayTitle}
              </h3>
              {getStatusBadge()}
            </div>
            {promptTitle && (
              <p className="text-[11px] text-text-muted truncate flex items-center">
                <FileText className="w-3 h-3 mr-1 text-primary/70 shrink-0" />
                題目：{promptTitle}
              </p>
            )}
          </div>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`確定要刪除「${displayTitle}」這篇作文紀錄嗎？`)) {
                  onDelete(essay);
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-status-danger rounded-md hover:bg-surface-elevated"
              title="刪除作文"
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
          <span className="font-mono">{essay.word_count || 0} 字</span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formattedDate}
          </span>
        </div>

        <Button
          size="sm"
          variant={isActive ? 'primary' : 'outline'}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(essay);
          }}
          className="text-xs py-1 px-2.5 h-7 rounded-lg"
        >
          <Edit3 className="w-3 h-3 mr-1" />
          {isActive ? '編輯中' : '開啟編輯'}
        </Button>
      </div>
    </Card>
  );
};
