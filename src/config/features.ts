/**
 * Mote 系統功能權限矩陣與開放程度配置 (Feature Gating Configuration)
 * 
 * 可在此靈活設定各項功能是否開放給未登入訪客 (guestAllowed)，
 * 隨時調整試用門檻與升級提示文案。
 */

export type FeatureKey =
  | 'quick_notes'
  | 'material_interview'
  | 'materials_library'
  | 'prompt_search'
  | 'essay_editor'
  | 'essay_ai_assist'
  | 'essay_analysis'
  | 'paper_mock_exam'
  | 'vocabulary_quiz'
  | 'cloud_sync';

export interface FeatureConfig {
  guestAllowed: boolean;
  title: string;
  badgeText: string;
  description: string;
  upgradePrompt: string;
}

export const FEATURE_CONFIG: Record<FeatureKey, FeatureConfig> = {
  quick_notes: {
    guestAllowed: true,
    title: '隨手筆記',
    badgeText: '本機試用',
    description: '快速記錄日常生活中的微小觀察與畫面',
    upgradePrompt: '登入 Google 帳號即可啟用 iPad / Mac 跨裝置雲端備份。',
  },
  material_interview: {
    guestAllowed: true,
    title: '素材深入訪談',
    badgeText: '本機試用',
    description: 'AI 追問引導並自動產出結構化生活素材卡',
    upgradePrompt: '登入後可永久儲存至個人雲端素材庫。',
  },
  materials_library: {
    guestAllowed: true,
    title: '個人素材庫',
    badgeText: '本機試用',
    description: '素材檢索、主題標籤篩選與故事詳情檢視',
    upgradePrompt: '登入後可跨裝置同步個人所有寫作素材。',
  },
  prompt_search: {
    guestAllowed: true,
    title: '題目反向推薦',
    badgeText: '本機試用',
    description: '輸入題目後由 AI 媒合個人素材庫中合適的故事',
    upgradePrompt: '登入後可使用完整自訂題目庫。',
  },
  essay_editor: {
    guestAllowed: true,
    title: '電子作文基礎編輯',
    badgeText: '本機試用',
    description: '紙質筆記本版面排版、即時字數統計與草稿儲存',
    upgradePrompt: '登入後可解鎖 AI 修辭潤飾與多面向深度評析。',
  },
  essay_ai_assist: {
    guestAllowed: false, // 暫不開放訪客 (會員專屬)
    title: 'AI 寫作修辭輔助',
    badgeText: '會員專屬',
    description: '六大修辭面向（比喻、仿寫、擴寫、精簡、加情緒、加畫面）AI 建議',
    upgradePrompt: '此功能為會員專屬。登入 Google 帳號即可免費啟用 AI 寫作輔助與修辭潤飾！',
  },
  essay_analysis: {
    guestAllowed: false, // 暫不開放訪客 (會員專屬)
    title: '八大維度作文評析',
    badgeText: '會員專屬',
    description: 'AI 深入多面向打分、優缺點提煉與個人弱點追蹤',
    upgradePrompt: '此功能為會員專屬。登入 Google 帳號即可解鎖八大面向評析與弱點累積追蹤！',
  },
  paper_mock_exam: {
    guestAllowed: false, // 暫不開放訪客 (會員專屬)
    title: '紙本模擬考',
    badgeText: '會員專屬',
    description: '全真 50 分鐘計時、多頁稿紙拍照 OCR 與評析報告',
    upgradePrompt: '紙本模擬考與多頁 OCR 為會員專屬。登入 Google 帳號即可免費開啟全真模擬考場！',
  },
  vocabulary_quiz: {
    guestAllowed: true,
    title: '生難字庫與測驗',
    badgeText: '本機試用',
    description: '個人生難字庫與注音翻卡自我測驗',
    upgradePrompt: '登入後可跨裝置同步生難字熟悉度等級。',
  },
  cloud_sync: {
    guestAllowed: false, // 會員專屬
    title: '跨裝置雲端同步',
    badgeText: '會員專屬',
    description: 'iPad / Mac / iPhone 多端即時資料自動同步',
    upgradePrompt: '登入 Google 帳號即可免費啟用雲端自動備份與跨裝置同步。',
  },
};

/**
 * 檢查指定功能是否允許當前使用者存取
 */
export const canAccessFeature = (
  featureKey: FeatureKey,
  isLoggedIn: boolean
): boolean => {
  if (isLoggedIn) return true;
  return FEATURE_CONFIG[featureKey]?.guestAllowed ?? false;
};
