import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ExamSession } from '../components/exam/ExamSession';
import { ExamPhotoUpload } from '../components/exam/ExamPhotoUpload';
import { ExamOCRReview } from '../components/exam/ExamOCRReview';
import { EssayAnalysisView } from '../components/analysis/EssayAnalysisView';
import { ExamsAPI } from '../services/api';
import { EssayAnalysis } from '../types';
import { Button } from '../components/ui/Button';
import { ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ExamSessionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const promptTitle = searchParams.get('promptTitle') || '模擬考自訂題目';
  const promptText =
    searchParams.get('promptText') ||
    '請依題目要求在實體稿紙上手寫作答，計時結束後拍照上傳並進行 OCR 校對。';
  const promptId = searchParams.get('promptId') || '';

  // 4 Steps: 'timer' -> 'photo_upload' -> 'ocr_review' -> 'analysis'
  const [step, setStep] = useState<'timer' | 'photo_upload' | 'ocr_review' | 'analysis'>('timer');
  const [examSessionId, setExamSessionId] = useState<string>('');
  const [uploadedPages, setUploadedPages] = useState<Array<{ pageNumber: number; image: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EssayAnalysis | null>(null);

  // Step 1: Timer Ends / Finish clicked
  const handleTimerFinish = async () => {
    try {
      const session = await ExamsAPI.start(promptId, 50);
      setExamSessionId(session.id);
    } catch {
      setExamSessionId(`exm_${Date.now()}`);
    }
    setStep('photo_upload');
  };

  // Step 2: Photos confirmed
  const handleProceedToOCR = (pages: Array<{ pageNumber: number; image: string }>) => {
    setUploadedPages(pages);
    setStep('ocr_review');
  };

  // Step 3: OCR confirmed -> Submit to Backend
  const handleConfirmSubmit = async (finalText: string) => {
    setIsAnalyzing(true);
    try {
      const res = await ExamsAPI.submit(examSessionId || 'exm_current', uploadedPages, finalText);
      setAnalysisResult(res.analysis);
      setStep('analysis');
      toast.success('模擬考評析完成！');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '模擬考評析發生錯誤，請重試。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {step === 'timer' && (
        <ExamSession
          promptTitle={promptTitle}
          promptText={promptText}
          durationMinutes={50}
          onFinishExam={handleTimerFinish}
        />
      )}

      {step === 'photo_upload' && (
        <div className="py-6">
          <ExamPhotoUpload onProceedToOCR={handleProceedToOCR} />
        </div>
      )}

      {step === 'ocr_review' && (
        <div className="py-6">
          <ExamOCRReview
            initialText=""
            isAnalyzing={isAnalyzing}
            onConfirmSubmit={handleConfirmSubmit}
          />
        </div>
      )}

      {step === 'analysis' && analysisResult && (
        <div className="py-6 space-y-6 max-w-2xl mx-auto px-4">
          <EssayAnalysisView
            analysis={analysisResult}
            title={`模擬考評析報告：${promptTitle}`}
          />
          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(`/essays/${examSessionId}`)}
              className="text-xs bg-surface"
            >
              進入作品專屬評析與原文
            </Button>
            <Button size="md" onClick={() => navigate('/exams')}>
              返回模擬考主頁
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
