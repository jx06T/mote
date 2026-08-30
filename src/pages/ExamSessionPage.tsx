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

export const ExamSessionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const promptTitle = searchParams.get('promptTitle') || '走過歲月的窗';
  const promptText =
    searchParams.get('promptText') ||
    '窗是室內與室外的界線，也是心靈凝視外界的途徑。請結合個人生活經驗，書寫你對時間、成長或環境變遷的觀察與體會。';

  // 4 Steps: 'timer' -> 'photo_upload' -> 'ocr_review' -> 'analysis'
  const [step, setStep] = useState<'timer' | 'photo_upload' | 'ocr_review' | 'analysis'>('timer');
  const [uploadedPages, setUploadedPages] = useState<Array<{ pageNumber: number; image: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EssayAnalysis | null>(null);

  // Step 1: Timer Ends / Finish clicked
  const handleTimerFinish = () => {
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
      const res = await ExamsAPI.submit('exm_demo', uploadedPages, finalText);
      setAnalysisResult(res.analysis);
      setStep('analysis');
    } catch (err) {
      console.error(err);
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
          <div className="flex justify-end pt-2">
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
