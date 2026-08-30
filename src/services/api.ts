import {
  QuickNote,
  Material,
  PromptItem,
  Essay,
  EssayAnalysis,
  WeaknessItem,
  HardCharacter,
  ExamSession,
  UnifiedWritingItem,
} from '../types';
import { storage, STORAGE_KEYS } from './storage';
import { STARTER_PROMPTS, INTERVIEW_FALLBACK_QUESTIONS } from '../config/prompts';

const API_BASE = '/api';

function getAuthToken(): string | null {
  return storage.local.getString(STORAGE_KEYS.TOKEN);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!storage.local.get(STORAGE_KEYS.USER);
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData: any = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return await res.json();
}

// 1. Quick Notes API (Dual Mode: LocalStorage for Guest, D1 for Authenticated)
export const QuickNotesAPI = {
  async list(): Promise<QuickNote[]> {
    if (!isAuthenticated()) {
      return storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []) || [];
    }

    try {
      return await fetchJSON<QuickNote[]>('/quick-notes');
    } catch (err) {
      console.warn('[QuickNotes API fallback to local]', err);
      return storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []) || [];
    }
  },

  async create(content: string): Promise<QuickNote> {
    if (!isAuthenticated()) {
      const now = Date.now();
      const newNote: QuickNote = {
        id: `temp_qn_${now}_${Math.random().toString(36).slice(2, 6)}`,
        user_id: 'guest',
        content,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      const existing = storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []) || [];
      storage.local.set(STORAGE_KEYS.QUICK_NOTES, [newNote, ...existing]);
      return newNote;
    }

    try {
      return await fetchJSON<QuickNote>('/quick-notes', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.warn('[QuickNotes Create fallback to local]', err);
      const now = Date.now();
      const newNote: QuickNote = {
        id: `temp_qn_${now}`,
        user_id: 'guest',
        content,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      const existing = await QuickNotesAPI.list();
      storage.local.set(STORAGE_KEYS.QUICK_NOTES, [newNote, ...existing]);
      return newNote;
    }
  },

  async delete(id: string): Promise<void> {
    if (!isAuthenticated()) {
      const existing = storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []) || [];
      storage.local.set(
        STORAGE_KEYS.QUICK_NOTES,
        existing.filter((n) => n.id !== id)
      );
      return;
    }

    try {
      await fetchJSON(`/quick-notes/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[QuickNotes Delete fallback to local]', err);
      const existing = storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []) || [];
      storage.local.set(
        STORAGE_KEYS.QUICK_NOTES,
        existing.filter((n) => n.id !== id)
      );
    }
  },

  async updateStatus(id: string, status: 'active' | 'converted' | 'archived'): Promise<void> {
    if (!isAuthenticated()) {
      const list = storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []) || [];
      const index = list.findIndex((n) => n.id === id);
      if (index >= 0) {
        list[index].status = status;
        list[index].updated_at = Date.now();
        storage.local.set(STORAGE_KEYS.QUICK_NOTES, list);
      }
      return;
    }

    try {
      await fetchJSON(`/quick-notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.warn('[QuickNotes updateStatus fallback]', err);
      const list = storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES, []) || [];
      const index = list.findIndex((n) => n.id === id);
      if (index >= 0) {
        list[index].status = status;
        list[index].updated_at = Date.now();
        storage.local.set(STORAGE_KEYS.QUICK_NOTES, list);
      }
    }
  },
};

// 2. Materials API (Dual Mode)
export const MaterialsAPI = {
  async list(): Promise<Material[]> {
    if (!isAuthenticated()) {
      return storage.local.get<Material[]>(STORAGE_KEYS.MATERIALS, []) || [];
    }

    try {
      return await fetchJSON<Material[]>('/materials');
    } catch (err) {
      console.warn('[Materials API fallback to local]', err);
      return storage.local.get<Material[]>(STORAGE_KEYS.MATERIALS, []) || [];
    }
  },

  async get(id: string): Promise<Material | null> {
    if (!isAuthenticated()) {
      const list = await MaterialsAPI.list();
      return list.find((m) => m.id === id) || null;
    }

    try {
      return await fetchJSON<Material>(`/materials/${id}`);
    } catch (err) {
      console.warn('[Materials Get fallback to local]', err);
      const list = await MaterialsAPI.list();
      return list.find((m) => m.id === id) || null;
    }
  },

  async save(data: Partial<Material>): Promise<Material> {
    if (!isAuthenticated()) {
      const now = Date.now();
      const newMat: Material = {
        id: data.id || `temp_mat_${now}_${Math.random().toString(36).slice(2, 6)}`,
        user_id: 'guest',
        title: data.title || '生活片段素材',
        story: data.story || '',
        people: data.people || ['我'],
        time: data.time || data.time_desc || '',
        time_desc: data.time || data.time_desc || '',
        location: data.location || data.location_desc || '',
        location_desc: data.location || data.location_desc || '',
        scene: data.scene || data.scene_desc || '',
        scene_desc: data.scene || data.scene_desc || '',
        dialogue: data.dialogue || data.dialogue_desc || '',
        dialogue_desc: data.dialogue || data.dialogue_desc || '',
        emotion: data.emotion || data.emotion_desc || '',
        emotion_desc: data.emotion || data.emotion_desc || '',
        reflection: data.reflection || data.reflection_desc || '',
        reflection_desc: data.reflection || data.reflection_desc || '',
        themes: data.themes || ['生活記錄'],
        tags: data.tags || ['隨手筆記'],
        interview_history: data.interview_history || [],
        source_quick_note_id: data.source_quick_note_id,
        created_at: data.created_at || now,
        updated_at: now,
      };

      const list = storage.local.get<Material[]>(STORAGE_KEYS.MATERIALS, []) || [];
      const index = list.findIndex((m) => m.id === newMat.id);
      if (index >= 0) {
        list[index] = newMat;
      } else {
        list.unshift(newMat);
      }
      storage.local.set(STORAGE_KEYS.MATERIALS, list);
      return newMat;
    }

    try {
      return await fetchJSON<Material>('/materials', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('[Materials Save fallback to local]', err);
      const now = Date.now();
      const newMat: Material = {
        id: data.id || `temp_mat_${now}`,
        user_id: 'guest',
        title: data.title || '生活片段素材',
        story: data.story || '',
        people: data.people || ['我'],
        time: data.time || data.time_desc || '',
        time_desc: data.time || data.time_desc || '',
        location: data.location || data.location_desc || '',
        location_desc: data.location || data.location_desc || '',
        scene: data.scene || data.scene_desc || '',
        scene_desc: data.scene || data.scene_desc || '',
        dialogue: data.dialogue || data.dialogue_desc || '',
        dialogue_desc: data.dialogue || data.dialogue_desc || '',
        emotion: data.emotion || data.emotion_desc || '',
        emotion_desc: data.emotion || data.emotion_desc || '',
        reflection: data.reflection || data.reflection_desc || '',
        reflection_desc: data.reflection || data.reflection_desc || '',
        themes: data.themes || ['生活記錄'],
        tags: data.tags || ['隨手筆記'],
        interview_history: data.interview_history || [],
        source_quick_note_id: data.source_quick_note_id,
        created_at: data.created_at || now,
        updated_at: now,
      };

      const list = await MaterialsAPI.list();
      const index = list.findIndex((m) => m.id === newMat.id);
      if (index >= 0) {
        list[index] = newMat;
      } else {
        list.unshift(newMat);
      }
      storage.local.set(STORAGE_KEYS.MATERIALS, list);
      return newMat;
    }
  },

  async interview(noteContent: string, history: Array<{ role: string; content: string }>, action = 'question') {
    try {
      return await fetchJSON<any>('/materials/interview', {
        method: 'POST',
        body: JSON.stringify({ noteContent, history, action }),
      });
    } catch (err) {
      console.warn('[Interview fallback]', err);
      if (action === 'summarize') {
        const userAnswers = history
          .filter((m) => m.role === 'user')
          .map((m) => m.content.trim())
          .filter(Boolean);
        const combinedStory = userAnswers.length > 0
          ? `${noteContent}。${userAnswers.join('；')}`
          : noteContent;
        const title = noteContent.length > 15 ? `${noteContent.slice(0, 15)}...` : (noteContent || '生活片段素材');

        return {
          summaryCard: {
            title,
            story: combinedStory,
            people: ['我'],
            time: '',
            location: '',
            scene: '',
            dialogue: '',
            emotion: '',
            reflection: '',
            themes: ['生活記錄'],
            tags: ['隨手筆記'],
          },
        };
      }
      const count = history.filter((h) => h.role === 'user').length;
      const fallbackIdx = Math.min(count, INTERVIEW_FALLBACK_QUESTIONS.length - 1);
      return {
        nextQuestion: INTERVIEW_FALLBACK_QUESTIONS[fallbackIdx] || INTERVIEW_FALLBACK_QUESTIONS[0],
      };
    }
  },

  async askInterview(noteContent: string, history: Array<{ role: string; content: string }>): Promise<string> {
    const res = await MaterialsAPI.interview(noteContent, history, 'question');
    return res.nextQuestion || '還有什麼特別的細節是你印象深刻的？';
  },

  async summarizeInterview(noteContent: string, history: Array<{ role: string; content: string }>) {
    const res = await MaterialsAPI.interview(noteContent, history, 'summarize');
    return res.summaryCard;
  },

  async reverseSearch(promptText: string, materialsList?: Material[]): Promise<Array<{ materialId: string; rank: 'high' | 'medium' | 'low'; reason: string }>> {
    const mats = materialsList || (await MaterialsAPI.list());
    try {
      const res = await fetchJSON<{ matches: Array<{ materialId: string; rank: 'high' | 'medium' | 'low'; reason: string }> }>('/materials/reverse-search', {
        method: 'POST',
        body: JSON.stringify({ promptText, materials: mats }),
      });
      return res.matches || [];
    } catch (err) {
      console.warn('[Reverse Search fallback]', err);
      const keywords = promptText.split(/[\s，。！？、；：「」『』\n\r]+/).filter((k) => k.length > 1);
      return mats.map((m, idx) => {
        const matchCount = keywords.filter((k) => m.title.includes(k) || m.story.includes(k)).length;
        return {
          materialId: m.id,
          rank: matchCount > 0 || idx === 0 ? 'high' : 'medium',
          reason: `素材「${m.title}」與題目的情境相互呼應，適合作為寫作展開的切入點。`,
        };
      });
    }
  },
};

// 3. Prompts API
export const PromptsAPI = {
  async list(): Promise<PromptItem[]> {
    if (!isAuthenticated()) {
      const custom = storage.local.get<PromptItem[]>(STORAGE_KEYS.PROMPTS, []) || [];
      return [...custom, ...STARTER_PROMPTS];
    }

    try {
      const res = await fetchJSON<PromptItem[]>('/prompts');
      return res && res.length > 0 ? res : STARTER_PROMPTS;
    } catch {
      const custom = storage.local.get<PromptItem[]>(STORAGE_KEYS.PROMPTS, []) || [];
      return [...custom, ...STARTER_PROMPTS];
    }
  },

  async create(data: { title: string; raw_text: string; corrected_text?: string }): Promise<PromptItem> {
    if (!isAuthenticated()) {
      const now = Date.now();
      const newPrompt: PromptItem = {
        id: `temp_pr_${now}_${Math.random().toString(36).slice(2, 6)}`,
        title: data.title,
        raw_text: data.raw_text,
        corrected_text: data.corrected_text || data.raw_text,
        prompt_type: '自訂題目',
        is_official: 0,
        created_at: now,
        updated_at: now,
      };
      const existing = storage.local.get<PromptItem[]>(STORAGE_KEYS.PROMPTS, []) || [];
      storage.local.set(STORAGE_KEYS.PROMPTS, [newPrompt, ...existing]);
      return newPrompt;
    }

    try {
      return await fetchJSON<PromptItem>('/prompts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const now = Date.now();
      const newPrompt: PromptItem = {
        id: `temp_pr_${now}`,
        title: data.title,
        raw_text: data.raw_text,
        corrected_text: data.corrected_text || data.raw_text,
        prompt_type: '自訂題目',
        is_official: 0,
        created_at: now,
        updated_at: now,
      };
      const existing = storage.local.get<PromptItem[]>(STORAGE_KEYS.PROMPTS, []) || [];
      storage.local.set(STORAGE_KEYS.PROMPTS, [newPrompt, ...existing]);
      return newPrompt;
    }
  },
};

// 4. Essays API (Dual Mode)
export const EssaysAPI = {
  async list(): Promise<Essay[]> {
    if (!isAuthenticated()) {
      const items = storage.local.get<Essay[]>(STORAGE_KEYS.ESSAYS, []) || [];
      return items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    }

    try {
      const res = await fetchJSON<Essay[]>('/essays');
      return (res || []).sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    } catch {
      const items = storage.local.get<Essay[]>(STORAGE_KEYS.ESSAYS, []) || [];
      return items.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    }
  },

  async listUnified(): Promise<UnifiedWritingItem[]> {
    const [essays, exams, prompts] = await Promise.all([
      EssaysAPI.list(),
      ExamsAPI.list(),
      PromptsAPI.list(),
    ]);

    const promptMap: Record<string, string> = {};
    prompts.forEach((p) => {
      promptMap[p.id] = p.title;
    });

    const unifiedEssays: UnifiedWritingItem[] = essays.map((e) => ({
      id: e.id,
      sourceType: 'editor',
      title: e.title?.trim() || '無標題作文',
      content: e.current_content || '',
      promptId: e.prompt_id,
      promptTitle: e.prompt_id ? promptMap[e.prompt_id] : undefined,
      wordCount: e.word_count || 0,
      status: e.status || 'draft',
      createdAt: e.created_at || Date.now(),
      updatedAt: e.updated_at || e.created_at || Date.now(),
    }));

    const unifiedExams: UnifiedWritingItem[] = exams.map((ex) => {
      const promptTitle = ex.prompt_title || (ex.prompt_id ? promptMap[ex.prompt_id] : '紙本模擬考作答');
      return {
        id: ex.id,
        sourceType: 'mock_exam',
        title: promptTitle,
        content: `模擬考作答紀錄（${ex.duration_minutes || 50} 分鐘手寫全真測驗）`,
        promptId: ex.prompt_id,
        promptTitle,
        wordCount: 600,
        status: ex.status === 'submitted' ? 'analyzed' : (ex.status as any) || 'submitted',
        durationMinutes: ex.duration_minutes || 50,
        createdAt: ex.started_at || Date.now(),
        updatedAt: ex.ended_at || ex.started_at || Date.now(),
      };
    });

    return [...unifiedEssays, ...unifiedExams].sort(
      (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
    );
  },

  async get(id: string): Promise<{ essay: Essay; operations: any[] } | null> {
    if (!isAuthenticated()) {
      const list = await EssaysAPI.list();
      const item = list.find((e) => e.id === id);
      const operations = storage.local.get<any[]>(`${STORAGE_KEYS.ESSAY_OPS_PREFIX}${id}`, []) || [];
      return item ? { essay: item, operations } : null;
    }

    try {
      return await fetchJSON<{ essay: Essay; operations: any[] }>(`/essays/${id}`);
    } catch {
      const list = await EssaysAPI.list();
      const item = list.find((e) => e.id === id);
      const operations = storage.local.get<any[]>(`${STORAGE_KEYS.ESSAY_OPS_PREFIX}${id}`, []) || [];
      return item ? { essay: item, operations } : null;
    }
  },

  async delete(id: string): Promise<boolean> {
    const list = storage.local.get<Essay[]>(STORAGE_KEYS.ESSAYS, []) || [];
    const filtered = list.filter((e) => e.id !== id);
    storage.local.set(STORAGE_KEYS.ESSAYS, filtered);
    storage.local.remove(`${STORAGE_KEYS.ESSAY_OPS_PREFIX}${id}`);

    if (!isAuthenticated()) {
      return true;
    }

    try {
      await fetchJSON(`/essays/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      console.warn('[Delete Essay fallback to local only]', err);
      return true;
    }
  },

  async save(data: {
    id?: string;
    title?: string;
    content?: string;
    current_content?: string;
    prompt_id?: string;
    promptId?: string;
    word_count?: number;
    status?: string;
    operations?: any[];
  }): Promise<Essay> {
    const essayContent = data.current_content || data.content || '';

    if (!isAuthenticated()) {
      const now = Date.now();
      const essayId = data.id || `temp_es_${now}_${Math.random().toString(36).slice(2, 6)}`;
      const newEssay: Essay = {
        id: essayId,
        user_id: 'guest',
        prompt_id: data.prompt_id || data.promptId,
        title: data.title || '無標題作文',
        current_content: essayContent,
        word_count: data.word_count || essayContent.replace(/\s+/g, '').length,
        status: (data.status as any) || 'draft',
        created_at: now,
        updated_at: now,
      };

      const list = storage.local.get<Essay[]>(STORAGE_KEYS.ESSAYS, []) || [];
      const idx = list.findIndex((e) => e.id === newEssay.id);
      if (idx >= 0) {
        list[idx] = newEssay;
      } else {
        list.unshift(newEssay);
      }
      storage.local.set(STORAGE_KEYS.ESSAYS, list);
      if (data.operations) {
        storage.local.set(`${STORAGE_KEYS.ESSAY_OPS_PREFIX}${newEssay.id}`, data.operations);
      }
      return newEssay;
    }

    const payload = {
      id: data.id,
      title: data.title,
      content: essayContent,
      promptId: data.prompt_id || data.promptId,
      status: data.status,
      operations: (data.operations || []).map((op) => ({
        type: op.operation_type || op.type || 'INSERT',
        position: op.position || 0,
        length: op.length || 0,
        oldContent: op.old_content || op.oldContent,
        newContent: op.new_content || op.newContent,
        source: op.source || 'user',
      })),
    };

    try {
      return await fetchJSON<Essay>('/essays', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const now = Date.now();
      const newEssay: Essay = {
        id: data.id || `temp_es_${now}`,
        user_id: 'guest',
        prompt_id: data.prompt_id || data.promptId,
        title: data.title || '無標題作文',
        current_content: essayContent,
        word_count: data.word_count || essayContent.replace(/\s+/g, '').length,
        status: (data.status as any) || 'draft',
        created_at: now,
        updated_at: now,
      };

      const list = await EssaysAPI.list();
      const idx = list.findIndex((e) => e.id === newEssay.id);
      if (idx >= 0) {
        list[idx] = newEssay;
      } else {
        list.unshift(newEssay);
      }
      storage.local.set(STORAGE_KEYS.ESSAYS, list);
      if (data.operations) {
        storage.local.set(`${STORAGE_KEYS.ESSAY_OPS_PREFIX}${newEssay.id}`, data.operations);
      }
      return newEssay;
    }
  },

  async assist(
    selectedText: string,
    action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene',
    fullContext?: string
  ) {
    return await fetchJSON<{ original: string; suggestion: string; explanation: string }>(
      '/essays/assist',
      {
        method: 'POST',
        body: JSON.stringify({ selectedText, action, fullContext }),
      }
    );
  },
};

// 5. Mock Exams API (Protected)
export const ExamsAPI = {
  async list(): Promise<ExamSession[]> {
    if (!isAuthenticated()) {
      return storage.local.get<ExamSession[]>(STORAGE_KEYS.EXAMS, []) || [];
    }
    try {
      return await fetchJSON<ExamSession[]>('/exams');
    } catch {
      return storage.local.get<ExamSession[]>(STORAGE_KEYS.EXAMS, []) || [];
    }
  },

  async start(promptId: string, durationMinutes = 50): Promise<ExamSession> {
    return await fetchJSON<ExamSession>('/exams/start', {
      method: 'POST',
      body: JSON.stringify({ promptId, durationMinutes }),
    });
  },

  async submit(
    examId: string,
    pages: Array<{ pageNumber: number; image: string; text?: string }>,
    finalText: string
  ): Promise<{ success: boolean; submissionId: string; analysis: EssayAnalysis }> {
    return await fetchJSON<{ success: boolean; submissionId: string; analysis: EssayAnalysis }>(
      `/exams/${examId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ pages, finalText }),
      }
    );
  },
};

// 6. Analysis API (Protected)
export const AnalysisAPI = {
  async evaluate(title: string, content: string, promptText?: string) {
    return await fetchJSON<{ id: string; analysis: EssayAnalysis }>('/analysis/evaluate', {
      method: 'POST',
      body: JSON.stringify({ title, content, promptText }),
    });
  },

  async getWeaknesses(): Promise<WeaknessItem[]> {
    if (!isAuthenticated()) {
      return storage.local.get<WeaknessItem[]>(STORAGE_KEYS.WEAKNESSES, []) || [];
    }

    try {
      return await fetchJSON<WeaknessItem[]>('/analysis/weaknesses');
    } catch {
      return storage.local.get<WeaknessItem[]>(STORAGE_KEYS.WEAKNESSES, []) || [];
    }
  },

  async getLatest(): Promise<EssayAnalysis | null> {
    if (!isAuthenticated()) {
      return null;
    }

    try {
      return await fetchJSON<EssayAnalysis | null>('/analysis/latest');
    } catch {
      return null;
    }
  },
};

// 7. Vocabulary API (Dual Mode)
export const VocabularyAPI = {
  async list(): Promise<HardCharacter[]> {
    if (!isAuthenticated()) {
      return storage.local.get<HardCharacter[]>(STORAGE_KEYS.VOCABULARY, []) || [];
    }

    try {
      return await fetchJSON<HardCharacter[]>('/vocabulary');
    } catch {
      return storage.local.get<HardCharacter[]>(STORAGE_KEYS.VOCABULARY, []) || [];
    }
  },

  async add(characterText: string, zhuyin?: string, sourceEssayId?: string): Promise<HardCharacter> {
    if (!isAuthenticated()) {
      const now = Date.now();
      const newChar: HardCharacter = {
        id: `temp_voc_${now}_${Math.random().toString(36).slice(2, 6)}`,
        user_id: 'guest',
        character_text: characterText,
        zhuyin: zhuyin || '',
        source_essay_id: sourceEssayId,
        mastery_level: 1,
        created_at: now,
      };
      const existing = storage.local.get<HardCharacter[]>(STORAGE_KEYS.VOCABULARY, []) || [];
      storage.local.set(STORAGE_KEYS.VOCABULARY, [newChar, ...existing]);
      return newChar;
    }

    try {
      return await fetchJSON<HardCharacter>('/vocabulary', {
        method: 'POST',
        body: JSON.stringify({ characterText, zhuyin, sourceEssayId }),
      });
    } catch {
      const now = Date.now();
      const newChar: HardCharacter = {
        id: `temp_voc_${now}`,
        user_id: 'guest',
        character_text: characterText,
        zhuyin: zhuyin || '',
        source_essay_id: sourceEssayId,
        mastery_level: 1,
        created_at: now,
      };
      const existing = await VocabularyAPI.list();
      storage.local.set(STORAGE_KEYS.VOCABULARY, [newChar, ...existing]);
      return newChar;
    }
  },
};
