import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

export const quickNotesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

quickNotesRouter.use('*', authMiddleware);

// List quick notes
quickNotesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM quick_notes WHERE user_id = ? AND status != "archived" ORDER BY created_at DESC'
      )
        .bind(userId)
        .all();
      return c.json(results);
    } catch (err) {
      console.warn('[D1 List QuickNotes Warning]', err);
    }
  }

  // In-memory fallback
  return c.json([
    {
      id: 'qn_001',
      user_id: userId,
      content: '今天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都躲在屋簷下等雨停。',
      status: 'active',
      created_at: Date.now() - 3600000 * 4,
      updated_at: Date.now() - 3600000 * 4,
    },
    {
      id: 'qn_002',
      user_id: userId,
      content: '阿嬤在廚房燉蘿蔔湯，蒸氣把廚房玻璃全蒙上一層霧，她在上面畫了一個笑臉。',
      status: 'active',
      created_at: Date.now() - 86400000 * 2,
      updated_at: Date.now() - 86400000 * 2,
    },
  ]);
});

// Create quick note
quickNotesRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ content: string }>();
  if (!body.content || !body.content.trim()) {
    return c.json({ error: '內容不能為空' }, 400);
  }

  const id = 'qn_' + Date.now();
  const now = Date.now();

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        'INSERT INTO quick_notes (id, user_id, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(id, userId, body.content.trim(), 'active', now, now)
        .run();
    } catch (err) {
      console.warn('[D1 Create QuickNote Warning]', err);
    }
  }

  return c.json({
    id,
    user_id: userId,
    content: body.content.trim(),
    status: 'active',
    created_at: now,
    updated_at: now,
  });
});

// Delete or archive note
quickNotesRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const noteId = c.req.param('id');

  if (c.env.DB) {
    try {
      await c.env.DB.prepare('DELETE FROM quick_notes WHERE id = ? AND user_id = ?')
        .bind(noteId, userId)
        .run();
    } catch (err) {
      console.warn('[D1 Delete QuickNote Warning]', err);
    }
  }

  return c.json({ success: true, message: '已刪除記錄' });
});
