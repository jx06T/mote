/**
 * 官方精選寫作題目範本 (Official Starter Essay Prompts Templates)
 */

export interface StarterPromptTemplate {
  id: string;
  title: string;
  raw_text: string;
  corrected_text: string;
  prompt_type: string;
  is_official: number;
}

export const DEFAULT_STARTER_PROMPTS: StarterPromptTemplate[] = [
  {
    id: 'pr_001',
    title: '當我轉身看見那道光',
    raw_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    corrected_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    prompt_type: '記敘抒情',
    is_official: 1,
  },
  {
    id: 'pr_002',
    title: '走過歲月的窗',
    raw_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    corrected_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    prompt_type: '記敘抒情',
    is_official: 1,
  },
  {
    id: 'pr_003',
    title: '那一次，我選擇了留白',
    raw_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    corrected_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    prompt_type: '哲理思考',
    is_official: 1,
  },
];
