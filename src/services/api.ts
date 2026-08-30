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
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${endpoint}, using local fallback:`, err);
    throw err;
  }
}

// 1. Quick Notes API
export const QuickNotesAPI = {
  async list(): Promise<QuickNote[]> {
    try {
      return await fetchJSON<QuickNote[]>('/quick-notes');
    } catch {
      const stored = localStorage.getItem('mote_quick_notes');
      if (stored) return JSON.parse(stored);
      return [
        {
          id: 'qn_001',
          user_id: 'user_demo_student',
          content: '今天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都躲在屋簷下等雨停。',
          status: 'active',
          created_at: Date.now() - 3600000 * 4,
          updated_at: Date.now() - 3600000 * 4,
        },
        {
          id: 'qn_002',
          user_id: 'user_demo_student',
          content: '阿嬤在廚房燉蘿蔔湯，蒸氣把廚房玻璃全蒙上一層霧，她在上面畫了一個笑臉。',
          status: 'active',
          created_at: Date.now() - 86400000 * 2,
          updated_at: Date.now() - 86400000 * 2,
        },
      ];
    }
  },

  async create(content: string): Promise<QuickNote> {
    try {
      return await fetchJSON<QuickNote>('/quick-notes', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    } catch {
      const newNote: QuickNote = {
        id: 'qn_' + Date.now(),
        user_id: 'user_demo_student',
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
    } catch {
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
    } catch {
      const stored = localStorage.getItem('mote_materials');
      if (stored) return JSON.parse(stored);
      return [
        {
          id: 'mat_001',
          user_id: 'user_demo_student',
          title: '老校門與暴雨後的槐樹',
          story:
            '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。風吹得雨絲斜斜掃進來，大家相視苦笑，那種共度狼狽的默契反而讓平淡的放學時光變得難忘。',
          people: ['我', '同班同學', '警衛叔叔'],
          time: '初秋某個週五傍晚',
          location: '老校門邊屋簷下',
          scene: '地面水窪倒映著昏黃路燈，落葉隨流水打轉。',
          dialogue: '「這雨短時間停不了，但挺舒服的。」',
          emotion: '由焦慮無奈轉為平靜溫暖。',
          reflection: '人生的某些意外停頓，往往是回望生活最好的契機。',
          themes: ['時間與記憶', '陪伴與默契', '生活留白'],
          tags: ['校園', '雨天', '回憶'],
          created_at: Date.now() - 86400000 * 3,
          updated_at: Date.now() - 86400000 * 3,
        },
        {
          id: 'mat_002',
          user_id: 'user_demo_student',
          title: '廚房玻璃上的霧氣笑臉',
          story:
            '寒流來襲的夜晚，阿嬤在廚房燉熱騰騰的白蘿蔔排骨湯。滾沸的蒸氣把窗戶玻璃蒙上一層厚厚的水霧。阿嬤轉身用手指在玻璃上畫了一個歪歪的笑臉，那一瞬間廚房裡的熱氣彷彿驅散了整個冬天的寒意。',
          people: ['阿嬤', '我'],
          time: '冬夜晚餐前',
          location: '老家廚房',
          scene: '微黃燈光下白氣繚繞，水滴順著玻璃慢慢滑落。',
          dialogue: '「趁熱喝一碗，身子就暖了。」',
          emotion: '純粹而踏實的幸福感。',
          reflection: '親情的重量往往不在大言語，而在一碗熱湯與無意間的童心裡。',
          themes: ['親情溫暖', '家的記憶', '平凡幸福'],
          tags: ['親情', '冬夜', '家常'],
          created_at: Date.now() - 86400000 * 7,
          updated_at: Date.now() - 86400000 * 7,
        },
      ];
    }
  },

  async get(id: string): Promise<Material | undefined> {
    const list = await MaterialsAPI.list();
    return list.find((m) => m.id === id);
  },

  async save(material: Partial<Material>): Promise<Material> {
    try {
      const res = await fetchJSON<{ success: boolean; material: Material }>('/materials', {
        method: 'POST',
        body: JSON.stringify(material),
      });
      return res.material;
    } catch {
      const full: Material = {
        id: material.id || 'mat_' + Date.now(),
        user_id: 'user_demo_student',
        title: material.title || '無標題素材',
        story: material.story || '',
        people: material.people || [],
        time: material.time || '',
        location: material.location || '',
        scene: material.scene || '',
        dialogue: material.dialogue || '',
        emotion: material.emotion || '',
        reflection: material.reflection || '',
        themes: material.themes || [],
        tags: material.tags || [],
        created_at: material.created_at || Date.now(),
        updated_at: Date.now(),
      };
      const existing = await MaterialsAPI.list();
      const updated = [full, ...existing.filter((m) => m.id !== full.id)];
      localStorage.setItem('mote_materials', JSON.stringify(updated));
      return full;
    }
  },

  async askInterview(noteContent: string, messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const res = await fetchJSON<{ question: string }>('/materials/interview/ask', {
        method: 'POST',
        body: JSON.stringify({ noteContent, messages }),
      });
      return res.question;
    } catch {
      const count = messages.filter((m) => m.role === 'user').length;
      if (count === 1) return '當時身邊還有誰在場？他們有說什麼或做了什麼動作嗎？';
      if (count === 2) return '那一瞬間最深刻的聲音、光影或空氣中的氣味是什麼？';
      return '這件事帶給你什麼特別的感受或後續的想法？';
    }
  },

  async summarizeInterview(noteContent: string, messages: Array<{ role: string; content: string }>): Promise<any> {
    try {
      const res = await fetchJSON<{ card: any }>('/materials/interview/summarize', {
        method: 'POST',
        body: JSON.stringify({ noteContent, messages }),
      });
      return res.card;
    } catch {
      const userStory = messages.filter((m) => m.role === 'user').map((m) => m.content).join('；');
      return {
        title: noteContent.slice(0, 10) || '生活深思片段',
        story: `在一個平常的日子裡，發生了這件事：${noteContent}。回想當時的情境：${userStory}`,
        people: ['我', '同伴'],
        time: '近期的某個午後',
        location: '熟悉的生活場景',
        scene: '光影交錯與周遭微弱的聲響',
        dialogue: '言語簡短卻印在心中',
        emotion: '由起初的尋常轉為平靜的感動',
        reflection: '在尋常日子裡發現微小而真實的力量。',
        themes: ['生活觀察', '時間與記憶'],
        tags: ['生活記錄', '高中日常'],
      };
    }
  },

  async reverseSearch(promptText: string, materials: Material[]): Promise<Array<{ materialId: string; rank: 'high' | 'medium' | 'low'; reason: string }>> {
    try {
      const res = await fetchJSON<{ recommendations: any[] }>('/materials/reverse-search', {
        method: 'POST',
        body: JSON.stringify({ promptText, materials }),
      });
      return res.recommendations;
    } catch {
      return materials.map((m, idx) => ({
        materialId: m.id,
        rank: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
        reason: idx === 0
          ? `素材中的情境「${m.title}」與題目意境高度相符，非常適合聚焦發揮。`
          : `可以做為文章次段的情感襯托或視角轉換。`,
      }));
    }
  },
};

// 3. Prompts API
export const PromptsAPI = {
  async list(): Promise<PromptItem[]> {
    try {
      return await fetchJSON<PromptItem[]>('/prompts');
    } catch {
      const stored = localStorage.getItem('mote_prompts');
      if (stored) return JSON.parse(stored);
      return [
        {
          id: 'prm_001',
          user_id: 'user_demo_student',
          title: '當我轉身看見那道光',
          raw_text: '生活中有許多看似平凡的時刻，往往在回首時才發現其深遠的意義。請以「當我轉身看見那道光」為題，寫一篇文章，記述一段觸動心靈的經歷與你的感悟。',
          corrected_text: '生活中有許多看似平凡的時刻，往往在回首時才發現其深遠的意義。請以「當我轉身看見那道光」為題，寫一篇文章，記述一段觸動心靈的經歷與你的感悟。',
          prompt_type: '記敘抒情',
          created_at: Date.now() - 86400000 * 5,
          updated_at: Date.now() - 86400000 * 5,
        },
        {
          id: 'prm_002',
          user_id: 'user_demo_student',
          title: '走過歲月的窗',
          raw_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。請以「走過歲月的窗」為題，結合個人生活經驗，書寫你對時間、成長或環境變遷的觀察與體會。',
          corrected_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。請以「走過歲月的窗」為題，結合個人生活經驗，書寫你對時間、成長或環境變遷的觀察與體會。',
          prompt_type: '情意散文',
          created_at: Date.now() - 86400000 * 10,
          updated_at: Date.now() - 86400000 * 10,
        },
      ];
    }
  },

  async create(prompt: Partial<PromptItem>): Promise<PromptItem> {
    try {
      return await fetchJSON<PromptItem>('/prompts', {
        method: 'POST',
        body: JSON.stringify(prompt),
      });
    } catch {
      const full: PromptItem = {
        id: 'prm_' + Date.now(),
        user_id: 'user_demo_student',
        title: prompt.title || '自訂題目',
        raw_text: prompt.raw_text || '',
        corrected_text: prompt.corrected_text || prompt.raw_text || '',
        prompt_type: prompt.prompt_type || '一般作文',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const existing = await PromptsAPI.list();
      localStorage.setItem('mote_prompts', JSON.stringify([full, ...existing]));
      return full;
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
      if (stored) return JSON.parse(stored);
      return [
        {
          id: 'esy_001',
          user_id: 'user_demo_student',
          prompt_id: 'prm_001',
          title: '當我轉身看見那道光',
          current_content: '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。風吹得雨絲斜斜掃進來，大家相視苦笑。我看著水窪倒映出的微光，忽然明白那些看似狼狽的等待，也是時光留給我們的溫柔片刻。',
          word_count: 128,
          status: 'analyzed',
          created_at: Date.now() - 86400000 * 2,
          updated_at: Date.now() - 86400000 * 2,
        },
      ];
    }
  },

  async get(id: string): Promise<{ essay: Essay; operations: any[] }> {
    try {
      return await fetchJSON<{ essay: Essay; operations: any[] }>(`/essays/${id}`);
    } catch {
      const list = await EssaysAPI.list();
      const match = list.find((e) => e.id === id) || {
        id,
        user_id: 'user_demo_student',
        title: '當我轉身看見那道光',
        current_content: '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。',
        word_count: 58,
        status: 'draft' as const,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      return { essay: match, operations: [] };
    }
  },

  async save(essayData: {
    id?: string;
    promptId?: string;
    title?: string;
    content: string;
    status?: 'draft' | 'submitted' | 'analyzed';
    operations?: any[];
  }): Promise<{ success: boolean; essay: Essay }> {
    try {
      return await fetchJSON<{ success: boolean; essay: Essay }>('/essays', {
        method: 'POST',
        body: JSON.stringify(essayData),
      });
    } catch {
      const full: Essay = {
        id: essayData.id || 'esy_' + Date.now(),
        user_id: 'user_demo_student',
        prompt_id: essayData.promptId,
        title: essayData.title || '無標題作文',
        current_content: essayData.content,
        word_count: essayData.content.replace(/\s+/g, '').length,
        status: essayData.status || 'draft',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const list = await EssaysAPI.list();
      const updated = [full, ...list.filter((e) => e.id !== full.id)];
      localStorage.setItem('mote_essays', JSON.stringify(updated));
      return { success: true, essay: full };
    }
  },

  async assist(sentence: string, action: string, contextEssay?: string): Promise<{ original: string; suggestion: string; explanation: string }> {
    try {
      return await fetchJSON('/essays/assist', {
        method: 'POST',
        body: JSON.stringify({ sentence, action, contextEssay }),
      });
    } catch {
      return {
        original: sentence,
        suggestion: `${sentence}，宛如暮色裡悄然泛起的一圈漣漪。`,
        explanation: '增加了具象的意象描寫，讓文意延伸更有餘韻。',
      };
    }
  },
};

// 5. Analysis API
export const AnalysisAPI = {
  async evaluate(title: string, content: string, promptText?: string): Promise<{ id: string; analysis: EssayAnalysis }> {
    try {
      return await fetchJSON('/analysis/evaluate', {
        method: 'POST',
        body: JSON.stringify({ title, content, promptText }),
      });
    } catch {
      return {
        id: 'ans_' + Date.now(),
        analysis: {
          overallSummary: '文章文筆細膩自然，對生活場景的捕捉極具畫面感。若能在結尾深化立意，避免匆促說理，篇章將更具感染力。',
          scores: {
            promptMatch: 88,
            intentDepth: 82,
            materialRichness: 86,
            structure: 80,
            description: 85,
            language: 84,
            emotion: 88,
            conclusion: 78,
          },
          strengths: [
            '生活素材取材真摯，細節描寫具備臨場感。',
            '情感真切，語句具有節奏韻律。',
          ],
          weaknesses: [
            {
              dimension: '結尾說理',
              issue: '末段有直接說教或匆忙下定論的傾向。',
              suggestion: '嘗試以具體景物或未完的思考作結，讓讀者自行品味。',
            },
            {
              dimension: '段落轉折',
              issue: '第二段與第三段之間的過渡稍顯生硬。',
              suggestion: '可加入一句心境轉折的鋪墊句。',
            },
          ],
          nextPracticeAdvice: '下次練習請特別著重於「以景結情」的結尾方式。',
        },
      };
    }
  },

  async getWeaknesses(): Promise<WeaknessItem[]> {
    try {
      return await fetchJSON<WeaknessItem[]>('/analysis/weaknesses');
    } catch {
      return [
        {
          id: 'wk_01',
          dimension: '結尾說理',
          description: '末段常有直接說教或匆忙點題的傾向',
          occurrence_count: 4,
          recent_trend: 'improving',
        },
        {
          id: 'wk_02',
          dimension: '段落轉折',
          description: '由景入情或由事入理的過渡句稍嫌生硬',
          occurrence_count: 3,
          recent_trend: 'steady',
        },
        {
          id: 'wk_03',
          dimension: '抽象詞過多',
          description: '情緒表達偏好抽象形容詞，較少落實於具體物象',
          occurrence_count: 2,
          recent_trend: 'improving',
        },
      ];
    }
  },
};

// 6. Exams API
export const ExamsAPI = {
  async list(): Promise<ExamSession[]> {
    try {
      return await fetchJSON<ExamSession[]>('/exams');
    } catch {
      return [
        {
          id: 'exm_001',
          user_id: 'user_demo_student',
          prompt_id: 'prm_001',
          prompt_title: '當我轉身看見那道光',
          duration_minutes: 50,
          started_at: Date.now() - 86400000 * 4,
          ended_at: Date.now() - 86400000 * 4 + 50 * 60 * 1000,
          status: 'submitted',
        },
      ];
    }
  },

  async start(promptId: string, durationMinutes = 50): Promise<ExamSession> {
    try {
      return await fetchJSON<ExamSession>('/exams/start', {
        method: 'POST',
        body: JSON.stringify({ promptId, durationMinutes }),
      });
    } catch {
      return {
        id: 'exm_' + Date.now(),
        user_id: 'user_demo_student',
        prompt_id: promptId,
        duration_minutes: durationMinutes,
        started_at: Date.now(),
        status: 'in_progress',
      };
    }
  },

  async submit(examId: string, pages: any[], finalText?: string): Promise<{ success: boolean; analysis: EssayAnalysis }> {
    try {
      return await fetchJSON(`/exams/${examId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ pages, finalText }),
      });
    } catch {
      const mockAnalysis = await AnalysisAPI.evaluate('模擬考作答', finalText || '手寫辨識內容');
      return { success: true, analysis: mockAnalysis.analysis };
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
      if (stored) return JSON.parse(stored);
      return [
        { id: 'voc_01', character_text: '羨', zhuyin: 'ㄒㄧㄢˋ', mastery_level: 2 },
        { id: 'voc_02', character_text: '櫺', zhuyin: 'ㄌㄧㄥˊ', mastery_level: 1 },
        { id: 'voc_03', character_text: '謐', zhuyin: 'ㄇㄧˋ', mastery_level: 3 },
      ];
    }
  },

  async add(characterText: string, zhuyin?: string): Promise<HardCharacter> {
    try {
      return await fetchJSON<HardCharacter>('/vocabulary', {
        method: 'POST',
        body: JSON.stringify({ characterText, zhuyin }),
      });
    } catch {
      const newItem: HardCharacter = {
        id: 'voc_' + Date.now(),
        character_text: characterText,
        zhuyin: zhuyin || '—',
        mastery_level: 0,
      };
      const list = await VocabularyAPI.list();
      localStorage.setItem('mote_vocabulary', JSON.stringify([newItem, ...list]));
      return newItem;
    }
  },
};
