---
name: cloudflare-worker-arch
description: >-
  Cloudflare Worker 前後端配置與 AI API 集成架構指引，適用於以
  Hono + Cloudflare Workers + D1 + R2 + KV 為基礎的全端 PWA 專案。
  涵蓋 wrangler.jsonc 宣告、Bindings 型別、CORS / Auth Middleware、
  Hono 路由模組結構、AI Provider 工廠模式、Gemini SDK + REST 雙滾梯備援、
  以及安全實務清單。觸發條件：初始化 Worker 專案、設定 Cloudflare 資源、
  新增路由模組、整合 AI API、審查安全配置。
triggers:
  - 初始化 Cloudflare Worker 或 Pages 專案
  - 設定 wrangler.jsonc D1 / R2 / KV 資源
  - 撰寫或修改 Hono 路由 / Middleware
  - 整合 Gemini 或其他 AI API
  - 審查 CORS / JWT / Secret 安全配置
---

# Cloudflare Worker — 前後端配置與 AI API 集成架構

## 整體架構

```text
Browser (Vite SPA + PWA)
  │
  ├── 開發環境：Vite Proxy -> wrangler dev :8787
  └── 生產環境：Cloudflare Pages -> Cloudflare Workers
                    │
                    ▼
             Hono App (worker/index.ts)
               ├── Middleware: CORS -> Security Headers -> Error Handler
               ├── /api/auth       JWT + OAuth
               ├── /api/items      D1 + R2 + AI 標記
               ├── /api/taxonomy   D1 分類樹
               ├── /api/search     D1 FTS5
               ├── /api/dashboard  D1 統計
               ├── /api/keys       API Key 管理
               └── /              公開分享 / SPA Fallback

Cloudflare Bindings
  ├── D1 (DB)       SQLite 主資料庫
  ├── R2 (STORAGE)  圖片 / 二進位物件儲存
  └── KV            輕量鍵值快取
```

技術選型原則：
- Worker 框架：Hono（輕量、型別安全、Web-standard API）
- 不使用 Workbox；Service Worker 手寫，快取策略明確可控
- 本地開發透過 Vite Proxy 直連 Worker，生產環境由 Cloudflare 路由

---

## 1. Cloudflare 資源宣告（wrangler.jsonc）

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "mote-api",
  "main": "worker/index.ts",
  "compatibility_date": "2024-10-22",
  "compatibility_flags": ["nodejs_compat"],

  "vars": { "ENV": "production" },

  "d1_databases": [{
    "binding": "DB",
    "database_name": "mote-db",
    "database_id": "<YOUR_D1_ID>"
  }],

  "r2_buckets": [{
    "binding": "STORAGE",
    "bucket_name": "mote-storage"
  }],

  "kv_namespaces": [{
    "binding": "KV",
    "id": "<YOUR_KV_ID>"
  }]
}
```

敏感 Secret 不得進入 `wrangler.jsonc` 或 git：
- 本地開發：`.dev.vars`（已加入 `.gitignore`）
- 生產環境：透過 `wrangler secret put` 寫入

---

## 2. Worker Bindings 型別定義

```typescript
// worker/types.ts
export interface Bindings {
  DB: D1Database;
  STORAGE: R2Bucket;
  KV: KVNamespace;

  // Secrets (wrangler secret put)
  GEMINI_API_KEY?: string;
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  AI_PROVIDER?: string;     // 'gemini' | 'openai'
  ALLOWED_ORIGINS?: string;
  ENV?: string;
  FRONTEND_URL?: string;
}

export interface Variables {
  userId: string;
  userEmail: string | null;
}
```

---

## 3. Middleware 層

### 3.1 CORS (worker/middleware/cors.ts)
```typescript
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin, c) => {
    if (!origin) return '*';
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+(:\d+)?$/.test(origin)
    ) return origin;

    const envOrigins = (c.env as Bindings).ALLOWED_ORIGINS;
    const allowed = envOrigins?.split(',').map(s => s.trim()) ?? [];
    if (allowed.includes(origin)) return origin;
    if (origin.startsWith('https://') && origin.endsWith('.pages.dev')) return origin;
    return null;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

### 3.2 Auth Middleware (worker/middleware/auth.ts)
```typescript
export async function authMiddleware(c, next) {
  const { userId, userEmail } = await resolveAuthCredentials(c);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', userId);
  c.set('userEmail', userEmail);
  await next();
}
```

---

## 4. AI 服務整合與雙滾梯備援

```typescript
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
];

// SDK 與 REST 雙軌嘗試，確保穩定性
```

---

## 5. 安全實務規範

| 項目 | 要求 |
|---|---|
| 敏感 Secret | 不得進入代碼或 git，使用 `wrangler secret put` |
| SQL 查詢 | 全部使用 `.bind()` 參數化，禁止字串拼接 |
| 存取檢查 | 所有 API 操作必須驗證 `WHERE user_id = ?` |
| R2 存取 | 透過 Worker 端點代理或 Presigned URL，不暴露公開物件庫 |
