import { PromptItem } from '../types';

/**
 * 前端精選範本題目與 AI 引導配置 (Frontend Starter Prompts & AI Configuration)
 */

export const STARTER_PROMPTS: PromptItem[] = [
  {
    id: 'pr_001',
    title: '當我轉身看見那道光',
    raw_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    corrected_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    prompt_type: '記敘抒情',
    is_official: 1,
    created_at: 1700000000000,
    updated_at: 1700000000000,
  },
  {
    id: 'pr_002',
    title: '走過歲月的窗',
    raw_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    corrected_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    prompt_type: '記敘抒情',
    is_official: 1,
    created_at: 1700000000000,
    updated_at: 1700000000000,
  },
  {
    id: 'pr_003',
    title: '那一次，我選擇了留白',
    raw_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    corrected_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    prompt_type: '哲理思考',
    is_official: 1,
    created_at: 1700000000000,
    updated_at: 1700000000000,
  },
];

export const DEFAULT_INTERVIEW_OPENING = (noteContent: string): string => {
  return `你記下了：「${noteContent}」。這是一段很有潛力的生活片段。當時除了你之外，身邊還有誰在場？或有什麼特別的動作？`;
};

export const INTERVIEW_FALLBACK_QUESTIONS = [
  '當時身邊還有誰在場？他們當下的表情或動作是什麼？',
  '在那一瞬間，有什麼特別的聲音、氣味或眼前映入的第一個畫面讓你印象最深？',
  '這件事發生之後，你的心情有了什麼變化？現在回想起來，它帶給你什麼啟發或想法？',
  '這段經歷非常生動。還有沒有哪一句話或微小細節是你特別想記下來的？',
];

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

export const ESSAY_ANALYSIS_DIMENSIONS = [
  { key: 'promptMatch', name: '切題度', description: '是否扣緊題旨開展，有無偏題或離題' },
  { key: 'intentDepth', name: '立意深度', description: '思想格局、是否由表象深入至人生思考' },
  { key: 'materialRichness', name: '素材豐富', description: '選材是否具體生動、是否貼近生活真實體驗' },
  { key: 'structure', name: '篇章結構', description: '起承轉合、段落層次、首尾呼應' },
  { key: 'description', name: '細節描寫', description: '感官摹寫、光影色彩、動態刻畫' },
  { key: 'language', name: '語言修辭', description: '字詞精準、句式變化、修辭技巧' },
  { key: 'emotion', name: '情感真摯', description: '真情實感、有無虛假造作之感' },
  { key: 'conclusion', name: '結尾餘韻', description: '結尾是否有力、是否情景交融，避免生硬說教' },
];
