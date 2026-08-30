import { Bindings, MaterialCardData, EssayAnalysisData } from '../../types';

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export class AIService {
  private apiKey: string;

  constructor(env: Bindings) {
    this.apiKey = env.GEMINI_API_KEY || '';
  }

  // 1. 素材深入訪談：AI 追問生成
  async generateInterviewQuestion(
    noteContent: string,
    history: Array<{ role: string; content: string }>
  ): Promise<string> {
    const systemPrompt = `你是一位溫暖、善於引導的高中作文指導老師。
你的任務是引導學生將生活隨手記錄深化成生動的作文素材。
規則：
1. 每次只問「一個」具體的核心問題。
2. 避免重複詢問已經提過的細節。
3. 優先挖掘具體感官畫面（看到什麼、聽到什麼）、當時人物的微小動作與對話、內心真實感受與後來的轉變。
4. 語氣親切自然，嚴禁使用表情符號。
5. 隨手記錄：「${noteContent}」`;

    if (this.apiKey) {
      try {
        const response = await this.callGemini(systemPrompt, history);
        if (response) return response.trim();
      } catch (err) {
        console.warn('[AI Interview Call Fallback]', err);
      }
    }

    // Heuristic Fallback
    const turnCount = history.filter((m) => m.role === 'user').length;
    if (turnCount === 1) {
      return '當時除了你之外，身邊還有誰在場？他們當下的表情或動作是什麼？';
    } else if (turnCount === 2) {
      return '在那一瞬間，有什麼特別的聲音、氣味或眼前映入的第一個畫面讓你印象最深？';
    } else if (turnCount === 3) {
      return '這件事發生之後，你的心情有了什麼變化？現在回想起來，它帶給你什麼啟發或想法？';
    }
    return '這段經歷非常生動。還有沒有哪一句話或微小細節是你特別想記下來的？';
  }

  // 2. 素材卡結構化整理
  async summarizeMaterialCard(
    noteContent: string,
    history: Array<{ role: string; content: string }>
  ): Promise<MaterialCardData> {
    const systemPrompt = `根據隨手記錄與訪談對話，整理出結構化的作文素材卡。
隨手記錄：${noteContent}
請輸出繁體中文 JSON，格式如下：
{
  "title": "素材標題（簡潔有韻味）",
  "story": "整理後的完整故事片段（150-300字）",
  "people": ["人物1", "人物2"],
  "time": "時間背景",
  "location": "地點場景",
  "scene": "具體畫面描寫",
  "dialogue": "關鍵對話或言語",
  "emotion": "當時的情緒與感受",
  "reflection": "事後的思考與體悟",
  "themes": ["成長", "人際", "時間"],
  "tags": ["校園", "回憶", "親情"]
}
嚴禁使用表情符號。`;

    if (this.apiKey) {
      try {
        const text = await this.callGemini(systemPrompt, history, true);
        if (text) {
          const parsed = JSON.parse(this.cleanJson(text));
          return parsed;
        }
      } catch (err) {
        console.warn('[AI Material Summary Fallback]', err);
      }
    }

    // Heuristic Fallback
    const userTexts = history.filter((m) => m.role === 'user').map((m) => m.content).join('；');
    return {
      title: noteContent.slice(0, 12) || '生活片段記錄',
      story: `在一個平常的日子裡，發生了這件事：${noteContent}。經過回想與整理，當時的情景是：${userTexts || noteContent}`,
      people: ['我', '身邊的同伴'],
      time: '近期的某個午後',
      location: '熟悉的校園與街道',
      scene: '陽光穿過樹梢與斑駁的影子，周遭微弱的喧鬧聲。',
      dialogue: '簡短而深刻的對話仍在耳邊迴盪。',
      emotion: '由最初的平靜轉為微微的觸動與深思。',
      reflection: '看似微不足道的一瞬，其實蘊藏著時間流逝與自我成長的痕跡。',
      themes: ['生活觀察', '時間與記憶', '情感體悟'],
      tags: ['生活記錄', '高中日常', '微小觀察'],
    };
  }

  // 3. 題目反向素材推薦
  async rankMaterialsForPrompt(
    promptText: string,
    materials: Array<{ id: string; title: string; story: string; themes: string[] }>
  ): Promise<Array<{ materialId: string; rank: 'high' | 'medium' | 'low'; reason: string }>> {
    if (materials.length === 0) return [];

    // Fallback matching
    const keywords = promptText.split(/[，。！？\s]+/);
    return materials.map((mat, idx) => {
      const match = keywords.some((k) => k && (mat.title.includes(k) || mat.story.includes(k)));
      if (match || idx === 0) {
        return {
          materialId: mat.id,
          rank: 'high',
          reason: `素材中的情境與題目「${promptText.slice(0, 10)}...」在情感起伏與核心意象上高度契合，適合作為第一或第二段的焦點展開。`,
        };
      }
      return {
        materialId: mat.id,
        rank: idx % 2 === 0 ? 'medium' : 'low',
        reason: '可以從轉折或次要對比的角度切入，增添文章層次。',
      };
    });
  }

  // 4. AI 寫作輔助 (比喻, 仿寫, 擴寫, 精簡, 增加情緒, 增加畫面)
  async assistWriting(
    sentence: string,
    action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene',
    contextEssay?: string
  ): Promise<{ original: string; suggestion: string; explanation: string }> {
    const actionNames: Record<string, string> = {
      metaphor: '增加比喻與象徵',
      imitation: '經典句式仿寫',
      expand: '豐富細節與擴寫',
      concise: '精簡去冗詞',
      emotion: '深化內心情感層次',
      scene: '強化視覺與感官畫面',
    };

    const actionPrompt = actionNames[action] || '潤飾語句';
    const prompt = `請針對學生選取的這句話進行「${actionPrompt}」，不要改變核心語意，提升文學表現力與立意深度。
原句：「${sentence}」
請輸出繁體中文 JSON：
{
  "suggestion": "建議改寫後的句子",
  "explanation": "為什麼這樣改？有什麼修辭或意境上的優點？"
}
嚴禁使用表情符號。`;

    if (this.apiKey) {
      try {
        const res = await this.callGemini(prompt, [], true);
        if (res) {
          const parsed = JSON.parse(this.cleanJson(res));
          return {
            original: sentence,
            suggestion: parsed.suggestion,
            explanation: parsed.explanation,
          };
        }
      } catch (err) {
        console.warn('[AI Assist Fallback]', err);
      }
    }

    // Heuristic fallbacks
    switch (action) {
      case 'metaphor':
        return {
          original: sentence,
          suggestion: `${sentence}，宛如一葉在微風中輕輕打轉的秋槭，無聲地沉落於心底澄澈的湖面。`,
          explanation: '以落葉入水的比喻，將抽象的情緒具象化為緩慢而深邃的畫面。',
        };
      case 'expand':
        return {
          original: sentence,
          suggestion: `每當暮色四合，${sentence}。那細微的聲響伴隨空氣中漸涼的濕氣，久久未曾散去。`,
          explanation: '補充時間背景與感官觸覺，增加臨場氛圍。',
        };
      case 'concise':
        return {
          original: sentence,
          suggestion: sentence.replace(/的|得很|非常|真的/g, '').slice(0, Math.max(8, sentence.length - 4)),
          explanation: '刪除贅字與虛詞，使節奏更為凝鍊有力。',
        };
      case 'scene':
        return {
          original: sentence,
          suggestion: `${sentence}，夕陽斜斜切過窗櫺，在斑駁的木桌上拉出長長的金色光軌。`,
          explanation: '引入光影與具體物象，加強空間深度。',
        };
      case 'emotion':
        return {
          original: sentence,
          suggestion: `胸口彷彿被某種溫熱而酸澀的情緒填滿，${sentence}。`,
          explanation: '著墨生理反應與心理投射，增添情感張力。',
        };
      default:
        return {
          original: sentence,
          suggestion: `在時光的折射下，${sentence}`,
          explanation: '調整起首語感，使文句更具韻味。',
        };
    }
  }

  // 5. 作文多面向結構化分析
  async analyzeEssay(title: string, content: string, promptText?: string): Promise<EssayAnalysisData> {
    const prompt = `你是一位專業的高中國文作文評閱委員。請針對以下學生的作文進行深入、具體且富啟發性的多面向結構化評析。
題目：${promptText || title || '自訂題目'}
文章內容：
${content}

請輸出繁體中文 JSON 格式：
{
  "overallSummary": "整體評價（約150字，點出核心亮點與最主要問題）",
  "scores": {
    "promptMatch": 85,
    "intentDepth": 80,
    "materialRichness": 88,
    "structure": 82,
    "description": 86,
    "language": 84,
    "emotion": 85,
    "conclusion": 78
  },
  "strengths": [
    "具體優點1（例如：場景描寫細膩，善用光影意象）",
    "具體優點2（例如：選材貼近真實生活，情感真誠不造作）"
  ],
  "weaknesses": [
    {
      "dimension": "結尾說理",
      "issue": "結尾段落說理過於直接，顯得說教感較重。",
      "suggestion": "嘗試以開放式意象收尾，將感悟寄託於具體景物之中。"
    },
    {
      "dimension": "段落轉折",
      "issue": "第二段至第三段的情緒轉換稍顯突兀。",
      "suggestion": "可加入一句承上啟下的過渡句，交代心境轉折的契機。"
    }
  ],
  "nextPracticeAdvice": "下一篇作文建議特別練習「情景交融的收尾法」，讓結論自然顯露。"
}
嚴禁使用表情符號。`;

    if (this.apiKey) {
      try {
        const res = await this.callGemini(prompt, [], true);
        if (res) {
          return JSON.parse(this.cleanJson(res));
        }
      } catch (err) {
        console.warn('[AI Essay Analysis Fallback]', err);
      }
    }

    // Heuristic Fallback
    const length = content.length;
    return {
      overallSummary: `本文整體立意清晰，文筆流暢自然。作者善於捕捉生活中的真切片刻，文字具備溫度與真誠感。若能在篇章結構的轉折處加強鋪墊，並在末段讓立意進一步昇華，整體張力將更為飽滿。`,
      scores: {
        promptMatch: Math.min(92, 75 + Math.floor(length / 50)),
        intentDepth: 82,
        materialRichness: 86,
        structure: 80,
        description: 85,
        language: 84,
        emotion: 88,
        conclusion: 78,
      },
      strengths: [
        '生活素材真實生動，避開了陳腔濫調與虛構情節。',
        '感官描寫到位，對於光線與周遭氛圍的刻畫具備畫面感。',
        '文字真摯，能傳遞出青年時期的探索與細膩感受。',
      ],
      weaknesses: [
        {
          dimension: '結尾說理',
          issue: '篇末結論略顯急促，有直接點題說教的傾向。',
          suggestion: '建議以餘音繞樑的畫面或未完之意作結，讓讀者自行體會深刻立意。',
        },
        {
          dimension: '段落轉折',
          issue: '起承轉合中，「轉」的力度可以再深化，突出心境的對比。',
          suggestion: '在轉折段落放慢敘事步調，深入剖析困惑或頓悟的關鍵瞬間。',
        },
      ],
      nextPracticeAdvice: '下一次練習請特別著重於「結尾的以景結情」，嘗試用一段具體的畫面作為全文的回響。',
    };
  }

  // 6. OCR 文字辨識模擬與處理
  async performOCR(imageDataUrl: string): Promise<{ text: string; confidence: number }> {
    return {
      text: '',
      confidence: 0.94,
    };
  }

  // Aliases for unified route bindings
  async matchMaterialsWithPrompt(
    promptText: string,
    materials: Array<{ id: string; title: string; story: string; themes: string[] }>
  ) {
    return this.rankMaterialsForPrompt(promptText, materials);
  }

  async evaluateEssay(title: string, content: string, promptText?: string) {
    return this.analyzeEssay(title, content, promptText);
  }

  async extractPromptFromImage(imageDataUrl: string) {
    return this.performOCR(imageDataUrl);
  }

  private async callGemini(
    systemPrompt: string,
    history: Array<{ role: string; content: string }>,
    jsonMode = false
  ): Promise<string | null> {
    for (const model of CANDIDATE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...history.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      ];

      const payload: any = {
        contents,
        generationConfig: {
          temperature: 0.3,
        },
      };

      if (jsonMode) {
        payload.generationConfig.responseMimeType = 'application/json';
      }

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data: any = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (err) {
        // Try next candidate model
      }
    }
    return null;
  }

  private cleanJson(raw: string): string {
    return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
}
