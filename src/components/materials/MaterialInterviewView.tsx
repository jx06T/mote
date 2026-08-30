import React, { useState, useEffect, useRef } from 'react';
import { MaterialsAPI } from '../../services/api';
import { InterviewMessage } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Send, CheckCircle2, ArrowRight, Sparkles, MessageCircle, X, RotateCcw } from 'lucide-react';
import { DEFAULT_INTERVIEW_OPENING, INTERVIEW_FALLBACK_QUESTIONS } from '../../config/prompts';

interface MaterialInterviewViewProps {
  noteContent: string;
  sourceQuickNoteId?: string;
  initialMessages?: InterviewMessage[];
  title?: string;
  onComplete: (materialCard: any) => void;
  onCancel: () => void;
}

export const MaterialInterviewView: React.FC<MaterialInterviewViewProps> = ({
  noteContent,
  sourceQuickNoteId,
  initialMessages,
  title,
  onComplete,
  onCancel,
}) => {
  const isResuming = Boolean(initialMessages && initialMessages.length > 0);

  const [messages, setMessages] = useState<InterviewMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [
      {
        role: 'assistant',
        content: DEFAULT_INTERVIEW_OPENING(noteContent),
      },
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryCard, setSummaryCard] = useState<any | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: InterviewMessage = { role: 'user', content: inputText.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const question = await MaterialsAPI.askInterview(noteContent, nextMessages);
      setMessages([...nextMessages, { role: 'assistant', content: question }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: INTERVIEW_FALLBACK_QUESTIONS[1] || INTERVIEW_FALLBACK_QUESTIONS[0] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    try {
      const card = await MaterialsAPI.summarizeInterview(noteContent, messages);
      setSummaryCard({
        ...card,
        source_quick_note_id: sourceQuickNoteId,
      });
    } catch (err) {
      console.error('[Interview Summarize Error]', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveCard = async () => {
    if (!summaryCard) return;
    onComplete({
      ...summaryCard,
      source_quick_note_id: sourceQuickNoteId,
      interview_history: messages,
    });
  };

  const handleAttemptClose = () => {
    const userMsgCount = messages.filter((m) => m.role === 'user').length;
    if (userMsgCount === 0 || summaryCard) {
      onCancel();
      return;
    }
    setShowExitConfirm(true);
  };

  const handleQuickSaveAndExit = async () => {
    setIsSummarizing(true);
    try {
      const card = await MaterialsAPI.summarizeInterview(noteContent, messages);
      onComplete({
        ...card,
        source_quick_note_id: sourceQuickNoteId,
        interview_history: messages,
      });
    } catch (err) {
      console.warn('[Quick Save Fallback on Exit]', err);
      const userAnswers = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content.trim())
        .filter(Boolean);
      const combinedStory = userAnswers.length > 0
        ? `${noteContent}。${userAnswers.join('；')}`
        : noteContent;
      const titleText = noteContent.length > 15 ? `${noteContent.slice(0, 15)}...` : (noteContent || '生活片段素材');

      onComplete({
        title: titleText,
        story: combinedStory,
        people: ['我'],
        themes: ['生活記錄'],
        tags: ['隨手筆記'],
        source_quick_note_id: sourceQuickNoteId,
        interview_history: messages,
      });
    } finally {
      setIsSummarizing(false);
      setShowExitConfirm(false);
    }
  };

  const userMessagesCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="relative flex flex-col h-[78vh] max-h-180 bg-page-bg rounded-2xl overflow-hidden border border-border-subtle shadow-sm">
      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-30 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-lg text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-text-main font-display">
                是否保存當前訪談進度？
              </h4>
              <p className="text-xs text-text-muted leading-relaxed">
                你已經回答了 {userMessagesCount} 個問題。儲存為素材卡後，未來可隨時接續此紀錄繼續深入。
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                size="sm"
                className="w-full text-xs py-2 bg-primary text-white"
                isLoading={isSummarizing}
                onClick={handleQuickSaveAndExit}
              >
                保存進度為素材卡並離開
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs py-1.5 text-text-muted hover:text-status-danger"
                onClick={onCancel}
              >
                直接離開（放棄本次對話）
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs py-1.5 text-text-soft"
                onClick={() => setShowExitConfirm(false)}
              >
                返回繼續對話
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-3.5 border-b border-border-subtle bg-surface flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-text-main font-display">
              {title || (isResuming ? '接續素材深入訪談' : '素材深入訪談')}
            </h3>
            <p className="text-[11px] text-text-muted truncate max-w-55">
              {noteContent}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAttemptClose}
            className="text-xs py-1 px-2 text-text-muted"
          >
            關閉
          </Button>
          {(messages.length >= 2 || isResuming) && !summaryCard && (
            <Button
              size="sm"
              onClick={handleGenerateSummary}
              isLoading={isSummarizing}
              className="text-xs py-1 px-2.5 bg-primary text-white"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {isResuming ? '更新素材卡' : '整理為素材卡'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area: Chat or Card Review */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {!summaryCard ? (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-surface border border-border-subtle text-text-main rounded-bl-xs shadow-xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border-subtle rounded-2xl px-4 py-2.5 text-xs text-text-muted flex items-center space-x-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span>老師正在思考追問角度...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        ) : (
          /* Card Confirmation & Editing View */
          <div className="space-y-3 p-1">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>訪談完成！以下是依據你的回答提煉的素材卡，可自由調整：</span>
            </div>

            <Input
              label="素材標題"
              value={summaryCard.title || ''}
              onChange={(e) => setSummaryCard({ ...summaryCard, title: e.target.value })}
            />

            <Textarea
              label="故事片段"
              rows={4}
              value={summaryCard.story || ''}
              onChange={(e) => setSummaryCard({ ...summaryCard, story: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="時間"
                placeholder="例如：高中某個午後"
                value={summaryCard.time || summaryCard.time_desc || ''}
                onChange={(e) =>
                  setSummaryCard({
                    ...summaryCard,
                    time: e.target.value,
                    time_desc: e.target.value,
                  })
                }
              />
              <Input
                label="地點"
                placeholder="例如：學校圖書館一隅"
                value={summaryCard.location || summaryCard.location_desc || ''}
                onChange={(e) =>
                  setSummaryCard({
                    ...summaryCard,
                    location: e.target.value,
                    location_desc: e.target.value,
                  })
                }
              />
            </div>

            <Textarea
              label="當時的情緒與事後體悟"
              rows={2}
              placeholder="當時的心情轉折或這件事帶給你的啟發..."
              value={summaryCard.reflection || summaryCard.reflection_desc || summaryCard.emotion || ''}
              onChange={(e) =>
                setSummaryCard({
                  ...summaryCard,
                  reflection: e.target.value,
                  reflection_desc: e.target.value,
                })
              }
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="主題分類（以頓號分隔）"
                value={Array.isArray(summaryCard.themes) ? summaryCard.themes.join('、') : summaryCard.themes || ''}
                onChange={(e) =>
                  setSummaryCard({
                    ...summaryCard,
                    themes: e.target.value.split(/[、,，]+/).map((t: string) => t.trim()).filter(Boolean),
                  })
                }
              />
              <Input
                label="自訂標籤（以頓號分隔）"
                value={Array.isArray(summaryCard.tags) ? summaryCard.tags.join('、') : summaryCard.tags || ''}
                onChange={(e) =>
                  setSummaryCard({
                    ...summaryCard,
                    tags: e.target.value.split(/[、,，]+/).map((t: string) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-border-subtle bg-surface">
        {!summaryCard ? (
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="回答問題，補充當時的細節與感受..."
              className="flex-1 px-3.5 py-2 bg-page-bg border border-border-subtle rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim() || isLoading}
              className="rounded-xl px-3.5 py-2"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        ) : (
          <div className="flex justify-between space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSummaryCard(null)}
              className="text-xs"
            >
              返回繼續對話
            </Button>
            <Button size="sm" onClick={handleSaveCard} className="text-xs">
              確認存入素材庫
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
