export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface QuickNote {
  id: string;
  user_id: string;
  content: string;
  status: 'active' | 'converted' | 'archived';
  created_at: number;
  updated_at: number;
}

export interface InterviewMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Material {
  id: string;
  user_id: string;
  title: string;
  story: string;
  people: string[];
  time?: string;
  time_desc?: string;
  location?: string;
  location_desc?: string;
  scene?: string;
  scene_desc?: string;
  dialogue?: string;
  dialogue_desc?: string;
  emotion?: string;
  emotion_desc?: string;
  reflection?: string;
  reflection_desc?: string;
  themes: string[];
  tags?: string[];
  interview_history?: InterviewMessage[];
  source_quick_note_id?: string;
  created_at: number;
  updated_at: number;
}

export interface PromptItem {
  id: string;
  user_id?: string;
  title: string;
  raw_text: string;
  corrected_text: string;
  prompt_type: string;
  is_official?: number;
  image_r2_path?: string;
  created_at: number;
  updated_at: number;
}

export interface Essay {
  id: string;
  user_id: string;
  prompt_id?: string;
  title: string;
  current_content: string;
  word_count: number;
  status: 'draft' | 'submitted' | 'analyzed';
  created_at: number;
  updated_at: number;
}

export interface EssayOperation {
  id: string;
  essay_id: string;
  user_id?: string;
  operation_type: 'INSERT' | 'DELETE' | 'REPLACE' | 'AI_SUGGESTION' | 'AI_ACCEPT';
  position: number;
  length: number;
  old_content?: string;
  new_content?: string;
  paragraph_index?: number;
  source?: 'user' | 'ai';
  created_at: number;
}

export interface EssayAnalysis {
  id?: string;
  overallSummary: string;
  scores: {
    promptMatch: number;
    intentDepth: number;
    materialRichness: number;
    structure: number;
    description: number;
    language: number;
    emotion: number;
    conclusion: number;
  };
  strengths: string[];
  weaknesses: Array<{
    dimension: string;
    issue: string;
    suggestion: string;
  }>;
  nextPracticeAdvice: string;
}

export interface WeaknessItem {
  id: string;
  dimension: string;
  description: string;
  occurrence_count: number;
  recent_trend: 'improving' | 'steady' | 'deteriorating';
}

export interface HardCharacter {
  id: string;
  user_id?: string;
  character_text: string;
  zhuyin?: string;
  source_essay_id?: string;
  mastery_level: number;
  created_at?: number;
}

export interface ExamSession {
  id: string;
  user_id: string;
  prompt_id: string;
  prompt_title?: string;
  duration_minutes: number;
  started_at: number;
  ended_at?: number;
  status: 'in_progress' | 'submitted' | 'time_out' | 'canceled';
}

export interface UnifiedWritingItem {
  id: string;
  sourceType: 'editor' | 'mock_exam';
  title: string;
  content: string;
  promptId?: string;
  promptTitle?: string;
  wordCount: number;
  status: 'draft' | 'submitted' | 'analyzed';
  durationMinutes?: number;
  createdAt: number;
  updatedAt: number;
}

