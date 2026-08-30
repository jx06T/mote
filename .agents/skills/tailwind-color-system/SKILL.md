---
name: tailwind-color-system
description: >-
  Tailwind CSS v4 配色系統設計指引。任何以 Tailwind v4 + Vite 為基礎的新專案，
  在建立 index.css @theme 區塊、定義品牌色、進行 Dark Mode 設定，或審查元件是否出現
  直接色碼（hex / rgb）時，必須載入此文件。觸發條件：寫 @theme、定義 Token、
  設定 Dark Mode、審查 className 是否出現 bg-[#...] 等 arbitrary 色碼。
triggers:
  - 新專案初始化配色系統
  - 定義或修改 @theme Token
  - 審查元件是否違反「禁止直接色碼」規則
  - Dark Mode 切換機制設計
  - v3 至 v4 遷移工作
---

# Tailwind CSS v4 — 配色系統設計指引

## 核心執行規則

**建立 Token 後，整個代碼庫任何地方都不得出現直接色碼。此規則不設例外。**

| 禁止寫法 | 正確替代 |
|---|---|
| `className="bg-[#6366F1]"` | `className="bg-primary"` |
| `className="text-gray-500"` | `className="text-text-muted"` |
| `style={{ color: '#374151' }}` | `style={{ color: 'var(--color-text-main)' }}` |
| `border: '1px solid #E5E7EB'` | `className="border border-border-subtle"` |
| `fill="#xxx"` (SVG inline) | `fill="currentColor"` + 父層 `className="text-primary"` |
| `ctx.fillStyle = '#xxx'` (Canvas) | 由 props 傳入，props 來自上層 Token 解析 |
| `bg-[#xxx]/20` | `bg-primary/20`（Token + opacity modifier） |
| `className="text-blue-500"` | 定義對應語意 Token 後使用 |

---

## 1. CSS-first 配置基礎 (src/index.css)

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Layer 1: Brand Primary Scale (50-950) */
  --color-primary-500: #8B5E3C;
  --color-primary: var(--color-primary-500);

  /* Layer 2: Neutral Scale (50-950) */
  --color-neutral-50: #FAF8F5;
  --color-neutral-900: #1C1917;

  /* Layer 5: Core UI Tokens */
  --color-page-bg: #FAF8F5;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #F5F1EB;
  --color-border-subtle: #E7E0D6;
  --color-text-main: #292524;
  --color-text-muted: #78716C;

  /* Status Tokens */
  --color-status-success: #2E7D32;
  --color-status-warning: #ED6C02;
  --color-status-danger: #D32F2F;
  --color-status-info: #0288D1;
}

@layer theme {
  .dark {
    --color-page-bg: #1C1917;
    --color-surface: #292524;
    --color-surface-elevated: #332F2C;
    --color-border-subtle: #44403C;
    --color-text-main: #F5F5F4;
    --color-text-muted: #A8A29E;
  }
}
```
