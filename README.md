# Mote — 高中生 AI 作文訓練工具

> 一個幫助高中生長期累積生活素材、練習思考與寫作，並追蹤個人弱點的作文訓練系統。

---

## 產品核心哲學

1. **引導而非代寫**：AI 優先進行提問、引導與結構化分析，絕不直接替學生生成或覆蓋完整文章。
2. **生活即素材**：以學生的真實經歷作為核心寫作庫，透過深度訪談挖掘感官細節與深刻思考。
3. **還原真實寫作**：電子作文完整保留寫作與修改歷程 (Operation Log)；模擬考模擬真實紙本考試（手寫 -> 拍照 -> OCR -> 評析）。
4. **訓練閉環**：隨手記錄 -> 素材深化 -> 題目匹配 -> 寫作訓練 / 紙本模擬考 -> 多面向分析 -> 個人弱點庫 -> 下一次定向練習。

---

## 技術架構

- **前端 (Frontend)**：Vite + React + TypeScript + Tailwind CSS v4 + PWA (Mobile-first)
- **富文本編輯器 (Editor)**：Tiptap / ProseMirror
- **後端 (Backend)**：Cloudflare Workers (Hono 框架)
- **資料庫 (Database)**：Cloudflare D1 (SQLite)
- **物件儲存 (Storage)**：Cloudflare R2 (作文相片與題目圖片多租戶隔離)
- **身份驗證 (Auth)**：Google OAuth 2.0 (唯一的登入方式)
- **AI 服務 (AI Engine)**：Google Gemini (支援 Structured Outputs 與雙滾梯備援)

---

## 文件導覽

- **產品需求規格 (PRD)**：[doc/PRD_V1.md](file:///d:/Document_J/mote/doc/PRD_V1.md)
- **工程與資料庫規格書**：[doc/ENGINEERING_SPEC.md](file:///d:/Document_J/mote/doc/ENGINEERING_SPEC.md)
- **進度規劃與 30 項核心 Issues**：[doc/ROADMAP_TODO.md](file:///d:/Document_J/mote/doc/ROADMAP_TODO.md)
- **架構指引文件**：
  - Cloudflare Worker 架構：[doc/guide/cloudflare-worker-arch.md](file:///d:/Document_J/mote/doc/guide/cloudflare-worker-arch.md)
  - PWA 快取與防滾動指引：[doc/guide/pwa-sw-scroll.md](file:///d:/Document_J/mote/doc/guide/pwa-sw-scroll.md)
  - Tailwind v4 色彩系統規範：[doc/guide/tailwind-color-system.md](file:///d:/Document_J/mote/doc/guide/tailwind-color-system.md)
  - Apple Pencil 與手跡處理：[doc/guide/apple-pencil-drawing.md](file:///d:/Document_J/mote/doc/guide/apple-pencil-drawing.md)

---

## 開發與版本控制規範

- **分支管理**：僅維護 `main`（正式發布）與 `dev`（日常開發）分支。
- **提交格式**：遵循 Conventional Commits 格式（`feat:`, `fix:`, `refactor:`, `docs:`）。
- **文字風格**：專案全體程式碼、UI 文案、註解與回應嚴格禁止使用表情符號。
