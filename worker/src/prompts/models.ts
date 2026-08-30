/**
 * AI 模型與推論參數集中配置 (AI Models & Inference Parameters Configuration)
 */

export const AI_CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export interface GenerationTaskConfig {
  temperature: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export const AI_TASK_CONFIGS: Record<string, GenerationTaskConfig> = {
  interview_question: {
    temperature: 0.3,
    topP: 0.85,
    maxOutputTokens: 256,
  },
  material_summary: {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 1024,
  },
  reverse_search: {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 1024,
  },
  writing_assist: {
    temperature: 0.4,
    topP: 0.9,
    maxOutputTokens: 512,
  },
  essay_analysis: {
    temperature: 0.2,
    topP: 0.85,
    maxOutputTokens: 2048,
  },
  ocr_extraction: {
    temperature: 0.1,
    topP: 0.8,
    maxOutputTokens: 1024,
  },
};
