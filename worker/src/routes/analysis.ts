import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const analysisRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. Analyze essay or exam submission (Member-only Feature)
analysisRouter.post('/evaluate', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    essayId?: string;
    examId?: string;
    title?: string;
    content: string;
    promptText?: string;
  }>();

  const title = body.title || '作文';
  const content = (body.content || '').trim();

  if (!content) {
    return c.json({ error: '作文內容不可為空' }, 400);
  }

  const ai = new AIService(c.env);
  const result = await ai.analyzeEssay(title, content, body.promptText);

  const id = `ans_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO essay_analysis (
          id, essay_id, exam_submission_id, user_id,
          overall_summary, scores_json, strengths_json, weaknesses_json, next_practice_advice, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
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

      // Aggregate and update weaknesses in D1
      for (const w of result.weaknesses) {
        const wkId = `wk_${w.dimension}_${userId}`.slice(0, 50);
        await c.env.DB.prepare(`
          INSERT INTO weaknesses (id, user_id, dimension, description, occurrence_count, recent_trend, created_at, updated_at)
          VALUES (?, ?, ?, ?, 1, 'steady', ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            occurrence_count = occurrence_count + 1,
            description = excluded.description,
            updated_at = excluded.updated_at
        `)
          .bind(wkId, userId, w.dimension, w.issue, now, now)
          .run();
      }
    } catch (err) {
      console.error('[D1 Save Analysis Error]', err);
    }
  }

  return c.json({ id, analysis: result });
});

// 2. Get user overall weakness report & trends (Members get D1 data, Guests receive [])
analysisRouter.get('/weaknesses', optionalAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  if (!userId || !c.env.DB) {
    return c.json([]);
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM weaknesses WHERE user_id = ? ORDER BY occurrence_count DESC'
    )
      .bind(userId)
      .all();

    return c.json(results || []);
  } catch (err) {
    console.error('[D1 List Weaknesses Error]', err);
    return c.json([], 500);
  }
});

// 3. Get latest analysis report (Members get D1 data, Guests receive null)
analysisRouter.get('/latest', optionalAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  if (!userId || !c.env.DB) {
    return c.json(null);
  }

  try {
    const row: any = await c.env.DB.prepare(
      'SELECT * FROM essay_analysis WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    )
      .bind(userId)
      .first();

    if (!row) {
      return c.json(null);
    }

    let scores = {
      promptMatch: 80,
      intentDepth: 80,
      materialRichness: 80,
      structure: 80,
      description: 80,
      language: 80,
      emotion: 80,
      conclusion: 80,
    };

    if (row.scores_json) {
      try {
        scores = JSON.parse(row.scores_json);
      } catch {}
    }

    return c.json({
      id: row.id,
      overallSummary: row.overall_summary,
      scores,
      strengths: row.strengths_json ? JSON.parse(row.strengths_json) : [],
      weaknesses: row.weaknesses_json ? JSON.parse(row.weaknesses_json) : [],
      nextPracticeAdvice: row.next_practice_advice,
      created_at: row.created_at,
    });
  } catch (err) {
    console.error('[D1 Get Latest Analysis Error]', err);
    return c.json(null);
  }
});
