import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const promptsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Standard starter prompts for Chinese essay training
const DEFAULT_STARTER_PROMPTS = [
  {
    id: 'pr_001',
    title: '當我轉身看見那道光',
    raw_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    corrected_text: '在生命的行進中，我們常埋頭前行，忽略了身後的風景或身旁默默注視的人。請結合生活經驗與體會，寫一篇文章，描述某個轉身看見光芒的片刻與體悟。',
    prompt_type: '記敘抒情',
    is_official: 1,
  },
  {
    id: 'pr_002',
    title: '走過歲月的窗',
    raw_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    corrected_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。透過窗戶，我們看見季節更替、城市變遷與人情冷暖。請以「走過歲月的窗」為題，書寫你的觀察與思考。',
    prompt_type: '記敘抒情',
    is_official: 1,
  },
  {
    id: 'pr_003',
    title: '那一次，我選擇了留白',
    raw_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    corrected_text: '在凡事講求效率與填滿的時代，有時適當的放手、沉默或等待，反而能讓事物展現真正的深度。請結合自身經歷，談談你對「留白」的理解與選擇。',
    prompt_type: '哲理思考',
    is_official: 1,
  },
];

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
