import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickNotesAPI, MaterialsAPI, EssaysAPI, AnalysisAPI } from '../services/api';
import { QuickNote, Material, Essay, WeaknessItem } from '../types';
import { QuickNoteInput } from '../components/quick-note/QuickNoteInput';
import { MaterialCard } from '../components/materials/MaterialCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { MaterialInterviewView } from '../components/materials/MaterialInterviewView';
import {
  FileText,
  BookOpen,
  PenTool,
  Award,
  Sparkles,
  ArrowRight,
  Plus,
  Compass,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([]);

  // Deepening Interview Modal
  const [activeInterviewNote, setActiveInterviewNote] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [notes, mats, esys, wks] = await Promise.all([
        QuickNotesAPI.list(),
        MaterialsAPI.list(),
        EssaysAPI.list(),
        AnalysisAPI.getWeaknesses(),
      ]);
      setQuickNotes(notes);
      setMaterials(mats);
      setEssays(esys);
      setWeaknesses(wks);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveQuickNote = async (content: string) => {
    await QuickNotesAPI.create(content);
    await loadData();
  };

  const handleInterviewComplete = async (materialCard: any) => {
    await MaterialsAPI.save(materialCard);
    setActiveInterviewNote(null);
    await loadData();
    navigate('/materials');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-7">
      {/* Welcome & Philosophy Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-text-muted tracking-wider uppercase">
          Mote 作文訓練系統
        </span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
          今天想記錄或練習什麼？
        </h1>
        <p className="text-xs text-text-soft">
          累積生活中的微小觀察，練習將片刻轉化為真誠深刻的文章。
        </p>
      </div>

      {/* Quick Fast-Capture Box */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-text-soft flex items-center">
          <Plus className="w-3.5 h-3.5 mr-1" />
          隨手記下一件事
        </h2>
        <QuickNoteInput onSave={handleSaveQuickNote} />
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/quick-notes')}
          className="flex flex-col items-center justify-center p-3.5 bg-surface border border-border-subtle hover:border-primary/40 rounded-xl transition-all shadow-xs group text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-primary/10 flex items-center justify-center text-text-soft group-hover:text-primary mb-2 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-text-main">隨手筆記</span>
          <span className="text-[10px] text-text-muted mt-0.5">{quickNotes.length} 則待深化</span>
        </button>

        <button
          onClick={() => navigate('/materials')}
          className="flex flex-col items-center justify-center p-3.5 bg-surface border border-border-subtle hover:border-primary/40 rounded-xl transition-all shadow-xs group text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-primary/10 flex items-center justify-center text-text-soft group-hover:text-primary mb-2 transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-text-main">個人素材庫</span>
          <span className="text-[10px] text-text-muted mt-0.5">{materials.length} 張素材卡</span>
        </button>

        <button
          onClick={() => navigate('/editor')}
          className="flex flex-col items-center justify-center p-3.5 bg-surface border border-border-subtle hover:border-primary/40 rounded-xl transition-all shadow-xs group text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-primary/10 flex items-center justify-center text-text-soft group-hover:text-primary mb-2 transition-colors">
            <PenTool className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-text-main">電子寫作</span>
          <span className="text-[10px] text-text-muted mt-0.5">AI 修辭引導</span>
        </button>

        <button
          onClick={() => navigate('/exams')}
          className="flex flex-col items-center justify-center p-3.5 bg-surface border border-border-subtle hover:border-primary/40 rounded-xl transition-all shadow-xs group text-center"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-primary/10 flex items-center justify-center text-text-soft group-hover:text-primary mb-2 transition-colors">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-text-main">紙本模擬考</span>
          <span className="text-[10px] text-text-muted mt-0.5">全真計時與拍照</span>
        </button>
      </div>

      {/* Recent Notes Waiting for Deepening */}
      {quickNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-soft flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
              最近隨手記錄（可深入挖掘）
            </h3>
            <button
              onClick={() => navigate('/quick-notes')}
              className="text-xs text-primary hover:text-primary-hover font-medium flex items-center"
            >
              查看全部
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2">
            {quickNotes.slice(0, 2).map((note) => (
              <div
                key={note.id}
                className="bg-surface border border-border-subtle rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs"
              >
                <p className="text-xs text-text-main leading-relaxed line-clamp-2">
                  {note.content}
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveInterviewNote(note.content)}
                  className="shrink-0 text-xs py-1 px-2.5 rounded-lg"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  深入這件事
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Materials */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-text-soft flex items-center">
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            最近整理的素材卡
          </h3>
          <button
            onClick={() => navigate('/materials')}
            className="text-xs text-primary hover:text-primary-hover font-medium flex items-center"
          >
            素材庫
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {materials.slice(0, 2).map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              onClick={() => navigate(`/materials/${mat.id}`)}
              onUseForWriting={() => navigate(`/editor?materialId=${mat.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Weakness Summary Card */}
      {weaknesses.length > 0 && (
        <Card className="bg-surface border-border-subtle p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-main flex items-center">
              <Compass className="w-4 h-4 mr-1.5 text-primary" />
              個人寫作特徵與定向練習建議
            </h3>
            <button
              onClick={() => navigate('/analysis')}
              className="text-xs text-primary hover:text-primary-hover font-medium"
            >
              詳細弱點趨勢
            </button>
          </div>
          <div className="space-y-2">
            {weaknesses.slice(0, 2).map((wk) => (
              <div
                key={wk.id}
                className="flex items-start justify-between text-xs p-2 bg-page-bg rounded-lg"
              >
                <div>
                  <Badge variant="warning" className="mr-2">
                    {wk.dimension}
                  </Badge>
                  <span className="text-text-soft">{wk.description}</span>
                </div>
                <span className="text-[10px] text-text-muted shrink-0 ml-2">
                  已出現 {wk.occurrence_count} 次
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal for Deepening Interview */}
      {activeInterviewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
          <div className="w-full max-w-lg">
            <MaterialInterviewView
              noteContent={activeInterviewNote}
              onComplete={handleInterviewComplete}
              onCancel={() => setActiveInterviewNote(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
