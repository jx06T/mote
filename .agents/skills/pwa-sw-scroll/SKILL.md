---
name: pwa-sw-scroll
description: >-
  PWA Service Worker 配置、熱更新機制、四種快取策略，以及 iPad/移動端
  四層防滾動方案的完整指引。適用於以 Vite + 手寫 Service Worker 為基礎的
  SPA PWA 專案。涵蓋：SW 安裝不主動 skipWaiting（防白屏）、前端主動發送
  SKIP_WAITING 的熱更新流程、Network-First / SWR / Cache-First 四種快取策略、
  SHELL_KEY 單一 HTML 快取鍵設計、以及 Viewport meta / CSS overflow /
  canvas.pencil-active / .no-scrollbar 四層防滾動實作。
triggers:
  - 初始化或修改 public/sw.js
  - 設計 PWA 熱更新提示
  - 處理 SW 新舊版本 JS hash 白屏問題
  - 設計或調整 SW 快取策略
  - 處理 iPad 頁面意外捲動或系統手勢干擾
  - 新增可捲動區域需要隱藏捲軸（.no-scrollbar）
  - index.html PWA meta 設定
---

# PWA Service Worker 配置與防滾動實作指引

## 核心設計決策

| 決策 | 說明 |
|---|---|
| SW 安裝不主動 `skipWaiting()` | 避免新 SW + 舊 JS hash 同頁運行造成白屏 |
| 前端發送 `SKIP_WAITING` 才切換 | 配合 Toast 或確認流程觸發切換 |
| 統一 `SHELL_KEY = '/index.html'` | 無論使用者在任何子路由，Offline fallback 都讀同一份 HTML |
| 手寫 SW，不使用 Workbox | 策略明確可控，避免 Workbox 黑箱行為 |

---

## 1. index.html — PWA Meta 設定

```html
<head>
  <meta charset="UTF-8" />
  <link rel="apple-touch-icon" href="/icon-192x192.png" />
  <link rel="manifest" href="/manifest.json" />

  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Mote" />
  <meta name="application-name" content="Mote" />
  <meta name="theme-color" content="#FAF8F5" />
</head>
```

---

## 2. 四種快取策略 (public/sw.js)

1. **API (`/api/*`)**：Network-First（僅 GET），斷線時回傳快取或結構化 503。
2. **圖片**：Stale-While-Revalidate (SWR)。
3. **HTML 導航 (`navigate`)**：Network-First + 統一 `SHELL_KEY` Fallback。
4. **靜態資源 (`assets/*`)**：Cache-First。

---

## 3. 四層防滾動架構

- **層 1 (Viewport Meta)**：`maximum-scale=1.0, user-scalable=no, viewport-fit=cover`
- **層 2 (CSS Base)**：`html, body { overflow: hidden; overscroll-behavior: none; }`
- **層 3 (動態 touch-action)**：書寫時 canvas 鎖定 `touch-action: none`。
- **層 4 (.no-scrollbar)**：隱藏捲軸但保持局部容器捲動。
