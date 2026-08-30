---
name: apple-pencil-drawing
description: >-
  Apple Pencil 書寫優化、防誤觸設計、筆跡儲存與離線同步架構指引，
  適用於以 Canvas + Pointer Events API + perfect-freehand 為基礎的
  iPad PWA 書寫功能。涵蓋 PointerType 分離、四層防誤觸策略、
  壓力感測、非破壞性向量橡皮擦、雙手指 Undo/Redo 手勢、
  DrawData 資料結構、跨裝置縮放、IntersectionObserver Canvas 優化，
  以及 IndexedDB 離線儲存 + Vector Clock 雲端同步。
  觸發條件：建立繪圖元件、實作橡皮擦、處理 iPad 觸控分離、
  設計手跡資料結構或離線同步邏輯。
triggers:
  - 建立或修改 Canvas 繪圖元件
  - 實作 Apple Pencil / 觸控輸入分離
  - 防止 iPad 書寫時頁面誤滾動
  - 實作橡皮擦（軟體或硬體尖端）
  - 雙手指 Undo / 三手指 Redo 手勢
  - 設計筆跡資料儲存格式
  - 離線書寫 + 連線後雲端同步
---

# Apple Pencil 書寫優化與手跡儲存架構

## 設計核心原則

| 原則 | 說明 |
|---|---|
| PointerType 隔離 | `pen` / `touch` / `mouse` 走完全不同邏輯路徑，不共用分支 |
| CSS 防滾優先 | 在 CSS 層解決滾動問題，減少對 `e.preventDefault()` 的依賴 |
| Vector-only 儲存 | 所有筆跡以座標點陣列存儲，不存像素點陣圖 |
| 非破壞性橡皮擦 | 橡皮擦切割向量段，不刪除整條 Stroke |
| 離線優先 | 書寫後立即存 IndexedDB，恢復連線後再同步雲端 |

---

## 1. PointerType 分離實作

```typescript
const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
  if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
    if (e.pointerType === 'pen') {
      canvasRef.current!.style.touchAction = 'none';
    }
    isMultiTouchGestureRef.current = false;
  } else if (e.pointerType === 'touch') {
    if (!allowTouchDrawing) return;
    if (!e.isPrimary || isMultiTouchGestureRef.current) {
      isMultiTouchGestureRef.current = true;
      setIsDrawing(false);
      return;
    }
  }
  e.currentTarget.setPointerCapture(e.pointerId);
};
```

---

## 2. 向量手跡資料結構 (DrawData)

```typescript
export interface Stroke {
  color: string;
  width: number;
  opacity?: number;
  points: [number, number, number][]; // [x, y, pressure]
  tool?: 'pen' | 'highlighter';
}

export interface DrawData {
  strokes: Stroke[];
  baseWidth: number;
  baseHeight: number;
  calcSpaceHeight?: number;
}
```
