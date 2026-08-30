import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const examsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

examsRouter.use('*', authMiddleware);

// 1. List past exam sessions
examsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (!c.env.DB) {
    return c.json([]);
  }

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

    return c.json(results || []);
  } catch (err) {
    console.error('[D1 List Exams Error]', err);
    return c.json([], 500);
  }
});

// 2. Start new exam session
examsRouter.post('/start', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ promptId?: string; durationMinutes?: number }>();
  const id = `exm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();
  const duration = body.durationMinutes || 50;
  const promptId = body.promptId || null;

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO exam_sessions (id, user_id, prompt_id, duration_minutes, started_at, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'in_progress', ?)
      `)
        .bind(id, userId, promptId, duration, now, now)
        .run();
    } catch (err) {
      console.error('[D1 Start Exam Error]', err);
      return c.json({ error: 'Failed to create exam session' }, 500);
    }
  }

  return c.json({
    id,
    user_id: userId,
    prompt_id: promptId,
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
  const combinedText = (body.finalText || '').trim();

  if (c.env.DB) {
    try {
      // Update session status
      await c.env.DB.prepare(
        'UPDATE exam_sessions SET status = "submitted", ended_at = ? WHERE id = ? AND user_id = ?'
      )
        .bind(now, examId, userId)
        .run();

      // Insert pages
      if (body.pages && body.pages.length > 0) {
        for (const p of body.pages) {
          const pageId = `pg_${Date.now()}_${p.pageNumber}`;
          await c.env.DB.prepare(`
            INSERT INTO exam_pages (id, exam_session_id, page_number, r2_image_path, ocr_extracted_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `)
            .bind(pageId, examId, p.pageNumber, p.image?.slice(0, 100) || '', p.text || '', now)
            .run();
        }
      }

      // Insert submission
      const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await c.env.DB.prepare(`
        INSERT INTO exam_submissions (id, exam_session_id, user_id, final_essay_text, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
        .bind(subId, examId, userId, combinedText, now)
        .run();
    } catch (err) {
      console.error('[D1 Submit Exam Error]', err);
    }
  }

  // Trigger Gemini Analysis for Exam
  const aiService = new AIService(c.env);
  const analysis = await aiService.evaluateEssay('模擬考作答', combinedText);

  // Save analysis into D1 if available
  if (c.env.DB) {
    try {
      const anaId = `ana_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await c.env.DB.prepare(`
        INSERT INTO essay_analysis (
          id, user_id, prompt_match_score, intent_depth_score, material_richness_score,
          structure_score, description_score, language_score, emotion_score,
          conclusion_score, overall_summary, strengths_json, weaknesses_json,
          next_practice_advice, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          anaId,
          userId,
          analysis.scores.promptMatch,
          analysis.scores.intentDepth,
          analysis.scores.materialRichness,
          analysis.scores.structure,
          analysis.scores.description,
          analysis.scores.language,
          analysis.scores.emotion,
          analysis.scores.conclusion,
          analysis.overallSummary,
          JSON.stringify(analysis.strengths),
          JSON.stringify(analysis.weaknesses),
          analysis.nextPracticeAdvice,
          now
        )
        .run();
    } catch (err) {
      console.error('[D1 Save Exam Analysis Error]', err);
    }
  }

  return c.json({
    success: true,
    submissionId: `sub_${now}`,
    analysis,
  });
});
