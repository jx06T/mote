import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EssayEditor } from '../components/editor/EssayEditor';
import { MaterialsAPI, AnalysisAPI, EssaysAPI } from '../services/api';
import { Material, EssayAnalysis } from '../types';
import { EssayAnalysisView } from '../components/analysis/EssayAnalysisView';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { BookOpen, Sparkles, X, ChevronRight } from 'lucide-react';

import { useToast } from '../context/ToastContext';

export const EssayEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const promptTitle = searchParams.get('promptTitle') || '';
  const promptText = searchParams.get('promptText') || '';
  const materialId = searchParams.get('materialId');

  const [refMaterial, setRefMaterial] = useState<Material | null>(null);
  const [showMaterialDrawer, setShowMaterialDrawer] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EssayAnalysis | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    async function loadRef() {
      if (materialId) {
        const mat = await MaterialsAPI.get(materialId);
        if (mat) {
          setRefMaterial(mat);
          setShowMaterialDrawer(true);
        }
      }
    }
    loadRef();
  }, [materialId]);

  const handleSubmitForAnalysis = async (title: string, content: string) => {
    if (!content.trim()) {
      toast.warning('請先輸入作文內容後再送交評析。');
      return;
    }
    setIsEvaluating(true);
    try {
      // Save essay first
      await EssaysAPI.save({
        title: title || promptTitle || '無標題作文',
        content,
        status: 'submitted',
      });

      // Trigger analysis
      const res = await AnalysisAPI.evaluate(title || promptTitle || '作文評析', content, promptText);
      setAnalysisResult(res.analysis);
      toast.success('作文評析報告已完成！');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '送交評析時發生錯誤，請重試。');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Material Reference Badge Button if available */}
      {refMaterial && (
        <div className="absolute right-4 top-16 z-30">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMaterialDrawer(true)}
            className="text-xs shadow-sm bg-surface/95 backdrop-blur-md rounded-xl"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 text-primary" />
            查看參考素材
          </Button>
        </div>
      )}

      {/* Main Editor Component */}
      <div className="flex-1 overflow-hidden">
        <EssayEditor
          initialTitle={promptTitle || '無標題作文'}
          promptTitle={promptTitle}
          promptText={promptText}
          onSubmitForAnalysis={handleSubmitForAnalysis}
        />
      </div>

      {/* Material Drawer Modal */}
      {refMaterial && (
        <Modal
          isOpen={showMaterialDrawer}
          onClose={() => setShowMaterialDrawer(false)}
          title={`參考素材：${refMaterial.title}`}
          maxWidth="md"
        >
          <div className="space-y-3 text-xs text-text-soft">
            <p className="p-3 bg-page-bg rounded-xl font-display leading-relaxed">
              {refMaterial.story}
            </p>
            {refMaterial.reflection && (
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-primary">
                <span className="font-semibold block mb-0.5">事後體悟：</span>
                {refMaterial.reflection}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Analysis Result Modal */}
      <Modal
        isOpen={analysisResult !== null}
        onClose={() => setAnalysisResult(null)}
        title="作文多面向評析報告"
        maxWidth="xl"
      >
        {analysisResult && (
          <div className="space-y-4">
            <EssayAnalysisView analysis={analysisResult} />
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={() => {
                  setAnalysisResult(null);
                  navigate('/analysis');
                }}
              >
                查看弱點追蹤
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
