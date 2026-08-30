import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Camera, Plus, Trash2, RotateCw, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface ExamPhotoUploadProps {
  onProceedToOCR: (pages: Array<{ pageNumber: number; image: string }>) => void;
}

export const ExamPhotoUpload: React.FC<ExamPhotoUploadProps> = ({ onProceedToOCR }) => {
  const [pages, setPages] = useState<Array<{ pageNumber: number; image: string }>>([
    {
      pageNumber: 1,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23FFFFFF"/><text x="20" y="40" fill="%238B5E3C" font-size="14">【模擬考卷第 1 頁】</text><line x1="20" y1="60" x2="280" y2="60" stroke="%23E7E0D6"/><line x1="20" y1="90" x2="280" y2="90" stroke="%23E7E0D6"/><line x1="20" y1="120" x2="280" y2="120" stroke="%23E7E0D6"/></svg>',
    },
  ]);

  const handleAddPage = () => {
    const nextNum = pages.length + 1;
    setPages((prev) => [
      ...prev,
      {
        pageNumber: nextNum,
        image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23FFFFFF"/><text x="20" y="40" fill="%238B5E3C" font-size="14">【模擬考卷第 ${nextNum} 頁】</text><line x1="20" y1="60" x2="280" y2="60" stroke="%23E7E0D6"/><line x1="20" y1="90" x2="280" y2="90" stroke="%23E7E0D6"/><line x1="20" y1="120" x2="280" y2="120" stroke="%23E7E0D6"/></svg>`,
      },
    ]);
  };

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const nextNum = pages.length + 1;
      setPages((prev) => [...prev, { pageNumber: nextNum, image: dataUrl }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto p-4">
      <div className="text-center space-y-1">
        <h2 className="font-display font-bold text-xl text-text-main">
          拍攝並整理作文稿紙
        </h2>
        <p className="text-xs text-text-muted">
          請拍攝清晰完整的稿紙照片，支援多頁新增與順序確認。
        </p>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 gap-4">
        {pages.map((p, idx) => (
          <div
            key={idx}
            className="relative bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xs flex flex-col items-center p-3 space-y-2 group"
          >
            <div className="w-full aspect-3/4 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center border border-border-subtle/50">
              <img
                src={p.image}
                alt={`Page ${idx + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="w-full flex items-center justify-between text-xs text-text-muted px-1">
              <span className="font-medium">第 {idx + 1} 頁</span>
              {pages.length > 1 && (
                <button
                  onClick={() => handleDeletePage(idx)}
                  className="text-status-danger hover:opacity-80 p-1"
                  title="刪除此頁"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Page Card */}
        <label className="border-2 border-dashed border-border-subtle hover:border-primary/50 bg-surface/50 rounded-2xl aspect-3/4 flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center group">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Camera className="w-8 h-8 text-text-muted group-hover:text-primary mb-2 transition-colors" />
          <span className="text-xs font-medium text-text-soft group-hover:text-primary">
            拍攝 / 新增下一頁
          </span>
        </label>
      </div>

      <div className="flex justify-end pt-4 border-t border-border-subtle">
        <Button size="md" onClick={() => onProceedToOCR(pages)} className="rounded-xl">
          確認頁面順序，開始 OCR 辨識
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
};
