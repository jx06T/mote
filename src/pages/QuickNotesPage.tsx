import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickNotesAPI, MaterialsAPI } from '../services/api';
import { QuickNote } from '../types';
import { QuickNoteInput } from '../components/quick-note/QuickNoteInput';
import { MaterialInterviewView } from '../components/materials/MaterialInterviewView';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Trash2, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export const QuickNotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [activeInterviewNote, setActiveInterviewNote] = useState<QuickNote | null>(null);

  const loadNotes = async () => {
    const list = await QuickNotesAPI.list();
    setNotes(list);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleSaveNote = async (content: string) => {
    await QuickNotesAPI.create(content);
    await loadNotes();
  };

  const handleDelete = async (id: string) => {
    await QuickNotesAPI.delete(id);
    await loadNotes();
  };

  const handleInterviewComplete = async (materialCard: any) => {
    if (activeInterviewNote) {
      await QuickNotesAPI.updateStatus(activeInterviewNote.id, 'converted');
    }
    await MaterialsAPI.save(materialCard);
    setActiveInterviewNote(null);
    navigate('/materials');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="font-display font-bold text-2xl text-text-main">隨手筆記</h1>
        <p className="text-xs text-text-muted">
          不要求標題與完整度，幾秒內留下一句話。點擊「深入這件事」由 AI 帶領你發掘素材。
        </p>
      </div>

      {/* Input */}
      <QuickNoteInput onSave={handleSaveNote} />

      {/* Notes List */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-text-soft">
          所有隨手記錄 ({notes.length})
        </h2>

        {notes.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted bg-surface rounded-2xl border border-border-subtle">
            尚未有任何隨手記錄。試著在上方輸入今天遇見的一件事吧！
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="bg-surface border-border-subtle p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-text-main leading-relaxed font-display flex-1">
                    {note.content}
                  </p>
                  {note.status === 'converted' && (
                    <Badge variant="success" className="shrink-0 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      已轉素材
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 text-xs text-text-muted">
                  <span className="flex items-center text-[11px]">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(note.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-text-muted hover:text-status-danger p-1"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Button
                      size="sm"
                      onClick={() => setActiveInterviewNote(note)}
                      className="text-xs py-1 px-2.5 rounded-lg"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      深入這件事
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Interview Modal */}
      {activeInterviewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg">
            <MaterialInterviewView
              noteContent={activeInterviewNote.content}
              sourceQuickNoteId={activeInterviewNote.id}
              onComplete={handleInterviewComplete}
              onCancel={() => setActiveInterviewNote(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
