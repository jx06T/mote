---
name: auth-guest-permissions
description: >-
  Mote 訪客試用模式與會員登入帳號之權限分離、限制規範、提示導引與同步機制指引。
  涵蓋零摩擦試用哲學、本機 IndexedDB/LocalStorage 與雲端 D1/R2 雙軌架構、權限對照矩陣、
  後端安全隔離、前端 UI 提示與導引元件 (GuestNoticeBanner, AuthModal)、以及登入自動無縫同步資料流 (OfflineSyncManager)。
triggers:
  - 調整或審查訪客 (Guest) 與登入會員 (Auth) 權限邊界
  - 修改認證中介軟體 (authMiddleware / optionalAuthMiddleware)
  - 開發或維護 OfflineSyncManager 本機至雲端同步邏輯
  - 調整訪客提示橫幅 (GuestNoticeBanner) 與登入提示
  - 審查多租戶資料隔離與後端 API Rate Limit 機制
---

# Mote 訪客與登入帳號權限分離、限制規範與提示機制指引

---

## 1. 核心架構理念與設計哲學

Mote 作為高中生作文訓練與生活素材累積工具，在身分與權限設計上採取**「零摩擦試用 (Zero-Friction Trial)」**與**「本機優先、平滑升級 (Local-First & Seamless Upgrade)」**之核心架構：

```text
訪客試用 (Guest Mode)                       登入會員 (Authenticated Mode)
────────────────────────                    ──────────────────────────────
儲存層: 瀏覽器 LocalStorage / IndexedDB       儲存層: Cloudflare D1 (SQLite) + R2
檔案層: 本機 DataURL / Blob 快取             檔案層: R2 Object Storage (稿紙私有儲存)
AI 服務: 訪客即時分析與引導                  AI 服務: 雲端 AI 串接與多篇弱點聚合
識別碼: temp_* 暫時 ID                       識別碼: UUID 永久 ID
資料隔離: 客戶端獨立儲存 (不共用後端)         資料隔離: user_id 強制多租戶隔離
```

### 設計原則
1. **零門檻即開即用**：訪客進入應用程式後，無需強制註冊或登入即可直接記錄隨手筆記、進行 AI 深入素材訪談、使用 Tiptap 編輯器寫作與 AI 六大修辭潤飾、進行紙本模擬考計時與生難字測驗。
2. **雙軌資料隔離**：
   - 訪客資料完全儲存於客戶端本機，不同訪客之間在不同裝置上各自獨立，絕不共用後端單一帳號資料。
   - 會員資料儲存於 Cloudflare D1 與 R2，並透過 JWT 嚴格綁定 `user_id`，確保租戶隔離。
3. **無感平滑升級 (Seamless Upgrade)**：當訪客決定登入 Google 帳號時，系統自動啟動 `OfflineSyncManager`，將本機所有的隨手記錄、素材卡、作文與生難字一次性無縫遷移至雲端 D1 資料庫，無需手動重新匯出或匯入。

---

## 2. 訪客 vs. 登入會員 權限對照矩陣

| 功能模組 / 操作項目 | 訪客試用模式 (Guest) | 登入會員 (Authenticated) | 後端端點與安全防護機制 |
| :--- | :--- | :--- | :--- |
| **隨手筆記 (Quick Notes)** | 讀寫本機儲存 (ID: `temp_*`) | 查詢與存入 D1 資料庫 | `GET/POST/DELETE /api/quick-notes`<br>`optionalAuthMiddleware` / `authMiddleware` |
| **素材深入訪談 (Interview)** | 本機對話並產出素材卡 | 對話紀錄與素材卡存入 D1 | `POST /api/materials/interview` (支援訪客無狀態調用) |
| **個人素材庫 (Materials)** | 本機儲存，支援標籤與搜尋 | D1 多租戶隔離儲存與雲端檢索 | `GET/POST/DELETE /api/materials`<br>`optionalAuthMiddleware` (未登入回傳空陣列) |
| **題目反向素材推薦** | 依本機素材庫進行推薦 | 依雲端 D1 素材庫進行語意檢索 | `POST /api/materials/reverse-search` |
| **電子作文與歷程 (Essays)** | 本機儲存草稿與 Operation Log | 雲端 D1 持久化歷程與字數統計 | `GET/POST /api/essays` |
| **AI 寫作修辭輔助 (Assist)** | 即時呼叫 Gemini 修辭輔助 | 即時呼叫 Gemini 並記錄至雲端歷程 | `POST /api/essays/assist` |
| **作文多面向評析 (Analysis)** | 即時評析並暫存本機報告 | D1 儲存評析並聚合至個人弱點庫 | `POST /api/analysis/evaluate` |
| **紙本全真模擬考 (Exam)** | 本機計時、拍照預覽與校對 | D1 記錄 Session、稿紙與評析 | `GET/POST /api/exams/*` |
| **個人生難字庫與測驗** | 本機生難字庫與翻卡測驗 | D1 持久化生難字與跨裝置熟悉度 | `GET/POST/DELETE /api/vocabulary` |
| **個人寫作弱點聚合** | 前端計算最近評析弱點 | D1 跨篇章 SQL 聚合與趨勢分析 | `GET /api/analysis/weaknesses` |
| **跨裝置即時同步** | 不支援 (限於當前瀏覽器) | 支援 iPad、Mac、iPhone 跨裝置同步 | 雲端 D1 + Google OAuth Session |
| **資料手動匯出** | 支援下載本機 JSON 備份檔 | 支援下載雲端與本機完整備份 | 前端本機資料導出 |

---

## 3. 前端提示、警告與導引機制 (UI Prompts)

### 3.1 全站頂部提示橫幅 (`GuestNoticeBanner`)
- **觸發位置**：Dashboard 首頁、素材庫、作文編輯器頂部。
- **呈現條件**：使用者未登入 (`!currentUser`) 且未於當前工作階段關閉提示 (`sessionStorage`)。
- **文案**：
  > **本機訪客試用模式 (未登入)**  
  > 你的生活素材、寫作草稿與評析報告僅暫存於此瀏覽器。登入 Google 帳號即可啟用 iPad / Mac 跨裝置雲端自動備份與同步。
- **互動行為**：
  - 點擊「登入 / 註冊」：開啟登入 Modal 或跳轉 `/login`。
  - 點擊「關閉」：寫入 `sessionStorage.setItem('mote_guest_banner_dismissed', 'true')`。

### 3.2 登入與功能權限對照彈窗 (`AuthModal`)
- 呈現訪客試用與會員登入的清楚功能對照表（本機暫存 vs. 跨裝置雲端同步、自動備份、多篇弱點深度追蹤）。

---

## 4. 本機至雲端無縫同步機制 (OfflineSyncManager)

```text
[使用者完成 Google 登入]
          │
          ▼
[前端偵測 wasGuest && isNowLoggedIn]
          │
          ▼
[啟動 OfflineSyncManager.syncToCloud()]
          ├─ 1. 讀取本機所有 temp_* 隨手筆記 → POST /api/quick-notes → 轉為雲端 ID
          ├─ 2. 讀取本機所有 temp_* 素材卡 → POST /api/materials → 轉為雲端 ID
          ├─ 3. 讀取本機所有 temp_* 電子作文 → POST /api/essays → 轉為雲端 ID
          ├─ 4. 讀取本機所有 temp_* 生難字 → POST /api/vocabulary → 轉為雲端 ID
          ├─ 5. 清除本機已同步之暫存資料
          ▼
[彈出 Toast 提示]：「已成功將本機素材與作文無縫同步至雲端！」
```

---

## 5. 後端認證與中介軟體設計 (authMiddleware & optionalAuthMiddleware)

1. **`authMiddleware` (嚴格保護)**：
   - 檢查 `Authorization: Bearer <TOKEN>` 或 `Cookie: mote_session=<TOKEN>`。
   - 若無效，回傳 `HTTP 401 Unauthorized` (`{ error: 'Unauthorized', message: '請先登入帳號' }`)。
2. **`optionalAuthMiddleware` (訪客友善 / 雙軌支援)**：
   - 若有 Token 則注入 `userId`；若無 Token 則 `userId = null`，允許訪客調用無狀態 AI 功能，由前端自主管理儲存，絕不污染其他會員資料。
