import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MaterialsAPI } from '../services/api';
import { Material } from '../types';
import { MaterialInterviewView } from '../components/materials/MaterialInterviewView';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  MapPin,
  Users,
  Tag,
  Save,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

export const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Material>>({});
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

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

  const handleInterviewComplete = async (updatedCard: any) => {
    const merged = {
      ...material,
      ...updatedCard,
      id: material.id,
      interview_history: updatedCard.interview_history || material.interview_history,
    };
    const saved = await MaterialsAPI.save(merged);
    setMaterial(saved);
    setFormData(saved);
    setIsInterviewOpen(false);
  };

  const interviewHistory = material.interview_history || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            variant="outline"
            size="sm"
            onClick={() => setIsInterviewOpen(true)}
            className="text-xs py-1 px-3 border-primary/30 text-primary hover:bg-primary/5"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            {interviewHistory.length > 0 ? '繼續深入訪談' : '開啟深入訪談'}
          </Button>

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

      {/* Collapsible Interview History Section */}
      <Card className="bg-surface border-border-subtle overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-elevated/50 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-text-main">
                訪談歷程與靈感軌跡
              </h2>
              <p className="text-[11px] text-text-muted">
                {interviewHistory.length > 0
                  ? `共累積 ${interviewHistory.length} 則問答紀錄`
                  : '尚未有訪談紀錄，可隨時發起深度探討'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {interviewHistory.length > 0 && (
              <Badge variant="neutral" className="text-[10px]">
                {interviewHistory.length} 則
              </Badge>
            )}
            {isHistoryExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </div>
        </button>

        {isHistoryExpanded && (
          <div className="p-4 pt-0 border-t border-border-subtle/60 space-y-3">
            {interviewHistory.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-text-muted">
                  這段生活經驗還有許多感官細節或內心情緒值得挖掘。
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsInterviewOpen(true)}
                  className="text-xs py-1 px-3 border-primary/30 text-primary"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  開啟 AI 深入訪談
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2.5 pt-3 max-h-96 overflow-y-auto no-scrollbar">
                  {interviewHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-xs'
                            : 'bg-page-bg border border-border-subtle text-text-main rounded-bl-xs'
                        }`}
                      >
                        <div className="text-[10px] opacity-70 mb-0.5 font-medium">
                          {msg.role === 'user' ? '我的回答' : 'AI 老師引導'}
                        </div>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border-subtle/50 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setIsInterviewOpen(true)}
                    className="text-xs py-1 px-3"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    接續此紀錄繼續深入
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Resume Interview Modal */}
      {isInterviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl">
            <MaterialInterviewView
              noteContent={material.story || material.title}
              title={`深入訪談：${material.title}`}
              sourceQuickNoteId={material.source_quick_note_id}
              initialMessages={material.interview_history}
              onComplete={handleInterviewComplete}
              onCancel={() => setIsInterviewOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
