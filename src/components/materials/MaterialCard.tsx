import React from 'react';
import { Material } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, MapPin, Tag, Sparkles, MessageCircle } from 'lucide-react';

interface MaterialCardProps {
  material: Material;
  onClick?: () => void;
  onUseForWriting?: () => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onClick,
  onUseForWriting,
}) => {
  const historyCount = material.interview_history?.length || 0;

  return (
    <Card
      hoverable
      onClick={onClick}
      className="group relative flex flex-col justify-between space-y-3 p-4.5 bg-surface border-border-subtle"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-bold text-text-main text-base group-hover:text-primary transition-colors">
            {material.title}
          </h3>
          {material.themes && material.themes.length > 0 && (
            <Badge variant="primary" className="shrink-0 text-[10px]">
              {material.themes[0]}
            </Badge>
          )}
        </div>

        <p className="text-text-soft text-sm line-clamp-3 leading-relaxed mb-3">
          {material.story}
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-text-muted">
          {(material.time || material.time_desc) && (
            <span className="inline-flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-text-muted/70" />
              {material.time || material.time_desc}
            </span>
          )}
          {(material.location || material.location_desc) && (
            <span className="inline-flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-text-muted/70" />
              {material.location || material.location_desc}
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {material.tags?.slice(0, 2).map((t, idx) => (
            <span key={idx} className="text-[11px] text-text-muted flex items-center">
              <Tag className="w-3 h-3 mr-0.5" />
              {t}
            </span>
          ))}
          {historyCount > 0 && (
            <span className="text-[11px] text-primary/80 flex items-center bg-primary/5 px-1.5 py-0.5 rounded">
              <MessageCircle className="w-3 h-3 mr-1" />
              {historyCount} 則對話
            </span>
          )}
        </div>

        {onUseForWriting && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUseForWriting();
            }}
            className="text-xs font-medium text-primary hover:text-primary-hover flex items-center transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            帶入寫作
          </button>
        )}
      </div>
    </Card>
  );
};
