/**
 * 稿紙與題目 OCR 辨識與校對提示詞 (OCR Text Extraction & Proofreading Prompts)
 */

export const getPromptExtractionPrompt = (): string => {
  return `請辨識圖片中的作文題目與引言說明文字。
請將辨識結果整理為繁體中文 JSON：
{
  "title": "題目名稱",
  "text": "題目的完整引言說明與寫作指引"
}
嚴禁使用表情符號。`;
};

export const getOCRCorrectionPrompt = (rawOCRText: string): string => {
  return `以下是一段從手寫稿紙透過 OCR 辨識出的文字。請在不改變學生原意、語氣與段落結構的前提下，修復明顯的 OCR 錯字或標點符號辨識錯誤。
若有無法確定的文字，保持原文並標記。

【OCR 原始辨識文字】
${rawOCRText}

請直接輸出校正後的繁體中文文章文字，無需附加其他問候語，嚴禁使用表情符號。`;
};
