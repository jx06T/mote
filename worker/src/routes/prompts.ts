import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';
import { DEFAULT_STARTER_PROMPTS } from '../prompts';

export const promptsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. List prompts (User's custom prompts + official starter templates)
promptsRouter.get('/', optionalAuthMiddleware, async (c) => {
  const userId = c.get('userId');

  if (!userId || !c.env.DB) {
    return c.json(DEFAULT_STARTER_PROMPTS);
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM prompts WHERE user_id = ? OR is_official = 1 ORDER BY created_at DESC'
    )
      .bind(userId)
      .all();

    if (!results || results.length === 0) {
      return c.json(DEFAULT_STARTER_PROMPTS);
    }

    return c.json(results);
  } catch (err) {
    console.error('[D1 List Prompts Error]', err);
    return c.json(DEFAULT_STARTER_PROMPTS);
  }
});

// 2. Create custom prompt (Members only on cloud D1)
promptsRouter.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const title = (body.title || '自訂題目').trim();
  const rawText = (body.raw_text || body.promptText || '').trim();
  const correctedText = (body.corrected_text || rawText).trim();
  const promptType = body.prompt_type || '記敘抒情';

  if (!rawText) {
    return c.json({ error: '題目內容不可為空' }, 400);
  }

  const id = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO prompts (id, user_id, title, raw_text, corrected_text, prompt_type, is_official, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
      `)
        .bind(id, userId, title, rawText, correctedText, promptType, now, now)
        .run();
    } catch (err) {
      console.error('[D1 Create Prompt Error]', err);
      return c.json({ error: 'Failed to create prompt' }, 500);
    }
  }

  return c.json({
    id,
    user_id: userId,
    title,
    raw_text: rawText,
    corrected_text: correctedText,
    prompt_type: promptType,
    is_official: 0,
    created_at: now,
    updated_at: now,
  });
});

// 3. Prompt OCR Extraction
promptsRouter.post('/ocr', optionalAuthMiddleware, async (c) => {
  const body = await c.req.json();
  const imageBase64 = body.image || '';

  const aiService = new AIService(c.env);
  const result = await aiService.extractPromptFromImage(imageBase64);
  return c.json(result);
});
