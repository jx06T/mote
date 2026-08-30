# 專案開發進度規劃與待辦事項 (Roadmap & Issue Tracking)

> 專案版本：V1.0  
> 基準流程：生活素材 -> 素材深化 -> 題目匹配 -> 電子寫作 / 紙本模擬考 -> 分析反饋 -> 弱點追蹤

---

# 1. 核心開發階段里程碑 (Phase 0 - 20)

### Phase 0: 專案基底建置 (Foundation)
- [x] 初始化 Vite + React + TypeScript 專案
- [x] 配置 Tailwind CSS v4 (五層語意色彩 Token，無硬編碼色碼)
- [x] 整合 React Router 與狀態管理
- [x] 整合 Tiptap 基礎套件與擴充
- [x] PWA 基礎設定 (Manifest, Service Worker)
- [x] TypeScript 型別與建置驗證通過 (`npm run build`)

### Phase 1: Cloudflare 後端與資料庫 (Backend Infra)
- [x] Cloudflare Worker Hono 專案架構建立 (`worker/src/index.ts`)
- [x] D1 資料庫 Schema 定義 (`worker/db/schema.sql`)
- [x] R2 存取規劃與多租戶目錄結構
- [x] Gemini AI 服務抽象與雙滾梯備援（SDK + REST + 離線啟發式降級）

### Phase 2: 身份驗證 (Authentication)
- [x] Google OAuth 登入介面 (`LoginPage.tsx`)
- [x] Auth Middleware 與本機開發 Session 驗證

### Phase 3: 主架構與首頁儀表板 (Layout & Dashboard)
- [x] App 佈局骨架 (Mobile 底部導覽列、桌面側邊列、頂部 Header)
- [x] Dashboard 首頁（今日行動入口、最近素材、最近作文、弱點概覽）
- [x] 深淺色主題切換與四層防滾動機制

### Phase 4: 隨手記錄 (Quick Notes)
- [x] 隨手記錄 CRUD API
- [x] 手機快速輸入介面（快捷輸入、Enter 換行、Ctrl+Enter 送出）
- [x] 記錄轉換入口（「深入這件事」對話按鈕）

### Phase 5: 素材深入訪談 (Material Interview)
- [x] AI 引導訪談對話式 Chat UI (`MaterialInterviewView.tsx`)
- [x] 單次單問、避免重複細節挖掘
- [x] 對話總結與素材卡預覽產出
- [x] 使用者修改與確認儲存機制

### Phase 6: 素材庫 (Material Library)
- [x] 素材列表（搜尋、多標籤篩選、排序）
- [x] 素材卡詳情檢視與編輯介面 (`MaterialDetailPage.tsx`)
- [x] 標籤與主題分類管理

### Phase 7: 素材反向推薦 (Material Reverse Search)
- [x] 題目語意反向檢索 (`MaterialReverseSearch.tsx`)
- [x] 推薦度分級（很適合 / 可以考慮 / 關聯較弱）與具體推薦理由
- [x] 一鍵帶入寫作流程

### Phase 8: 題目庫與 OCR (Prompt Library)
- [x] 題目列表與自訂題目建立 (`PromptPage.tsx`)
- [x] 題目相機拍照上傳模擬與 OCR 辨識介面

### Phase 9: 電子作文編輯器與文章庫 (Essay Editor & Library)
- [x] Tiptap 作文編輯器配置 (`EssayEditor.tsx`)
- [x] 文章歷史紀錄與草稿庫管理 (`EssaysPage.tsx`, `EssayListDrawer.tsx`, `EssayCard.tsx`)
- [x] 多篇作文檢視、搜尋、狀態篩選、切換與刪除管理
- [x] 字數即時統計與紙質筆記本排版
- [x] 防抖自動儲存與狀態提示（`✓ 已儲存` / `↻ 儲存中`）

### Phase 10: 寫作歷程追蹤 (Operation History)
- [x] Operation Log 記錄機制 (INSERT, DELETE, REPLACE, AI_ACCEPT)
- [x] 寫作歷程時間軸 UI (`RevisionTimeline.tsx`)

### Phase 11: AI 寫作輔助 (AI Assistance)
- [x] 選字浮動工具列 (`SelectionToolbar.tsx`)
- [x] 六大輔助功能（比喻、仿寫、擴寫、精簡、增加畫面、增加情緒）
- [x] 原文與建議對照面板 (`AIResultModal.tsx`)
- [x] 採用建議與 Operation Log 記錄

### Phase 12: 作文分析 (Essay Analysis)
- [x] 八大寫作維度分析引擎（切題、立意、素材、結構、描寫、語言、情感、結尾）
- [x] 結構化分析報告展示頁面 (`EssayAnalysisView.tsx`)
- [x] 具體問題與下次練習定向建議

### Phase 13: 個人弱點資料庫 (Weakness Profile)
- [x] 弱點自動聚合與趨勢追蹤 (`AnalysisPage.tsx`)
- [x] 儀表板整合弱點提醒

### Phase 14: 紙本模擬考流程 (Paper Mock Exam)
- [x] 模擬考全螢幕專注模式與 50 分鐘倒數計時 (`ExamSession.tsx`)
- [x] 嚴格鎖定（停用 AI、編輯器與素材搜尋）

### Phase 15: 紙本拍照與多頁 OCR (Exam Capture & OCR)
- [x] 多頁拍照與頁面順序確認 (`ExamPhotoUpload.tsx`)
- [x] 作文全文 OCR 辨識與人工校對介面 (`ExamOCRReview.tsx`)

### Phase 16: 模擬考分析 (Mock Exam Analysis)
- [x] 模擬考作答自動觸發 AI 評析與報告產出
- [x] 模擬考歷次紀錄整合 (`ExamPage.tsx`)

### Phase 17: 難字庫與測驗 (Hard Characters)
- [x] 寫作時反白標記難字
- [x] 個人生難字庫與注音測驗卡片 (`VocabularyPage.tsx`, `CharacterQuiz.tsx`)

### Phase 18: PWA 完善與離線體驗 (PWA & Offline)
- [x] Manifest、SVG 圖示與 Service Worker 離線快取 (`public/sw.js`)
- [x] 四層防滾動與觸控分離樣式

### Phase 19: 安全性與可靠度審查 (Security & QA)
- [x] 全端資料隔離與擁有權檢查邏輯
- [x] TypeScript 編譯無錯誤

### Phase 20: 正式發布準備 (Production Release)
- [ ] 設定 Cloudflare 生產環境 D1 / R2 資源 ID
- [ ] 設定 Google OAuth 與 Gemini API Key（參考 [doc/CONFIG_SETUP_GUIDE.md](file:///d:/Document_J/mote/doc/CONFIG_SETUP_GUIDE.md)）
- [ ] 執行正式環境部署 (`npm run worker:deploy`)

---

# 2. V1 核心 30 項 Issues 完成狀態

```text
[x] [001] Project Initialization (Vite + React + TS + Tailwind)
[x] [002] Cloudflare Worker Setup (Wrangler + Entrypoint)
[x] [003] D1 Database Setup (Migrations & Schemas)
[x] [004] R2 Bucket Setup (Storage & Presigned URLs)
[x] [005] Google OAuth Integration (Frontend View & Mock Fallback)
[x] [006] Session Management & Auth Guard
[x] [007] App Layout & Mobile-first Shell
[x] [008] Mobile Bottom Navigation & Routing
[x] [009] Dashboard View & Quick Entrypoints
[x] [010] Quick Note CRUD & Mobile Input
[x] [011] Material Interview Chat Engine (AI Guided)
[x] [012] Material Card Generation & Confirmation
[x] [013] Material Library & Tagging System
[x] [014] Material Reverse Search & Relevance Ranking
[x] [015] Prompt Upload & Camera Capture
[x] [016] Prompt OCR & Manual Editing
[x] [017] Essay Editor (Tiptap Base)
[x] [018] Essay Operation Log & Revision Timeline
[x] [019] AI Writing Assistance Toolbar & Actions
[x] [020] Essay Structured Analysis Engine
[x] [021] Personal Weakness Aggregation & Trends
[x] [022] Paper Mock Exam Mode & Focus Timer
[x] [023] Paper Exam Multi-page Upload
[x] [024] Paper Exam OCR Review & Correction
[x] [025] Mock Exam Analysis & History Integration
[x] [026] Hard Characters Database & Review Quiz
[x] [027] PWA Manifest, Service Worker & Offline Cache
[x] [028] Security Audit & Ownership Checks
[x] [029] Mobile & Tablet UX Quality Assurance
[ ] [030] Production Deployment & Cloudflare Config
```
