import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

export const vocabularyRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

vocabularyRouter.use('*', authMiddleware);

// 1. List hard characters
vocabularyRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM hard_characters WHERE user_id = ? ORDER BY mastery_level ASC, created_at DESC'
      )
        .bind(userId)
        .all();
      if (results && results.length > 0) return c.json(results);
    } catch (err) {
      console.warn('[D1 List Hard Characters Warning]', err);
    }
  }

  return c.json([
    {
      id: 'voc_01',
      character_text: '羨',
      zhuyin: 'ㄒㄧㄢˋ',
      source_essay_id: 'esy_001',
      mastery_level: 2,
    },
    {
      id: 'voc_02',
      character_text: '櫺',
      zhuyin: 'ㄌㄧㄥˊ',
      source_essay_id: 'esy_001',
      mastery_level: 1,
    },
    {
      id: 'voc_03',
      character_text: '謐',
      zhuyin: 'ㄇㄧˋ',
      source_essay_id: 'esy_001',
      mastery_level: 3,
    },
  ]);
});

// 2. Add hard character
vocabularyRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ characterText: string; zhuyin?: string; sourceEssayId?: string }>();
  const id = 'voc_' + Date.now();
  const now = Date.now();

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        'INSERT INTO hard_characters (id, user_id, character_text, zhuyin, source_essay_id, mastery_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)'
      )
        .bind(id, userId, body.characterText, body.zhuyin || '', body.sourceEssayId || null, now, now)
        .run();
    } catch (err) {
      console.warn('[D1 Add Hard Character Warning]', err);
    }
  }

  return c.json({
    id,
    character_text: body.characterText,
    zhuyin: body.zhuyin,
    mastery_level: 0,
  });
});
