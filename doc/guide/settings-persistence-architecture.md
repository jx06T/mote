---
name: settings-persistence-architecture
description: >-
  Mote 全系統狀態與設定持久化架構指引。涵蓋前端 localStorage (ThemeContext, AppPreferences, Unified Storage)、
  sessionStorage、URL 狀態同步，以及後端 Cloudflare D1 (SQLite)、R2 物件儲存與 KV 快取的完整持久化邏輯與跨層同步機制。
triggers:
  - 調整或擴充全域持久化設定 (mote_theme, mote_preferences)
  - 調整使用者偏好、外觀風格或寫作模式持久化邏輯
  - 修改 Cloudflare D1 表結構或 R2 稿件圖檔命名空間
  - 審查跨分頁資料同步、登入離線資料遷移 (OfflineSyncManager) 資料流
---

# Mote 全系統設定與狀態持久化架構指引

---

## 1. 持久化全景架構與分層模型

Mote 採用**「多層次、本機優先、雲端雙軌」**的持久化架構，將應用程式中的所有設定、身分憑證、外觀偏好、離線資料庫與雲端實體精確分流至最適儲存媒介：

```
應用程式全域狀態與設定 (Mote State & Settings)
  │
  ├── [前端預載防閃爍層 (HTML Pre-hydration)]
  │     └── index.html inline script ── DOM 渲染前即時套用 'dark' class 與 theme-color
  │
  ├── [前端本機持久化層 (Client-Side Storage - src/services/storage.ts)]
  │     ├── localStorage
  │     │     ├── mote_theme ──────────── 主題外觀模式 ('light' | 'dark' | 'system')
  │     │     ├── mote_preferences ────── UI 操作與編輯偏好 (darkMode, fontSize, focusMode)
  │     │     ├── mote_token ──────────── JWT 身分憑證 (供 API 與驗證攔截器讀取)
  │     │     ├── mote_user ───────────── 使用者個人資料快取 (User 物件)
  │     │     ├── mote_client_id ──────── 客戶端唯一節點識別碼 UUID
  │     │     ├── mote_quick_notes ────── 訪客隨手筆記暫存清單
  │     │     ├── mote_materials ──────── 訪客生活素材卡暫存清單
  │     │     ├── mote_essays ─────────── 訪客作文草稿暫存清單
  │     │     ├── mote_essay_ops_* ────── 訪客作文修辭與編輯歷史操作紀錄
  │     │     ├── mote_vocabulary ─────── 訪客生難字庫暫存清單
  │     │     ├── mote_prompts ────────── 訪客自訂題目暫存清單
  │     │     ├── mote_exams ──────────── 訪客模擬考紀錄暫存清單
  │     │     └── mote_weaknesses ─────── 訪客寫作特徵與弱點快取
  │     │
  │     ├── sessionStorage
  │     │     └── mote_guest_banner_dismissed ─ 訪客橫幅關閉記憶
  │     │
  │     └── URL / History 狀態
  │           ├── Path: /materials/:id, /exams/session ── 路由與檢視狀態
  │           └── Query: ?promptTitle=...&materialId=... ── 跨頁面傳遞題目與參考素材
  │
  └── [後端邊緣雲端持久化層 (Edge Cloud Storage)]
        ├── Cloudflare D1 (SQLite) — 14 張資料表，強制 WHERE user_id = ? 多租戶隔離
        │     ├── users ─────────────── 會員基本資料表 (Google OAuth)
        │     ├── quick_notes ───────── 隨手筆記核心資料表
        │     ├── materials ─────────── 生活素材卡核心資料表 (6W2H 結構)
        │     ├── essays ────────────── 作文核心資料表 (含當前內文與字數)
        │     ├── essay_operations ──── 作文歷史修改歷程 (AI 採納/重寫)
        │     ├── essay_analyses ────── 作文 8 大面向評析報告
        │     ├── prompt_items ──────── 題目庫資料表 (官方題庫與自訂題)
        │     ├── exam_sessions ─────── 紙本模擬考紀錄 (50分鐘倒數與狀態)
        │     ├── hard_characters ───── 生難字庫 (字詞、注音、精熟度等級)
        │     └── writing_weaknesses ── 個人寫作特徵與弱點聚合分析
        │
        ├── Cloudflare R2 (Object Storage)
        │     └── exams/${userId}/${examSessionId}_p${page}.jpg ── 模擬考紙本手寫稿私有圖檔
        │
        └── Cloudflare Secrets
              └── JWT_SECRET, GEMINI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

---

## 2. 第一層：全域主題與偏好持久化 (`mote_theme` & `ThemeContext`)

### 2.1 儲存機制與配置
前端透過 `src/context/ThemeContext.tsx` 集中管理外觀模式，支援 `light`、`dark` 與 `system` 三種模式，並自動同步至 `storage.local`（鍵名 `mote_theme` 與 `mote_preferences`）。

實作位置：[`src/context/ThemeContext.tsx`](file:///d:/Document_J/mote/src/context/ThemeContext.tsx)

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppPreferences {
  darkMode?: boolean;
  fontSize?: 'normal' | 'large';
  editorFocusMode?: boolean;
}
```

### 2.2 防白屏閃爍 (FOUC) 預載腳本
在 `index.html` 的 `<head>` 中注入輕量 inline 腳本，在瀏覽器解析 HTML 時立即讀取 `mote_theme` 並為 `document.documentElement` 加入 `dark` class，同時設定 `<meta name="theme-color">`。

實作位置：[`index.html`](file:///d:/Document_J/mote/index.html)

---

## 3. 第二層：統一儲存抽象層 (`src/services/storage.ts`)

為了避免各組件直接散落呼叫原生 `localStorage` / `sessionStorage` 導致鍵名不一致或 JSON parse 異常崩潰，系統建立了統一儲存抽象層：

實作位置：[`src/services/storage.ts`](file:///d:/Document_J/mote/src/services/storage.ts)

### 3.1 集中鍵名定義 (`STORAGE_KEYS` & `SESSION_KEYS`)
- **`STORAGE_KEYS.THEME`**：`'mote_theme'`
- **`STORAGE_KEYS.PREFERENCES`**：`'mote_preferences'`
- **`STORAGE_KEYS.TOKEN`**：`'mote_token'`
- **`STORAGE_KEYS.USER`**：`'mote_user'`
- **`STORAGE_KEYS.CLIENT_ID`**：`'mote_client_id'`
- **`STORAGE_KEYS.QUICK_NOTES`**：`'mote_quick_notes'`
- **`STORAGE_KEYS.MATERIALS`**：`'mote_materials'`
- **`STORAGE_KEYS.ESSAYS`**：`'mote_essays'`
- **`STORAGE_KEYS.ESSAY_OPS_PREFIX`**：`'mote_essay_ops_'`
- **`STORAGE_KEYS.VOCABULARY`**：`'mote_vocabulary'`
- **`STORAGE_KEYS.PROMPTS`**：`'mote_prompts'`
- **`STORAGE_KEYS.EXAMS`**：`'mote_exams'`
- **`STORAGE_KEYS.WEAKNESSES`**：`'mote_weaknesses'`
- **`SESSION_KEYS.GUEST_BANNER_DISMISSED`**：`'mote_guest_banner_dismissed'`

### 3.2 統一儲存輔助介面
- `storage.local.get<T>(key, default)`：型別安全與防崩潰 JSON 讀取。
- `storage.local.set<T>(key, value)`：安全序列化與寫入。
- `storage.local.getString(key, default)` / `storage.local.setString(key, value)`：純字串存取。
- `storage.local.remove(key)`：安全移除。
- `storage.session.*`：SessionStorage 封裝。
- `storage.exportBackup()`：全量匯出本機資料 JSON 備份。
- `storage.clearGuestData()`：登出時安全清空所有訪客暫存資料。

---

## 4. 第三層：跨層資料流與登入同步 (`OfflineSyncManager`)

### 4.1 訪客升級登入遷移流程 (`OfflineSyncManager.syncToCloud`)
當使用者於訪客模式下累積筆記、素材、草稿與生難字，並於後續完成 Google OAuth 登入時，系統自動觸發無縫同步：

```text
[使用者於訪客模式累積 temp_* 暫存項目]
                   │
                   ▼ (完成 Google OAuth 登入)
[AuthContext.login 觸發]
                   │
                   ▼
[OfflineSyncManager.syncToCloud()]
   │
   ├── 1. 讀取 storage.local 中的 mote_quick_notes ── 呼叫 QuickNotesAPI.create 上傳 ── 清除本機暫存
   ├── 2. 讀取 storage.local 中的 mote_materials ─── 呼叫 MaterialsAPI.save 上傳 ─── 清除本機暫存
   ├── 3. 讀取 storage.local 中的 mote_essays ────── 呼叫 EssaysAPI.save 上傳 ────── 清除本機暫存
   └── 4. 讀取 storage.local 中的 mote_vocabulary ── 呼叫 VocabularyAPI.add 上傳 ─── 清除本機暫存
```

### 4.2 會員登出清理流程 (`AuthContext.logout`)
會員登出時執行以下持久化清理步驟：
1. `storage.local.remove(STORAGE_KEYS.USER)`
2. `storage.local.remove(STORAGE_KEYS.TOKEN)`
3. `storage.clearGuestData()`：清空所有訪客暫存與歷程紀錄。
4. 重設 React Context 身分為 `null`，重返乾淨訪客試用狀態。

---

## 5. 持久化鍵值與模組總覽速查表

| 持久化層級 | 媒介 / 技術 | 鍵名 / 資料庫欄位 | 資料格式 | 負責元件 / 模組 |
| :--- | :--- | :--- | :--- | :--- |
| **主題模式** | `localStorage` | `mote_theme` | String ('light'/'dark'/'system') | `src/context/ThemeContext.tsx`, `index.html` |
| **偏好設定** | `localStorage` | `mote_preferences` | JSON Object (AppPreferences) | `src/context/ThemeContext.tsx` |
| **身分憑證** | `localStorage` | `mote_token` | String (JWT) | `src/services/api.ts`, `AuthContext.tsx` |
| **使用者快取** | `localStorage` | `mote_user` | JSON Object (User) | `src/context/AuthContext.tsx` |
| **節點識別** | `localStorage` | `mote_client_id` | String (UUID) | `src/services/storage.ts` |
| **訪客筆記** | `localStorage` | `mote_quick_notes` | JSON Array (QuickNote[]) | `api.ts`, `QuickNotesPage.tsx` |
| **訪客素材** | `localStorage` | `mote_materials` | JSON Array (Material[]) | `api.ts`, `MaterialsPage.tsx` |
| **訪客作文** | `localStorage` | `mote_essays` | JSON Array (Essay[]) | `api.ts`, `EssayEditorPage.tsx` |
| **編輯操作歷史** | `localStorage` | `mote_essay_ops_{id}` | JSON Array (Operation[]) | `api.ts`, `EssayEditor.tsx` |
| **訪客生字** | `localStorage` | `mote_vocabulary` | JSON Array (HardCharacter[]) | `api.ts`, `VocabularyPage.tsx` |
| **訪客題目** | `localStorage` | `mote_prompts` | JSON Array (PromptItem[]) | `api.ts`, `PromptPage.tsx` |
| **訪客橫幅** | `sessionStorage` | `mote_guest_banner_dismissed` | String ('true') | `GuestNoticeBanner.tsx` |
| **會員資料** | Cloudflare D1 | `users` | SQL Row | `worker/src/routes/auth.ts` |
| **作文核心** | Cloudflare D1 | `essays`, `essay_operations` | SQL Rows | `worker/src/routes/essays.ts` |
| **素材卡核心** | Cloudflare D1 | `materials` | SQL Row | `worker/src/routes/materials.ts` |
| **模考圖檔** | Cloudflare R2 | `exams/${userId}/${sessionId}_p${page}.jpg` | Binary Image (JPEG) | `worker/src/routes/exams.ts` |
