import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const examsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

examsRouter.use('*', authMiddleware);

// 1. List past exam sessions
examsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        `SELECT e.*, p.title as prompt_title 
         FROM exam_sessions e 
         LEFT JOIN prompts p ON e.prompt_id = p.id 
         WHERE e.user_id = ? 
         ORDER BY e.created_at DESC`
      )
        .bind(userId)
        .all();
      if (results && results.length > 0) return c.json(results);
    } catch (err) {
      console.warn('[D1 List Exams Warning]', err);
    }
  }

  return c.json([
    {
      id: 'exm_001',
      user_id: userId,
      prompt_id: 'prm_001',
      prompt_title: '當我轉身看見那道光',
      duration_minutes: 50,
      started_at: Date.now() - 86400000 * 4,
      ended_at: Date.now() - 86400000 * 4 + 50 * 60 * 1000,
      status: 'submitted',
      created_at: Date.now() - 86400000 * 4,
    },
  ]);
});

// 2. Start new exam session
examsRouter.post('/start', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ promptId: string; durationMinutes?: number }>();
  const id = 'exm_' + Date.now();
  const now = Date.now();
  const duration = body.durationMinutes || 50;

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        `INSERT INTO exam_sessions (id, user_id, prompt_id, duration_minutes, started_at, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'in_progress', ?)`
      )
        .bind(id, userId, body.promptId, duration, now, now)
        .run();
    } catch (err) {
      console.warn('[D1 Start Exam Warning]', err);
    }
  }

  return c.json({
    id,
    user_id: userId,
    prompt_id: body.promptId,
    duration_minutes: duration,
    started_at: now,
    status: 'in_progress',
  });
});

// 3. Submit exam paper (with images & OCR review)
examsRouter.post('/:id/submit', async (c) => {
  const userId = c.get('userId');
  const examId = c.req.param('id');
  const body = await c.req.json<{
    pages: Array<{ pageNumber: number; image: string; text?: string }>;
    finalText?: string;
  }>();

  const now = Date.now();
  const combinedText =
    body.finalText ||
    body.pages.map((p) => p.text || '【手寫辨識段落】').join('\n\n');

  if (c.env.DB) {
    try {
      // Update session status
      await c.env.DB.prepare('UPDATE exam_sessions SET status = "submitted", ended_at = ? WHERE id = ? AND user_id = ?')
        .bind(now, examId, userId)
        .run();

      // Insert submission
      const subId = 'sub_' + Date.now();
      await c.env.DB.prepare(
        'INSERT INTO exam_submissions (id, exam_session_id, user_id, final_essay_text, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(subId, examId, userId, combinedText, now)
        .run();
    } catch (err) {
      console.warn('[D1 Submit Exam Warning]', err);
    }
  }

  // Trigger automated AI essay analysis
  const ai = new AIService(c.env);
  const analysis = await ai.analyzeEssay('模擬考作答', combinedText);

  return c.json({
    success: true,
    examId,
    finalText: combinedText,
    analysis,
  });
});
