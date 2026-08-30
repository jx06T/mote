# 專案開發進度規劃與待辦事項 (Roadmap & Issue Tracking)

> 專案版本：V1.0  
> 基準流程：生活素材 -> 素材深化 -> 題目匹配 -> 電子寫作 / 紙本模擬考 -> 分析反饋 -> 弱點追蹤

---

# 1. 核心開發階段里程碑 (Phase 0 - 20)

### Phase 0: 專案基底建置 (Foundation)
- [ ] 初始化 Vite + React + TypeScript 專案
- [ ] 配置 Tailwind CSS (遵循低飽和/柔和設計規範)
- [ ] 整合 React Router 與狀態管理
- [ ] 整合 Tiptap 基礎套件
- [ ] PWA 基礎設定 (Manifest, Service Worker)
- [ ] ESLint, Prettier 與 TypeScript 型別檢查規範

### Phase 1: Cloudflare 後端與資料庫 (Backend Infra)
- [ ] Cloudflare Worker 專案初始化
- [ ] D1 資料庫綁定與初始遷移檔執行
- [ ] R2 Bucket 建立與存取安全設定
- [ ] 本地端開發模擬環境 (Wrangler dev)
- [ ] 健康檢查與基礎 API 路由

### Phase 2: Google 身份驗證 (Authentication)
- [ ] Google OAuth 登入流程整合
- [ ] Worker OAuth 回呼處理與身分驗證
- [ ] Session 簽發與 HTTP-only Cookie 儲存
- [ ] 前端 AuthGuard 與自動續期/登出
- [ ] 使用者多租戶隔離測試

### Phase 3: 主架構與首頁儀表板 (Layout & Dashboard)
- [ ] App 佈局骨架 (Mobile 底部導覽列、桌面側邊列)
- [ ] Dashboard 首頁（今日行動入口、最近素材、最近作文、弱點概覽）
- [ ] 空狀態 (Empty States) 與載入骨架屏 (Skeletons)

### Phase 4: 隨手記錄 (Quick Notes)
- [ ] 隨手記錄 D1 CRUD API
- [ ] 手機快速輸入介面（開啟自動 Focus、防抖自動保存）
- [ ] 記錄轉換入口（「深入這件事」按鈕）

### Phase 5: 素材深入訪談 (Material Interview)
- [ ] AI 訪談 Prompt 設計（單次單問、避免重複、細節挖掘）
- [ ] 訪談對話式 Chat UI
- [ ] 對話總結與素材卡預覽產出
- [ ] 使用者修改與確認儲存機制

### Phase 6: 素材庫 (Material Library)
- [ ] 素材列表（搜尋、多標籤篩選、排序）
- [ ] 素材卡詳情檢視與編輯介面
- [ ] 標籤管理系統

### Phase 7: 素材反向推薦 (Material Reverse Search)
- [ ] 題目語意解析與關鍵字萃取
- [ ] 個人素材關聯度排序演算法
- [ ] 推薦原因展示（很適合 / 可以考慮 / 關聯較弱）
- [ ] 一鍵帶入寫作流程

### Phase 8: 題目庫與 OCR (Prompt Library)
- [ ] 題目相機拍照與上傳 R2
- [ ] 題目文字 OCR 辨識
- [ ] OCR 結果人工校正與題目建檔

### Phase 9: 電子作文編輯器 (Essay Editor)
- [ ] Tiptap 作文編輯器配置
- [ ] 字數統計與即時狀態列
- [ ] 本機草稿暫存與雲端 Debounce 自動儲存
- [ ] 移動端虛擬鍵盤適配

### Phase 10: 寫作歷程追蹤 (Operation History)
- [ ] Operation Log 記錄機制 (INSERT, DELETE, REPLACE)
- [ ] 歷史刪除保護邏輯
- [ ] 寫作歷程時間軸與版本對比 UI

### Phase 11: AI 寫作輔助 (AI Assistance)
- [ ] 選字浮動工具列 (Selection Toolbar)
- [ ] 六大輔助功能（比喻、仿寫、擴寫、精簡、增加畫面、增加情緒）
- [ ] 原文與建議對照面板
- [ ] 採用/放棄操作與記錄

### Phase 12: 作文分析 (Essay Analysis)
- [ ] 交卷流程與狀態鎖定
- [ ] 多維度 AI 分析 Prompt（切題、立意、素材、結構、描寫、語言、情感、結尾）
- [ ] 結構化分析報告展示頁面
- [ ] 具體問題與下次訓練建議產出

### Phase 13: 個人弱點資料庫 (Weakness Profile)
- [ ] 弱點自動聚合與分類
- [ ] 寫作特徵趨勢圖（擅長項目 vs 需加強項目）
- [ ] 儀表板整合弱點提醒

### Phase 14: 紙本模擬考流程 (Paper Mock Exam)
- [ ] 模擬考倒數計時介面（全螢幕專注、禁止 AI 與編輯器）
- [ ] 交卷確認與超時處理
- [ ] 模擬考狀態回復

### Phase 15: 紙本拍照與多頁 OCR (Exam Capture & OCR)
- [ ] 手機多頁拍照與順序整理介面
- [ ] 圖片旋轉、裁切與 R2 儲存
- [ ] 作文全文 OCR 辨識與低信心字標示
- [ ] 人工確認與文字校正流程

### Phase 16: 模擬考分析 (Mock Exam Analysis)
- [ ] OCR 成果作文分析
- [ ] 模擬考歷次成績與弱點整合

### Phase 17: 難字庫與測驗 (Hard Characters)
- [ ] 難字標記與個人生難字庫
- [ ] 注音與語境複習測驗

### Phase 18: PWA 完善與離線體驗 (PWA & Offline)
- [ ] 離線 App Shell 與本機暫存
- [ ] 網路斷線提示與連線自動同步

### Phase 19: 安全性與可靠度審查 (Security & QA)
- [ ] 全端所有權驗證與安全性審查
- [ ] Token 用量與 API 速率限制防護
- [ ] 移動端真機相機與鍵盤相容性測試

### Phase 20: 正式發布 (Production Release)
- [ ] 域名、HTTPS 與 Cloudflare 部署
- [ ] 生產環境 Secrets 與資料庫遷移
- [ ] 產品端到端驗收測試

---

# 2. V1 核心 30 項 Issues 清單

```text
[001] Project Initialization (Vite + React + TS + Tailwind)
[002] Cloudflare Worker Setup (Wrangler + Entrypoint)
[003] D1 Database Setup (Migrations & Schemas)
[004] R2 Bucket Setup (Storage & Presigned URLs)
[005] Google OAuth Integration
[006] Session Management & Auth Guard
[007] App Layout & Mobile-first Shell
[008] Mobile Bottom Navigation & Routing
[009] Dashboard View & Quick Entrypoints
[010] Quick Note CRUD & Mobile Input
[011] Material Interview Chat Engine (AI Guided)
[012] Material Card Generation & Confirmation
[013] Material Library & Tagging System
[014] Material Reverse Search & Relevance Ranking
[015] Prompt Upload & Camera Capture
[016] Prompt OCR & Manual Editing
[017] Essay Editor (Tiptap Base)
[018] Essay Operation Log & Revision Timeline
[019] AI Writing Assistance Toolbar & Actions
[020] Essay Structured Analysis Engine
[021] Personal Weakness Aggregation & Trends
[022] Paper Mock Exam Mode & Focus Timer
[023] Paper Exam Multi-page Upload
[024] Paper Exam OCR Review & Correction
[025] Mock Exam Analysis & History Integration
[026] Hard Characters Database & Review Quiz
[027] PWA Manifest, Service Worker & Offline Cache
[028] Security Audit & Ownership Checks
[029] Mobile & Tablet UX Quality Assurance
[030] Production Deployment & Cloudflare Config
```

---

# 3. 完成定義 (Definition of Done)

單一功能必須符合以下全部標準方可標記為 Done：
1. **UI/UX**：具備 Mobile-first 介面，符合安靜專注視覺調性，無表情符號。
2. **API/後端**：通過 Cloudflare Worker 實作，包含嚴格的 `user_id` 擁有權驗證。
3. **資料持久化**：D1 欄位齊全，支援資料遷移與串聯。
4. **狀態覆蓋**：完整具備 Loading、Error、Empty State 與 Retry 機制。
5. **程式碼品質**：通過 TypeScript 型別檢查與 ESLint，無未處理的例外。
