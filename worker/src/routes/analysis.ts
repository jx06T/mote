import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const analysisRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

analysisRouter.use('*', authMiddleware);

// 1. Analyze essay or exam submission
analysisRouter.post('/evaluate', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    essayId?: string;
    examId?: string;
    title?: string;
    content: string;
    promptText?: string;
  }>();

  const ai = new AIService(c.env);
  const result = await ai.analyzeEssay(
    body.title || '作文',
    body.content || '',
    body.promptText
  );

  const id = 'ans_' + Date.now();
  const now = Date.now();

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        `INSERT INTO essay_analysis (id, essay_id, exam_submission_id, user_id, overall_summary, scores_json, strengths_json, weaknesses_json, next_practice_advice, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          id,
          body.essayId || null,
          body.examId || null,
          userId,
          result.overallSummary,
          JSON.stringify(result.scores),
          JSON.stringify(result.strengths),
          JSON.stringify(result.weaknesses),
          result.nextPracticeAdvice,
          now
        )
        .run();

      // Aggregate weaknesses
      for (const w of result.weaknesses) {
        await c.env.DB.prepare(
          `INSERT INTO weaknesses (id, user_id, dimension, description, occurrence_count, recent_trend, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, 'steady', ?, ?)
           ON CONFLICT(id) DO UPDATE SET occurrence_count = occurrence_count + 1, updated_at = ?`
        )
          .bind('wk_' + Math.random().toString(36).substring(2, 8), userId, w.dimension, w.issue, now, now, now)
          .run();
      }
    } catch (err) {
      console.warn('[D1 Save Analysis Warning]', err);
    }
  }

  return c.json({ id, analysis: result });
});

// 2. Get user overall weakness report & trends
analysisRouter.get('/weaknesses', async (c) => {
  const userId = c.get('userId');
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM weaknesses WHERE user_id = ? ORDER BY occurrence_count DESC'
      )
        .bind(userId)
        .all();
      if (results && results.length > 0) return c.json(results);
    } catch (err) {
      console.warn('[D1 List Weaknesses Warning]', err);
    }
  }

  return c.json([
    {
      id: 'wk_01',
      dimension: '結尾說理',
      description: '末段常有直接說教或匆忙點題的傾向',
      occurrence_count: 4,
      recent_trend: 'improving',
    },
    {
      id: 'wk_02',
      dimension: '段落轉折',
      description: '由景入情或由事入理的過渡句稍嫌生硬',
      occurrence_count: 3,
      recent_trend: 'steady',
    },
    {
      id: 'wk_03',
      dimension: '抽象詞過多',
      description: '情緒表達偏好抽象形容詞，較少落實於具體物象',
      occurrence_count: 2,
      recent_trend: 'improving',
    },
  ]);
});
