import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const promptsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

promptsRouter.use('*', authMiddleware);

// 1. List prompts
promptsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM prompts WHERE user_id = ? ORDER BY created_at DESC'
      )
        .bind(userId)
        .all();
      if (results && results.length > 0) return c.json(results);
    } catch (err) {
      console.warn('[D1 List Prompts Warning]', err);
    }
  }

  return c.json([
    {
      id: 'prm_001',
      user_id: userId,
      title: '當我轉身看見那道光',
      raw_text: '生活中有許多看似平凡的時刻，往往在回首時才發現其深遠的意義。請以「當我轉身看見那道光」為題，寫一篇文章，記述一段觸動心靈的經歷與你的感悟。',
      corrected_text: '生活中有許多看似平凡的時刻，往往在回首時才發現其深遠的意義。請以「當我轉身看見那道光」為題，寫一篇文章，記述一段觸動心靈的經歷與你的感悟。',
      prompt_type: '記敘抒情',
      created_at: Date.now() - 86400000 * 5,
      updated_at: Date.now() - 86400000 * 5,
    },
    {
      id: 'prm_002',
      user_id: userId,
      title: '走過歲月的窗',
      raw_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。請以「走過歲月的窗」為題，結合個人生活經驗，書寫你對時間、成長或環境變遷的觀察與體會。',
      corrected_text: '窗是室內與室外的界線，也是心靈凝視外界的途徑。請以「走過歲月的窗」為題，結合個人生活經驗，書寫你對時間、成長或環境變遷的觀察與體會。',
      prompt_type: '情意散文',
      created_at: Date.now() - 86400000 * 10,
      updated_at: Date.now() - 86400000 * 10,
    },
  ]);
});

// 2. Create prompt
promptsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<any>();
  const id = 'prm_' + Date.now();
  const now = Date.now();

  const payload = {
    id,
    user_id: userId,
    title: body.title || '自訂題目',
    raw_text: body.rawText || '',
    corrected_text: body.correctedText || body.rawText || '',
    prompt_type: body.promptType || '一般作文',
    image_r2_path: body.imageR2Path || '',
    created_at: now,
    updated_at: now,
  };

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        `INSERT INTO prompts (id, user_id, title, raw_text, corrected_text, prompt_type, image_r2_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          payload.id,
          payload.user_id,
          payload.title,
          payload.raw_text,
          payload.corrected_text,
          payload.prompt_type,
          payload.image_r2_path,
          payload.created_at,
          payload.updated_at
        )
        .run();
    } catch (err) {
      console.warn('[D1 Save Prompt Warning]', err);
    }
  }

  return c.json(payload);
});

// 3. OCR Simulation / API
promptsRouter.post('/ocr', async (c) => {
  const body = await c.req.json<{ image: string }>();
  const ai = new AIService(c.env);
  const result = await ai.performOCR(body.image || '');
  return c.json(result);
});
