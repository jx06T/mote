import { EssayAnalysisData } from '../types';

/**
 * 作文多面向結構化分析提示詞與降級配置 (Essay Multi-Dimension Analysis Prompts & Fallbacks)
 */

export interface AnalysisDimensionInfo {
  key: string;
  name: string;
  description: string;
}

export const ESSAY_ANALYSIS_DIMENSIONS: AnalysisDimensionInfo[] = [
  { key: 'promptMatch', name: '切題度', description: '是否扣緊題旨開展，有無偏題或離題' },
  { key: 'intentDepth', name: '立意深度', description: '思想格局、是否由表象深入至人生思考' },
  { key: 'materialRichness', name: '素材豐富', description: '選材是否具體生動、是否貼近生活真實體驗' },
  { key: 'structure', name: '篇章結構', description: '起承轉合、段落層次、首尾呼應' },
  { key: 'description', name: '細節描寫', description: '感官摹寫、光影色彩、動態刻畫' },
  { key: 'language', name: '語言修辭', description: '字詞精準、句式變化、修辭技巧' },
  { key: 'emotion', name: '情感真摯', description: '真情實感、有無虛假造作之感' },
  { key: 'conclusion', name: '結尾餘韻', description: '結尾是否有力、是否情景交融，避免生硬說教' },
];

export const getEssayAnalysisPrompt = (
  title: string,
  content: string,
  promptText?: string
): string => {
  return `你是一位專業且具啟發性的高中國文作文評閱委員。
請針對以下學生的作文進行客觀、深入且具體的多面向結構化評析。

【題目】
${promptText || title || '自訂題目'}

【文章全文】
${content}

【評析標準說明】
1. promptMatch: 切題度 (是否扣緊題旨開展，有無偏題或離題)
2. intentDepth: 立意深度 (思想格局、是否由表象深入至人生思考)
3. materialRichness: 素材豐富 (選材是否具體生動、是否貼近生活真實體驗)
4. structure: 篇章結構 (起承轉合、段落層次、首尾呼應)
5. description: 細節描寫 (感官摹寫、光影色彩、動態刻畫)
6. language: 語言修辭 (字詞精準、句式變化、修辭技巧)
7. emotion: 情感真摯 (真情實感、有無虛假造作之感)
8. conclusion: 結尾餘韻 (結尾是否有力、是否情景交融，避免生硬說教)

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
    "具體優點1（具體指出哪一段或哪些描寫做得特別好）",
    "具體優點2"
  ],
  "weaknesses": [
    {
      "dimension": "維度名稱（例如：結尾說理 / 段落轉折 / 細節鋪陳）",
      "issue": "具體指出的不足之處",
      "suggestion": "具體可行的改寫或調整建議"
    }
  ],
  "nextPracticeAdvice": "針對該學生的常態弱點，提供下一篇作文的具體練習焦點"
}

嚴禁使用表情符號。`;
};

/**
 * 離線或無 API Key 時的結構化作文分析報告降級
 */
export const getEssayAnalysisFallback = (
  title: string,
  content: string,
  promptText?: string
): EssayAnalysisData => {
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
};
