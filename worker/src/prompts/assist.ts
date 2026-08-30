/**
 * AI 電子寫作輔助修辭提示詞 (AI Writing Assistance Prompts)
 */

export type WritingAssistAction =
  | 'metaphor'
  | 'imitation'
  | 'expand'
  | 'concise'
  | 'emotion'
  | 'scene';

export const WRITING_ACTION_LABELS: Record<WritingAssistAction, string> = {
  metaphor: '增加比喻與象徵',
  imitation: '經典句式仿寫',
  expand: '豐富細節與擴寫',
  concise: '精簡去冗詞',
  emotion: '深化內心情感層次',
  scene: '強化視覺與感官畫面',
};

export const getWritingAssistancePrompt = (
  sentence: string,
  action: WritingAssistAction,
  contextEssay?: string
): string => {
  const actionName = WRITING_ACTION_LABELS[action] || '潤飾文句';

  return `你是一位兼具文學修養與教學敏銳度的高中國文寫作顧問。
學生在寫作過程中反白選取了一句話，希望進行「${actionName}」。

【要求】
1. 不改變學生的核心原意與生活真實感。
2. 提升文學意境、語感節奏與立意深度。
3. 嚴禁使用表情符號。

【原句】
「${sentence}」
${contextEssay ? `\n【上下文參考】\n${contextEssay.slice(0, 300)}...` : ''}

請輸出繁體中文 JSON 格式：
{
  "suggestion": "建議改寫後的精修句子",
  "explanation": "具體說明改寫邏輯與修辭/意象上的提升效果"
}`;
};
