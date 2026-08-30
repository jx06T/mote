import { Bindings, MaterialCardData, EssayAnalysisData } from '../../types';
import {
  AI_CANDIDATE_MODELS,
  AI_TASK_CONFIGS,
  getInterviewQuestionSystemPrompt,
  getMaterialSummarySystemPrompt,
  INTERVIEW_FALLBACK_QUESTIONS,
  getMaterialSummaryFallback,
  getReverseSearchSystemPrompt,
  getReverseSearchFallbackMatches,
  getWritingAssistancePrompt,
  getWritingAssistFallback,
  WritingAssistAction,
  getEssayAnalysisPrompt,
  getEssayAnalysisFallback,
  getPromptExtractionPrompt,
  getOCRCorrectionPrompt,
  getOCRFallback,
} from '../../prompts';

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
    const systemPrompt = getInterviewQuestionSystemPrompt(noteContent);

    if (this.apiKey) {
      try {
        const response = await this.callGemini(
          systemPrompt,
          history,
          false,
          AI_TASK_CONFIGS.interview_question?.temperature ?? 0.3
        );
        if (response) return response.trim();
      } catch (err) {
        console.warn('[AI Interview Call Fallback]', err);
      }
    }

    // Heuristic Fallback
    const turnCount = history.filter((m) => m.role === 'user').length;
    const fallbackIdx = Math.min(turnCount, INTERVIEW_FALLBACK_QUESTIONS.length - 1);
    return INTERVIEW_FALLBACK_QUESTIONS[fallbackIdx] || INTERVIEW_FALLBACK_QUESTIONS[0];
  }

  // 2. 素材卡結構化整理
  async summarizeMaterialCard(
    noteContent: string,
    history: Array<{ role: string; content: string }>
  ): Promise<MaterialCardData> {
    const systemPrompt = getMaterialSummarySystemPrompt(noteContent);

    if (this.apiKey) {
      try {
        const text = await this.callGemini(
          systemPrompt,
          history,
          true,
          AI_TASK_CONFIGS.material_summary?.temperature ?? 0.2
        );
        if (text) {
          const parsed = JSON.parse(this.cleanJson(text));
          return parsed;
        }
      } catch (err) {
        console.warn('[AI Material Summary Fallback]', err);
      }
    }

    // Heuristic Fallback - Isolated from centralized prompt module
    return getMaterialSummaryFallback(noteContent, history);
  }

  // 3. 題目反向素材推薦
  async rankMaterialsForPrompt(
    promptText: string,
    materials: Array<{ id: string; title: string; story: string; themes: string[] }>
  ): Promise<Array<{ materialId: string; rank: 'high' | 'medium' | 'low'; reason: string }>> {
    if (materials.length === 0) return [];

    if (this.apiKey) {
      try {
        const systemPrompt = getReverseSearchSystemPrompt(
          promptText,
          JSON.stringify(materials)
        );
        const res = await this.callGemini(
          systemPrompt,
          [],
          true,
          AI_TASK_CONFIGS.reverse_search?.temperature ?? 0.2
        );
        if (res) {
          const parsed = JSON.parse(this.cleanJson(res));
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[AI Reverse Search Fallback]', err);
      }
    }

    // Dynamic keyword matching fallback - Isolated from centralized prompt module
    return getReverseSearchFallbackMatches(promptText, materials);
  }

  // 4. AI 寫作輔助 (比喻, 仿寫, 擴寫, 精簡, 增加情緒, 增加畫面)
  async assistWriting(
    sentence: string,
    action: WritingAssistAction,
    contextEssay?: string
  ): Promise<{ original: string; suggestion: string; explanation: string }> {
    const prompt = getWritingAssistancePrompt(sentence, action, contextEssay);

    if (this.apiKey) {
      try {
        const res = await this.callGemini(
          prompt,
          [],
          true,
          AI_TASK_CONFIGS.writing_assist?.temperature ?? 0.4
        );
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

    // Heuristic fallbacks - Isolated from centralized prompt module
    return getWritingAssistFallback(sentence, action);
  }

  // 5. 作文多面向結構化分析
  async analyzeEssay(title: string, content: string, promptText?: string): Promise<EssayAnalysisData> {
    const prompt = getEssayAnalysisPrompt(title, content, promptText);

    if (this.apiKey) {
      try {
        const res = await this.callGemini(
          prompt,
          [],
          true,
          AI_TASK_CONFIGS.essay_analysis?.temperature ?? 0.2
        );
        if (res) {
          return JSON.parse(this.cleanJson(res));
        }
      } catch (err) {
        console.warn('[AI Essay Analysis Fallback]', err);
      }
    }

    // Heuristic Fallback - Isolated from centralized prompt module
    return getEssayAnalysisFallback(title, content, promptText);
  }

  // 6. OCR 文字辨識處理
  async performOCR(imageDataUrl: string): Promise<{ text: string; confidence: number }> {
    return getOCRFallback(imageDataUrl);
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
    jsonMode = false,
    temperature = 0.3
  ): Promise<string | null> {
    if (!this.apiKey) return null;

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (history.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }],
      });
    } else {
      for (const msg of history) {
        const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
        const text = (msg.content || '').trim();
        if (!text) continue;

        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${text}`;
        } else {
          contents.push({
            role,
            parts: [{ text }],
          });
        }
      }

      if (contents.length > 0 && contents[0].role === 'model') {
        contents.unshift({
          role: 'user',
          parts: [{ text: '請開始引導' }],
        });
      }
    }

    for (const model of AI_CANDIDATE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const payload: any = {
        contents,
        generationConfig: {
          temperature,
        },
      };

      if (history.length > 0 && systemPrompt) {
        payload.systemInstruction = {
          parts: [{ text: systemPrompt }],
        };
      }

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
        console.warn(`[Gemini API Model ${model} Failed]`, err);
      }
    }
    return null;
  }

  private cleanJson(raw: string): string {
    return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
}
