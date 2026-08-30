# Mote 高中生 AI 作文訓練工具 — 核心維護指南 (Maintenance Guide)

> 本文件彙整 Mote 系統的核心架構、資料流、權限設定、提示詞維護與標準作業程序，作為專案後續功能迭代、除錯與維護之最高速查手冊。

---

## 1. 系統架構與資料流分層

```text
[ 客戶端 (React + Vite + Tailwind v4 + PWA) ]
      │
      ├─ 訪客試用模式 (Guest Mode)
      │    ├─ 本機儲存: LocalStorage / IndexedDB (ID 前綴: temp_*)
      │    ├─ 檔案快取: 記憶體 Blob / DataURL
      │    └─ 無狀態 AI 服務: 素材訪談、題目反向推薦 (不寫入 D1)
      │
      ├─ 登入無縫同步 (OfflineSyncManager)
      │    └─ 偵測 Google OAuth 登入成功 → 一次性將本機 temp_* 上傳至 D1 → 轉為正式 UUID → 清空本機暫存
      │
      └─ 會員模式 (Authenticated Mode)
           ├─ 身份驗證: Authorization: Bearer <Token> 或 Cookie: mote_session=<Token>
           ├─ 結構化資料: Cloudflare D1 (SQLite) — 14 張資料表，強制 WHERE user_id = ? 多租戶隔離
           ├─ 物件儲存: Cloudflare R2 (稿紙與題目圖檔私有儲存)
           └─ 完整 AI 閉環: AI 六大修辭潤飾、作文八大面向評析、紙本 50 分鐘全真模考
```

---

## 2. 功能開放程度集中配置 (`src/config/features.ts`)

所有功能對未登入訪客的開放門檻，皆集中於 `src/config/features.ts` 中的 `FEATURE_CONFIG` 進行控制：

| 功能 Key | 當前開放狀態 (`guestAllowed`) | 說明 |
| :--- | :--- | :--- |
| `quick_notes` | `true` (開放試用) | 隨手筆記即時記錄 |
| `material_interview` | `true` (開放試用) | AI 追問訪談並產出素材卡 |
| `materials_library` | `true` (開放試用) | 本機素材檢索與標籤篩選 |
| `prompt_search` | `true` (開放試用) | 輸入題目由 AI 匹配素材 |
| `essay_editor` | `true` (開放試用) | 紙質排版、字數統計與草稿儲存 |
| `essay_ai_assist` | **`false` (會員專屬)** | 選取文句進行比喻、仿寫、擴寫等六大修辭建議 |
| `essay_analysis` | **`false` (會員專屬)** | 作文交卷評析與八大面向打分報告 |
| `paper_mock_exam` | **`false` (會員專屬)** | 50 分鐘全真計時與多頁 OCR 校對 |
| `vocabulary_quiz` | `true` (開放試用) | 生難字翻卡注音測驗 |
| `cloud_sync` | **`false` (會員專屬)** | iPad / Mac / 手機多裝置自動同步 |

- **權限閘道元件**：`<FeatureGate feature="...">`（[src/components/auth/FeatureGate.tsx](file:///d:/Document_J/mote/src/components/auth/FeatureGate.tsx)），在未授權時自動呈現鎖定卡片與登入 CTA。

---

## 3. 提示詞模組維護指引 (`worker/src/prompts/`)

所有 AI 提示詞皆已自程式邏輯中徹底抽離，集中於 `worker/src/prompts/` 獨立模組中，方便調優與版本維護：

1. **素材訪談**（[interview.ts](file:///d:/Document_J/mote/worker/src/prompts/interview.ts)）：`getInterviewQuestionSystemPrompt`（單問追問）、`getMaterialSummarySystemPrompt`（素材卡結構化提煉）。
2. **反向推薦**（[reverseSearch.ts](file:///d:/Document_J/mote/worker/src/prompts/reverseSearch.ts)）：`getReverseSearchSystemPrompt`（依題目推薦素材並給出展開理由）。
3. **寫作修辭**（[assist.ts](file:///d:/Document_J/mote/worker/src/prompts/assist.ts)）：`getWritingAssistancePrompt`（比喻、仿寫、擴寫、精簡、加情緒、加畫面）。
4. **作文評析**（[analysis.ts](file:///d:/Document_J/mote/worker/src/prompts/analysis.ts)）：`getEssayAnalysisPrompt`（8 大面向評析、優缺點提煉與下一次練習方針）。
5. **文字辨識**（[ocr.ts](file:///d:/Document_J/mote/worker/src/prompts/ocr.ts)）：`getPromptExtractionPrompt`、`getOCRCorrectionPrompt`。

---

## 4. 後端認證與中介軟體維護 (`worker/src/middleware/auth.ts`)

- **`authMiddleware` (嚴格保護)**：
  - 用於會員專屬端點（寫作輔助 `/api/essays/assist`、評析 `/api/analysis/evaluate`、模考 `/api/exams/*`、D1 寫入 `/api/quick-notes` 等）。
  - 若 Token 無效或未提供，回傳 `HTTP 401 Unauthorized`。
- **`optionalAuthMiddleware` (訪客友善)**：
  - 用於公開或試用端點（訪客素材訪談 `/api/materials/interview`、反向推薦 `/api/materials/reverse-search`、題目列表 `/api/prompts` 等）。
  - 若有 Token 則注入 `userId`；若無 Token 則注入 `userId = null`，絕不偽造測試帳號，由前端 LocalStorage 自主管理儲存。

---

## 5. 樣式與程式碼品質規範

1. **嚴禁使用表情符號 (No Emojis)**：所有 UI 文案、Toast 提示、程式碼註解與產出文件皆不得出現 Unicode Emoji。
2. **嚴禁硬編碼色碼**：全面採用 Tailwind v4 語意化 Token（`bg-page-bg`、`bg-surface`、`bg-surface-elevated`、`border-border-subtle`、`text-text-main`、`text-text-soft`、`text-text-muted`、`text-primary`、`bg-status-success`、`bg-status-warning`、`bg-status-danger`）。
3. **PWA 防滾動與觸控優化**：遵照 `no-scrollbar`、`overscroll-none` 與安全區域 `safe-area-pb` 規範。

---

## 6. 標準開發、驗證與提交 SOP

1. **實作前**：查閱 PRD、技術規格、以及 `AGENTS.md` 規範。
2. **實作後自主驗證**：
   - 執行 `npm run build`，確保 **0 TypeScript 錯誤、0 警告**。
   - 若涉及資料庫變更，執行 `npm run db:migrate:local` 校驗 D1 SQL。
3. **模組化提交**：
   - 使用 Conventional Commits 格式（`feat:`, `fix:`, `refactor:`, `perf:`, `docs:`）。
   - 更新 `walkthrough.md` 成果報告。
   - **嚴禁隨意 Git Push**。
