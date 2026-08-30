/**
 * 素材反向推薦與題目匹配提示詞 (Material Reverse Search & Prompt Matching)
 */

export interface ReverseSearchMatch {
  materialId: string;
  rank: 'high' | 'medium' | 'low';
  reason: string;
}

export const getReverseSearchSystemPrompt = (
  promptText: string,
  materialsJson: string
): string => {
  return `你是一位專業的高中作文題目與素材媒合分析師。
請分析作文題目，並從學生現有的生活素材庫中，挑選最適合寫入本篇作文的素材，並給予具體的破題與展開建議。

【作文題目】
${promptText}

【學生現有素材列表】
${materialsJson}

請輸出繁體中文 JSON 陣列，格式如下：
[
  {
    "materialId": "素材ID",
    "rank": "high", // 可為 "high" (很適合), "medium" (可以考慮), "low" (關聯較弱)
    "reason": "具體推薦理由（說明如何將此素材的故事或體悟轉化為本題的核心立意或情節開展）"
  }
]

嚴禁使用表情符號。`;
};

/**
 * 離線/降級狀態下的動態關鍵字媒合推薦
 */
export const getReverseSearchFallbackMatches = (
  promptText: string,
  materials: Array<{ id: string; title: string; story: string; themes?: string[] }>
): ReverseSearchMatch[] => {
  if (!materials || materials.length === 0) return [];

  const keywords = promptText
    .split(/[\s，。！？、；：「」『』\n\r]+/)
    .filter((k) => k.length > 1);

  return materials.map((mat, idx) => {
    const matchCount = keywords.filter(
      (k) =>
        mat.title.includes(k) ||
        mat.story.includes(k) ||
        (mat.themes && mat.themes.some((t) => t.includes(k)))
    ).length;

    let rank: 'high' | 'medium' | 'low' = 'low';
    let reason = `素材「${mat.title}」記錄了真實的生活經驗，可作為作文情境的鋪陳或補充細節。`;

    if (matchCount >= 2 || (keywords.length <= 2 && matchCount >= 1)) {
      rank = 'high';
      reason = `素材「${mat.title}」與題目的核心意涵高度呼應，適合作為篇章的核心段落重點展開。`;
    } else if (matchCount === 1 || idx === 0) {
      rank = 'medium';
      reason = `素材「${mat.title}」具有延伸發揮的潛力，可從轉折或對比視角切入，增添文章層次。`;
    }

    return {
      materialId: mat.id,
      rank,
      reason,
    };
  });
};
