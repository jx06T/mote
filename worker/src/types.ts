/// <reference types="@cloudflare/workers-types" />

export interface Bindings {
  DB: D1Database;
  STORAGE: R2Bucket;
  KV: KVNamespace;
  ASSETS?: Fetcher;

  // Secrets
  GEMINI_API_KEY?: string;
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  // Environment & Configuration
  AI_PROVIDER?: string;
  ALLOWED_ORIGINS?: string;
  ENV?: string;
  FRONTEND_URL?: string;
}

export interface Variables {
  userId: string;
  userEmail: string | null;
}

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: number;
  updated_at: number;
}

export interface MaterialCardData {
  title: string;
  story: string;
  people: string[];
  time: string;
  location: string;
  scene: string;
  dialogue: string;
  emotion: string;
  reflection: string;
  themes: string[];
  tags: string[];
}

export interface EssayAnalysisData {
  overallSummary: string;
  scores: {
    promptMatch: number;      // 切題
    intentDepth: number;      // 立意
    materialRichness: number; // 素材
    structure: number;        // 結構
    description: number;      // 描寫
    language: number;         // 語言
    emotion: number;          // 情感
    conclusion: number;       // 結尾
  };
  strengths: string[];
  weaknesses: Array<{
    dimension: string;
    issue: string;
    suggestion: string;
  }>;
  nextPracticeAdvice: string;
}
