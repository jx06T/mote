import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

export const vocabularyRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

vocabularyRouter.use('*', authMiddleware);

// 1. List hard characters
vocabularyRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (!c.env.DB) {
    return c.json([]);
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM hard_characters WHERE user_id = ? ORDER BY mastery_level ASC, created_at DESC'
    )
      .bind(userId)
      .all();

    return c.json(results || []);
  } catch (err) {
    console.error('[D1 List Hard Characters Error]', err);
    return c.json([], 500);
  }
});

// 2. Add hard character
vocabularyRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ characterText: string; zhuyin?: string; sourceEssayId?: string }>();
  const charText = (body.characterText || '').trim();

  if (!charText) {
    return c.json({ error: '生難字不可為空' }, 400);
  }

  const id = `voc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO hard_characters (id, user_id, character_text, zhuyin, source_essay_id, mastery_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `)
        .bind(id, userId, charText, body.zhuyin || '', body.sourceEssayId || null, now, now)
        .run();
    } catch (err) {
      console.error('[D1 Add Hard Character Error]', err);
      return c.json({ error: 'Failed to save hard character' }, 500);
    }
  }

  return c.json({
    id,
    character_text: charText,
    zhuyin: body.zhuyin || '',
    mastery_level: 1,
    created_at: now,
  });
});

// 3. Delete hard character
vocabularyRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (c.env.DB) {
    try {
      await c.env.DB.prepare('DELETE FROM hard_characters WHERE id = ? AND user_id = ?')
        .bind(id, userId)
        .run();
      return c.json({ success: true });
    } catch (err) {
      console.error('[D1 Delete Hard Character Error]', err);
      return c.json({ error: 'Failed to delete hard character' }, 500);
    }
  }

  return c.json({ success: true });
});
