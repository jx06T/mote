import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PromptsAPI } from '../services/api';
import { PromptItem } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { MaterialReverseSearch } from '../components/materials/MaterialReverseSearch';
import { Plus, Camera, Sparkles, PenTool, Award, Search, FileText } from 'lucide-react';

export const PromptPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');

  // Reverse search modal
  const [activeSearchPrompt, setActiveSearchPrompt] = useState<PromptItem | null>(null);

  const loadPrompts = async () => {
    const list = await PromptsAPI.list();
    setPrompts(list);
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleCreatePrompt = async () => {
    if (!newText.trim()) return;
    await PromptsAPI.create({
      title: newTitle || '自訂題目',
      raw_text: newText,
      corrected_text: newText,
    });
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewText('');
    await loadPrompts();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-text-main">題目庫</h1>
          <p className="text-xs text-text-muted">
            拍照或輸入題目，由 AI 幫你檢索生活素材庫中「最適合寫入本題」的故事。
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          新增題目
        </Button>
      </div>

      {/* Prompts List */}
      <div className="space-y-4">
        {prompts.map((prompt) => (
          <Card
            key={prompt.id}
            className="bg-surface border-border-subtle p-5 space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-bold text-base text-text-main">
                {prompt.title}
              </h3>
              <Badge variant="primary" className="text-[10px]">
                {prompt.prompt_type || '記敘抒情'}
              </Badge>
            </div>

            <p className="text-xs text-text-soft leading-relaxed font-display bg-page-bg p-3 rounded-xl border border-border-subtle/50">
              {prompt.corrected_text || prompt.raw_text}
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border-subtle/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSearchPrompt(prompt)}
                className="text-xs py-1 px-3"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                找我的素材
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  navigate(
                    `/editor?promptTitle=${encodeURIComponent(
                      prompt.title
                    )}&promptText=${encodeURIComponent(prompt.corrected_text || prompt.raw_text)}`
                  )
                }
                className="text-xs py-1 px-3"
              >
                <PenTool className="w-3.5 h-3.5 mr-1" />
                電子寫作
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/exams/session?promptTitle=${encodeURIComponent(
                      prompt.title
                    )}&promptText=${encodeURIComponent(prompt.corrected_text || prompt.raw_text)}`
                  )
                }
                className="text-xs py-1 px-3"
              >
                <Award className="w-3.5 h-3.5 mr-1" />
                紙本模擬考
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Custom Prompt Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="建立新作文題目"
      >
        <div className="space-y-4">
          <Input
            label="題目名稱"
            placeholder="例如：當我轉身看見那道光"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Textarea
            label="題目引導與說明"
            placeholder="請貼上或輸入作文題目的完整引言與寫作引導..."
            rows={5}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <div className="flex justify-end space-x-2 pt-2 border-t border-border-subtle">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleCreatePrompt} disabled={!newText.trim()}>
              建立題目
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reverse Search Modal */}
      <Modal
        isOpen={activeSearchPrompt !== null}
        onClose={() => setActiveSearchPrompt(null)}
        title="尋找適合此題目的個人素材"
        maxWidth="lg"
      >
        {activeSearchPrompt && (
          <MaterialReverseSearch
            promptText={activeSearchPrompt.corrected_text || activeSearchPrompt.raw_text}
            onSelectMaterial={(mat) => {
              navigate(
                `/editor?promptTitle=${encodeURIComponent(
                  activeSearchPrompt.title
                )}&promptText=${encodeURIComponent(
                  activeSearchPrompt.corrected_text || activeSearchPrompt.raw_text
                )}&materialId=${mat.id}`
              );
            }}
          />
        )}
      </Modal>
    </div>
  );
};
