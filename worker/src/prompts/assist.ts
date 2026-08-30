/**
 * AI 電子寫作輔助修辭提示詞與降級配置 (AI Writing Assistance Prompts & Fallbacks)
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

export interface WritingAssistResult {
  original: string;
  suggestion: string;
  explanation: string;
}

/**
 * 離線或無 API Key 時的啟發式修辭建議降級
 */
export const getWritingAssistFallback = (
  sentence: string,
  action: WritingAssistAction
): WritingAssistResult => {
  switch (action) {
    case 'metaphor':
      return {
        original: sentence,
        suggestion: `${sentence}，宛如一葉在微風中輕輕打轉的秋槭，無聲地沉落於心底澄澈的湖面。`,
        explanation: '以落葉入水的比喻，將抽象的情緒具象化為緩慢而深邃的畫面。',
      };
    case 'imitation':
      return {
        original: sentence,
        suggestion: `有些時刻之所以深刻，不在於其絢爛，而在於那份回望時的清明；正如${sentence}。`,
        explanation: '採用哲思對比句式，強化文句的節奏感與沉思感。',
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
};
