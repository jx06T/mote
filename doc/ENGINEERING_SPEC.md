# 工程架構與開發技術規範 (Engineering Specification)

> 適用專案：高中生 AI 作文訓練工具 (Mote) V1  
> 技術棧：Vite + React 18/19 + TypeScript + Tailwind CSS + Cloudflare Workers + D1 + R2

---

# 1. 前端架構規範

## 1.1 目錄結構
所有 React 元件統一收納於 `src/components/`，依功能類別劃分子目錄：

```text
src/
├── components/
│   ├── ui/             # 基礎無狀態 UI 元件 (Button, Input, Modal, Sheet, Badge 等)
│   ├── layout/         # 佈局骨架 (AppLayout, AuthLayout, PageContainer 等)
│   ├── navigation/     # 導航元件 (MobileBottomNav, DesktopSidebar, BackButton 等)
│   ├── login/          # 登入相關元件
│   ├── dashboard/      # 首頁儀表板卡片與入口
│   ├── quick-note/     # 隨手記錄輸入與列表
│   ├── materials/      # 素材庫、素材卡、訪談對話介面
│   ├── prompt/         # 題目庫、題目拍照上傳、OCR 預覽
│   ├── editor/         # 電子作文 Tiptap 編輯器、操作紀錄、選字工具列
│   ├── exam/           # 模擬考計時器、多頁拍照上傳、OCR 校對
│   ├── analysis/       # 作文分析報告、面向評分、雷達圖/優缺點卡
│   ├── vocabulary/     # 難字管理與測驗卡片
│   └── common/         # 跨功能共用展示元件
│
├── pages/              # 頁面級元件 (只負責路由、State 裝配、載入資料)
├── hooks/              # 自定義 React Hooks
├── services/           # API 客戶端與 Worker 通訊層 (不放 AI Key)
├── stores/             # 全域狀態管理 (Zustand 或 Context)
├── types/              # TypeScript 型別定義
├── lib/                # 第三方套件封裝 (Tiptap 擴充等)
├── utils/              # 純函式工具
└── app/                # 路由配置與應用入口
```

## 1.2 UI / UX 設計約束
- **Mobile-first 優先**：主要視窗尺寸 375x812, 390x844, 430x932，適配平板 (768x1024) 與桌面。
- **視覺調性**：安靜、專注、具備紙質筆記本質感，避免繁雜後台式密集表格與過量按鈕。
- **編輯器約束**：
  - 採用 Tiptap / ProseMirror。
  - 即時編輯與歷史刪除行為分流處理。
  - AI 建議以彈出式面版呈現「原句」與「建議句」，採用後才寫入，絕不靜默覆蓋。

---

# 2. 後端 Cloudflare Workers 架構

## 2.1 目錄結構
後端置於 `worker/` 目錄：

```text
worker/
├── src/
│   ├── index.ts                # Worker 請求分派入口
│   ├── routes/
│   │   ├── auth.ts             # Google OAuth 驗證與 Session
│   │   ├── users.ts            # 使用者設定與資料
│   │   ├── quickNotes.ts       # 隨手記錄 CRUD
│   │   ├── materials.ts        # 素材庫與訪談對話
│   │   ├── prompts.ts          # 題目管理與 OCR
│   │   ├── essays.ts           # 電子作文與 Operation Log
│   │   ├── exams.ts            # 紙本模擬考與交卷管理
│   │   ├── analysis.ts         # 作文 AI 分析報告
│   │   └── vocabulary.ts       # 難字庫與測驗
│   │
│   ├── services/
│   │   ├── auth/               # Google Token 驗證與 Session 管理
│   │   ├── ai/                 # 各類 AI Prompt 與 Structured Output 解析
│   │   ├── ocr/                # OCR 服務串接 (Workers AI / Cloud Vision 等)
│   │   ├── storage/            # R2 檔案存取與簽章
│   │   └── search/             # 素材關鍵字與語意反向搜尋
│   │
│   ├── db/                     # D1 資料庫查詢函式與遷移檔 (migrations)
│   ├── middleware/             # 認證中介軟體 (AuthGuard)、擁有權檢查、RateLimit
│   ├── schemas/                # Zod 驗證 Schema
│   └── utils/                  # 工具函式
│
├── wrangler.toml               # Cloudflare 配置
└── tsconfig.json
```

## 2.2 D1 資料表 Schema 規範

```sql
-- 使用者與 Session
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 隨手記錄
CREATE TABLE quick_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, converted, archived
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 素材訪談對話與素材庫
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quick_note_id TEXT,
    status TEXT DEFAULT 'in_progress', -- in_progress, completed, abandoned
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE conversation_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE materials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    story TEXT NOT NULL,
    people_json TEXT,
    time_desc TEXT,
    location_desc TEXT,
    scene_desc TEXT,
    dialogue_desc TEXT,
    emotion_desc TEXT,
    reflection_desc TEXT,
    themes_json TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE material_tags (
    material_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY(material_id, tag_id),
    FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 題目庫
CREATE TABLE prompts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    raw_text TEXT NOT NULL,
    corrected_text TEXT,
    prompt_type TEXT,
    image_r2_path TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 電子作文與寫作歷史 Operation Log
CREATE TABLE essays (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt_id TEXT,
    title TEXT,
    current_content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, submitted, analyzed
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE essay_operations (
    id TEXT PRIMARY KEY,
    essay_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- INSERT, DELETE, REPLACE, AI_SUGGESTION, AI_ACCEPT
    position INTEGER,
    length INTEGER,
    old_content TEXT,
    new_content TEXT,
    source TEXT, -- user, ai
    created_at INTEGER NOT NULL,
    FOREIGN KEY(essay_id) REFERENCES essays(id) ON DELETE CASCADE
);

-- 作文分析報告
CREATE TABLE essay_analysis (
    id TEXT PRIMARY KEY,
    essay_id TEXT,
    exam_submission_id TEXT,
    user_id TEXT NOT NULL,
    overall_summary TEXT NOT NULL,
    scores_json TEXT NOT NULL, -- 切題, 立意, 素材, 結構, 描寫, 語言, 情感, 結尾
    strengths_json TEXT NOT NULL,
    weaknesses_json TEXT NOT NULL,
    next_practice_advice TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 紙本模擬考
CREATE TABLE exam_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    status TEXT DEFAULT 'in_progress', -- in_progress, submitted, time_out, canceled
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE exam_pages (
    id TEXT PRIMARY KEY,
    exam_session_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    r2_image_path TEXT NOT NULL,
    ocr_raw_text TEXT,
    ocr_confidence REAL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

CREATE TABLE exam_submissions (
    id TEXT PRIMARY KEY,
    exam_session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    final_essay_text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE
);

-- 個人弱點與難字庫
CREATE TABLE weaknesses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    dimension TEXT NOT NULL, -- 立意, 切題, 結構, 描寫, 語言, 議論, 結尾, 轉折, 素材, 字詞
    description TEXT NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    recent_trend TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE hard_characters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_text TEXT NOT NULL,
    zhuyin TEXT,
    source_essay_id TEXT,
    mastery_level INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI 用量監控
CREATE TABLE ai_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    model TEXT NOT NULL,
    request_type TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 2.3 R2 儲存規範
- 目錄依使用者 ID 嚴格劃分：
  - `{userId}/prompts/{promptId}/original.jpg`
  - `{userId}/exams/{examId}/page-001.jpg`
  - `{userId}/attachments/`
- 前端上傳採用 Presigned URL 或經由 Worker 端點校驗 MIME Type 與大小限制（最大 10MB）。

---

# 3. 安全與權限控制規範

1. **嚴格所有權檢查**：
   - 每次資料查詢或更新時，SQL 均需綁定 `WHERE user_id = ?`。
2. **API 金鑰絕不洩漏**：
   - Google OAuth Client Secret 與 AI Provider API Keys 僅保存在 Cloudflare Worker Secrets 中。
3. **無表情符號原則**：
   - 所有系統回傳訊息、UI 字串、錯誤提示與日誌，均不使用表情符號。
