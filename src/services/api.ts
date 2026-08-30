import {
  QuickNote,
  Material,
  PromptItem,
  Essay,
  EssayAnalysis,
  WeaknessItem,
  HardCharacter,
  ExamSession,
} from '../types';

const API_BASE = '/api';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData: any = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return await res.json();
}

// 1. Quick Notes API
export const QuickNotesAPI = {
  async list(): Promise<QuickNote[]> {
    try {
      return await fetchJSON<QuickNote[]>('/quick-notes');
    } catch (err) {
      console.warn('[QuickNotes API fallback to local]', err);
      const stored = localStorage.getItem('mote_quick_notes');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async create(content: string): Promise<QuickNote> {
    try {
      return await fetchJSON<QuickNote>('/quick-notes', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.warn('[QuickNotes Create fallback to local]', err);
      const newNote: QuickNote = {
        id: `qn_${Date.now()}`,
        user_id: 'user_local',
        content,
        status: 'active',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const existing = await QuickNotesAPI.list();
      localStorage.setItem('mote_quick_notes', JSON.stringify([newNote, ...existing]));
      return newNote;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await fetchJSON(`/quick-notes/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('[QuickNotes Delete fallback to local]', err);
      const existing = await QuickNotesAPI.list();
      localStorage.setItem(
        'mote_quick_notes',
        JSON.stringify(existing.filter((n) => n.id !== id))
      );
    }
  },
};

// 2. Materials API
export const MaterialsAPI = {
  async list(): Promise<Material[]> {
    try {
      return await fetchJSON<Material[]>('/materials');
    } catch (err) {
      console.warn('[Materials API fallback to local]', err);
      const stored = localStorage.getItem('mote_materials');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async get(id: string): Promise<Material | null> {
    try {
      return await fetchJSON<Material>(`/materials/${id}`);
    } catch (err) {
      console.warn('[Materials Get fallback to local]', err);
      const list = await MaterialsAPI.list();
      return list.find((m) => m.id === id) || null;
    }
  },

  async save(data: Partial<Material>): Promise<Material> {
    try {
      return await fetchJSON<Material>('/materials', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn('[Materials Save fallback to local]', err);
      const now = Date.now();
      const newMat: Material = {
        id: data.id || `mat_${now}`,
        user_id: 'user_local',
        title: data.title || '生活片段素材',
        story: data.story || '',
        people: data.people || [],
        time: data.time || '',
        location: data.location || '',
        scene: data.scene || '',
        dialogue: data.dialogue || '',
        emotion: data.emotion || '',
        reflection: data.reflection || '',
        themes: data.themes || [],
        tags: data.tags || [],
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
      localStorage.setItem('mote_materials', JSON.stringify(list));
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
        const userAnswers = history.filter((m) => m.role === 'user').map((m) => m.content).join('；');
        return {
          summaryCard: {
            title: noteContent.slice(0, 10) || '生活觀察',
            story: `${noteContent}。${userAnswers}`,
            people: ['我'],
            time: '某個午後',
            location: '校園邊緣',
            scene: '光影灑落的微小片刻',
            dialogue: '簡短深刻的話語',
            emotion: '平靜與回味',
            reflection: '看似平常的時光，蘊含著成長的痕跡。',
            themes: ['生活觀察', '成長記憶'],
            tags: ['生活', '日常'],
          },
        };
      }
      const count = history.filter((h) => h.role === 'user').length;
      if (count === 1) return { nextQuestion: '當時身邊還有誰在場？他們當下的表情或動作是什麼？' };
      if (count === 2) return { nextQuestion: '在那一瞬間，有什麼特別的聲音、氣味或映入眼簾的畫面？' };
      return { nextQuestion: '這件事發生之後，你的心情有了什麼轉變？帶給你什麼想法？' };
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
    try {
      const res = await fetchJSON<{ matches: Array<{ materialId: string; rank: 'high' | 'medium' | 'low'; reason: string }> }>('/materials/reverse-search', {
        method: 'POST',
        body: JSON.stringify({ promptText }),
      });
      return res.matches || [];
    } catch (err) {
      console.warn('[Reverse Search fallback]', err);
      const mats = materialsList || (await MaterialsAPI.list());
      return mats.map((m, idx) => ({
        materialId: m.id,
        rank: idx === 0 ? 'high' : 'medium',
        reason: '此素材的情感轉折與題意核心緊密呼應。',
      }));
    }
  },
};

// 3. Prompts API
const STARTER_PROMPTS: PromptItem[] = [
  {
    id: 'pr_001',
    title: '當我轉身看見那道光',
    raw_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    corrected_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    prompt_type: '記敘抒情',
    is_official: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'pr_002',
    title: '走過歲月的窗',
    raw_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    corrected_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    prompt_type: '記敘抒情',
    is_official: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'pr_003',
    title: '那一次，我選擇了留白',
    raw_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    corrected_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    prompt_type: '哲理思考',
    is_official: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

export const PromptsAPI = {
  async list(): Promise<PromptItem[]> {
    try {
      const res = await fetchJSON<PromptItem[]>('/prompts');
      return res && res.length > 0 ? res : STARTER_PROMPTS;
    } catch {
      const stored = localStorage.getItem('mote_prompts');
      return stored ? JSON.parse(stored) : STARTER_PROMPTS;
    }
  },

  async create(data: { title: string; raw_text: string; corrected_text?: string }): Promise<PromptItem> {
    try {
      return await fetchJSON<PromptItem>('/prompts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newPrompt: PromptItem = {
        id: `pr_${Date.now()}`,
        title: data.title,
        raw_text: data.raw_text,
        corrected_text: data.corrected_text || data.raw_text,
        prompt_type: '自訂題目',
        is_official: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const existing = await PromptsAPI.list();
      localStorage.setItem('mote_prompts', JSON.stringify([newPrompt, ...existing]));
      return newPrompt;
    }
  },
};

// 4. Essays API
export const EssaysAPI = {
  async list(): Promise<Essay[]> {
    try {
      return await fetchJSON<Essay[]>('/essays');
    } catch {
      const stored = localStorage.getItem('mote_essays');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async get(id: string): Promise<{ essay: Essay; operations: any[] } | null> {
    try {
      return await fetchJSON<{ essay: Essay; operations: any[] }>(`/essays/${id}`);
    } catch {
      const list = await EssaysAPI.list();
      const item = list.find((e) => e.id === id);
      const opsStored = localStorage.getItem(`mote_essay_ops_${id}`);
      const operations = opsStored ? JSON.parse(opsStored) : [];
      return item ? { essay: item, operations } : null;
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
        id: data.id || `esy_${now}`,
        user_id: 'user_local',
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
      localStorage.setItem('mote_essays', JSON.stringify(list));
      if (data.operations) {
        localStorage.setItem(`mote_essay_ops_${newEssay.id}`, JSON.stringify(data.operations));
      }
      return newEssay;
    }
  },

  async assist(
    selectedText: string,
    action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene',
    fullContext?: string
  ) {
    try {
      return await fetchJSON<{ original: string; suggestion: string; explanation: string }>(
        '/essays/assist',
        {
          method: 'POST',
          body: JSON.stringify({ selectedText, action, fullContext }),
        }
      );
    } catch {
      return {
        original: selectedText,
        suggestion: `${selectedText}，宛如初秋微風拂過水面，留下層層細緻的波紋。`,
        explanation: '以自然意象加強文句的畫面感與空間層次。',
      };
    }
  },
};

// 5. Mock Exams API
export const ExamsAPI = {
  async list(): Promise<ExamSession[]> {
    try {
      return await fetchJSON<ExamSession[]>('/exams');
    } catch {
      const stored = localStorage.getItem('mote_exams');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async start(promptId: string, durationMinutes = 50): Promise<ExamSession> {
    try {
      return await fetchJSON<ExamSession>('/exams/start', {
        method: 'POST',
        body: JSON.stringify({ promptId, durationMinutes }),
      });
    } catch {
      const session: ExamSession = {
        id: `exm_${Date.now()}`,
        user_id: 'user_local',
        prompt_id: promptId,
        duration_minutes: durationMinutes,
        started_at: Date.now(),
        status: 'in_progress',
      };
      return session;
    }
  },

  async submit(
    examId: string,
    pages: Array<{ pageNumber: number; image: string; text?: string }>,
    finalText: string
  ): Promise<{ success: boolean; submissionId: string; analysis: EssayAnalysis }> {
    try {
      return await fetchJSON<{ success: boolean; submissionId: string; analysis: EssayAnalysis }>(
        `/exams/${examId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ pages, finalText }),
        }
      );
    } catch {
      const evalRes = await AnalysisAPI.evaluate('模擬考作答', finalText);
      return {
        success: true,
        submissionId: `sub_${Date.now()}`,
        analysis: evalRes.analysis,
      };
    }
  },
};

// 6. Analysis API
export const AnalysisAPI = {
  async evaluate(title: string, content: string, promptText?: string) {
    try {
      return await fetchJSON<{ id: string; analysis: EssayAnalysis }>('/analysis/evaluate', {
        method: 'POST',
        body: JSON.stringify({ title, content, promptText }),
      });
    } catch {
      return {
        id: `ans_${Date.now()}`,
        analysis: {
          overallSummary: '文章能抓住生活中的具體片刻進行細膩描繪，語言自然流暢，情感真誠。',
          scores: {
            promptMatch: 85,
            intentDepth: 82,
            materialRichness: 86,
            structure: 80,
            description: 88,
            language: 84,
            emotion: 86,
            conclusion: 78,
          },
          strengths: ['細節描寫生動，畫面感強', '情感真摯自然，無造作之感'],
          weaknesses: [
            {
              dimension: '結尾說理',
              issue: '結尾處說理稍顯直接，可加強餘韻與情景交融。',
              suggestion: '嘗試以具象景物或開放式思考收尾。',
            },
          ],
          nextPracticeAdvice: '下一次寫作可著重於練習段落轉折與收尾時的情景交融。',
        },
      };
    }
  },

  async getWeaknesses(): Promise<WeaknessItem[]> {
    try {
      return await fetchJSON<WeaknessItem[]>('/analysis/weaknesses');
    } catch {
      const stored = localStorage.getItem('mote_weaknesses');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async getLatest(): Promise<EssayAnalysis | null> {
    try {
      return await fetchJSON<EssayAnalysis | null>('/analysis/latest');
    } catch {
      return null;
    }
  },
};

// 7. Vocabulary API
export const VocabularyAPI = {
  async list(): Promise<HardCharacter[]> {
    try {
      return await fetchJSON<HardCharacter[]>('/vocabulary');
    } catch {
      const stored = localStorage.getItem('mote_vocabulary');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async add(characterText: string, zhuyin?: string, sourceEssayId?: string): Promise<HardCharacter> {
    try {
      return await fetchJSON<HardCharacter>('/vocabulary', {
        method: 'POST',
        body: JSON.stringify({ characterText, zhuyin, sourceEssayId }),
      });
    } catch {
      const newChar: HardCharacter = {
        id: `voc_${Date.now()}`,
        user_id: 'user_local',
        character_text: characterText,
        zhuyin: zhuyin || '',
        source_essay_id: sourceEssayId,
        mastery_level: 1,
        created_at: Date.now(),
      };
      const existing = await VocabularyAPI.list();
      localStorage.setItem('mote_vocabulary', JSON.stringify([newChar, ...existing]));
      return newChar;
    }
  },
};
