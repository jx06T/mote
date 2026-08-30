import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MaterialsAPI } from '../services/api';
import { Material } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft, Sparkles, Clock, MapPin, Users, Tag, Save } from 'lucide-react';

export const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Material>>({});

  useEffect(() => {
    async function load() {
      if (!id) return;
      const mat = await MaterialsAPI.get(id);
      if (mat) {
        setMaterial(mat);
        setFormData(mat);
      }
    }
    load();
  }, [id]);

  if (!material) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">載入素材中...</div>
    );
  }

  const handleSave = async () => {
    const updated = await MaterialsAPI.save({
      ...material,
      ...formData,
    });
    setMaterial(updated);
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/materials')}
          className="flex items-center text-xs text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回素材庫
        </button>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <Button size="sm" onClick={handleSave} className="text-xs py-1 px-3">
              <Save className="w-3.5 h-3.5 mr-1" />
              儲存變更
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs py-1 px-3"
            >
              編輯素材
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => navigate(`/editor?materialId=${material.id}`)}
            className="text-xs py-1 px-3"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            用此素材寫作
          </Button>
        </div>
      </div>

      {/* Main Material Detail Card */}
      <Card className="bg-surface border-border-subtle p-6 space-y-5 shadow-xs">
        {!isEditing ? (
          <>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="font-display font-bold text-2xl text-text-main">
                  {material.title}
                </h1>
                {material.themes?.map((th, i) => (
                  <Badge key={i} variant="primary">
                    {th}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                {(material.time || material.time_desc) && (
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {material.time || material.time_desc}
                  </span>
                )}
                {(material.location || material.location_desc) && (
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {material.location || material.location_desc}
                  </span>
                )}
                {material.people && material.people.length > 0 && (
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    {material.people.join('、')}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-border-subtle">
              <span className="text-xs font-semibold text-text-muted block">故事片段</span>
              <p className="text-sm font-display text-text-soft leading-relaxed bg-page-bg p-4 rounded-xl">
                {material.story}
              </p>
            </div>

            {(material.reflection || material.reflection_desc) && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-text-muted block">事後感悟與深思</span>
                <p className="text-xs text-text-main leading-relaxed">
                  {material.reflection || material.reflection_desc}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Editable Form */
          <div className="space-y-4">
            <Input
              label="素材標題"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Textarea
              label="故事片段"
              rows={5}
              value={formData.story || ''}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="時間"
                value={formData.time || formData.time_desc || ''}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
              <Input
                label="地點"
                value={formData.location || formData.location_desc || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <Textarea
              label="事後感悟"
              rows={2}
              value={formData.reflection || formData.reflection_desc || ''}
              onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
