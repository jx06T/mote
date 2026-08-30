import React, { useState, useEffect } from 'react';
import { Material } from '../../types';
import { MaterialsAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Sparkles, Search, ArrowRight, Check } from 'lucide-react';

interface MaterialReverseSearchProps {
  promptText: string;
  onSelectMaterial: (material: Material) => void;
}

export const MaterialReverseSearch: React.FC<MaterialReverseSearchProps> = ({
  promptText,
  onSelectMaterial,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recommendations, setRecommendations] = useState<
    Array<{ materialId: string; rank: 'high' | 'medium' | 'low'; reason: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadAndRank() {
      setIsLoading(true);
      try {
        const list = await MaterialsAPI.list();
        setMaterials(list);
        if (promptText.trim() && list.length > 0) {
          const res = await MaterialsAPI.reverseSearch(promptText, list);
          setRecommendations(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAndRank();
  }, [promptText]);

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'high':
        return <Badge variant="success">很適合</Badge>;
      case 'medium':
        return <Badge variant="primary">可以考慮</Badge>;
      default:
        return <Badge variant="neutral">關聯較弱</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface p-4 rounded-xl border border-border-subtle">
        <h4 className="text-xs font-semibold text-text-muted mb-1 flex items-center">
          <Search className="w-3.5 h-3.5 mr-1" />
          當前檢索題目
        </h4>
        <p className="text-sm font-medium text-text-main leading-relaxed">{promptText}</p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-text-muted text-sm flex items-center justify-center space-x-2">
          <Sparkles className="w-4 h-4 text-primary animate-spin" />
          <span>正在檢索並比對你的生活素材庫...</span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-sm">
          尚未找到相關素材，建議先在「隨手記錄」中多累積生活片段。
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const mat = materials.find((m) => m.id === rec.materialId);
            if (!mat) return null;

            return (
              <div
                key={rec.materialId}
                className="bg-surface border border-border-subtle hover:border-primary/40 rounded-xl p-4 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-display font-bold text-text-main text-sm">
                        {mat.title}
                      </h4>
                      {getRankBadge(rec.rank)}
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed mb-2">
                      {rec.reason}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-text-soft bg-page-bg p-2.5 rounded-lg line-clamp-2 leading-relaxed mb-3">
                  {mat.story}
                </p>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => onSelectMaterial(mat)}
                    className="text-xs py-1 px-3"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    選用此素材開始寫作
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
