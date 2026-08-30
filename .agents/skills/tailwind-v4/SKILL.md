---
name: tailwind-v4
description: Tailwind CSS v4 usage guide and v3-to-v4 differences. This skill should be used when writing, reviewing, or refactoring any Tailwind CSS code in this repo. Triggers on tasks involving Tailwind classes, @theme blocks, CSS-first configuration, or cleanup of v3-era syntax.
---

# Tailwind CSS v4

How to write idiomatic Tailwind v4 and spot v3-era syntax that still compiles but should not appear in new code.

## Version and sources

Check the pinned version before using recent utilities: the playground packages pin `tailwindcss` in their `package.json` (4.3.3 at the time of writing, including v4.3 utilities like `scrollbar-*`, `zoom-*`, and `tab-*`). When unsure whether a utility, variant, or directive exists in the pinned version, verify against the docs instead of guessing:

- Utility/variant reference: https://tailwindcss.com/docs
- v3 → v4 migration: https://tailwindcss.com/docs/upgrade-guide
- What each minor added: https://tailwindcss.com/blog/tailwindcss-v4 (and `/tailwindcss-v4-1`, `/tailwindcss-v4-3`, ...)

## CSS-first configuration

Tailwind v4 is configured in CSS, not JavaScript.

| Use                                                                        | Never use (v3-era)                    |
| -------------------------------------------------------------------------- | ------------------------------------- |
| `@import 'tailwindcss'`                                                    | `@tailwind base/components/utilities` |
| `@theme { --color-x: ...; }` for tokens that should generate utilities     | `tailwind.config.ts` for new work     |
| `@utility name { ... }` for custom utilities (works with variants)         | `@layer utilities { .name { ... } }`  |
| `@custom-variant dark (&:is(.dark *))`                                     | JS `plugins` / `addVariant`           |
| `@source "path"` / `@source inline("...")` for extra sources / safelisting | `content` array / `safelist` config   |
| `@variant dark { ... }` to apply a Tailwind variant inside custom CSS      | duplicating media queries / selectors |
| `@reference "app.css"` for `@apply` in scoped styles (Vue, CSS Modules)    | duplicating stylesheet imports        |
| `var(--color-x)` in CSS, `getComputedStyle` in JS                          | `theme()` function, `resolveConfig`   |
| `@config "…"` / `@plugin "…"` only for existing JS-config integrations     | adding new JS configs or plugins      |

`@theme` variables are API: each one emits a native CSS variable AND generates utilities (`--color-*` → `bg-*`/`text-*`/`border-*`/..., `--text-*` → `text-*`, `--shadow-*` → `shadow-*`, `--animate-*` → `animate-*`, `--breakpoint-*` → responsive variants). A plain `:root { --x: ...; }` variable generates nothing — use it for runtime-only values. When a token's value references another variable (`--color-x: var(--y)`), declare it in `@theme inline` so the utility resolves the reference at the declaration site. In custom CSS, `--alpha(var(--color-x) / 50%)` and `--spacing(4)` replace v3 `theme()` math.

## v3 → v4 renames

Bare names shifted one step down the scale, so the v3 spelling silently renders smaller or lighter:

| v3                                | v4                                                                |
| --------------------------------- | ----------------------------------------------------------------- |
| `shadow-sm` / `shadow`            | `shadow-xs` / `shadow-sm`                                         |
| `drop-shadow-sm` / `drop-shadow`  | `drop-shadow-xs` / `drop-shadow-sm`                               |
| `blur-sm` / `blur`                | `blur-xs` / `blur-sm`                                             |
| `rounded-sm` / `rounded`          | `rounded-xs` / `rounded-sm`                                       |
