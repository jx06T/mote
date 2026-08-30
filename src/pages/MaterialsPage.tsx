import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialsAPI } from '../services/api';
import { Material } from '../types';
import { MaterialCard } from '../components/materials/MaterialCard';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Search, Plus, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const MaterialsPage: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const list = await MaterialsAPI.list();
      setMaterials(list);
    }
    load();
  }, []);

  const allTags = Array.from(
    new Set(materials.flatMap((m) => m.tags || []).filter(Boolean))
  );

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.includes(searchQuery) ||
      m.story.includes(searchQuery) ||
      m.themes.some((t) => t.includes(searchQuery));
    const matchesTag = selectedTag ? m.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-text-main">個人素材庫</h1>
          <p className="text-xs text-text-muted">
            你生活中的深刻經驗與思考，是寫作時最真實的底氣。
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/quick-notes')}
          className="rounded-xl text-xs py-1.5"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          採集新素材
        </Button>
      </div>

      {/* Search & Tag Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
          <Input
            placeholder="搜尋素材標題、故事或主題..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                selectedTag === null
                  ? 'bg-primary text-white font-medium'
                  : 'bg-surface border border-border-subtle text-text-muted hover:text-text-main'
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary text-white font-medium'
                    : 'bg-surface border border-border-subtle text-text-muted hover:text-text-main'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Material Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="py-16 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-text-muted/60" />
          <p>沒有找到相符的素材卡。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredMaterials.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              onClick={() => navigate(`/materials/${mat.id}`)}
              onUseForWriting={() => navigate(`/editor?materialId=${mat.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
