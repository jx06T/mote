import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

export const quickNotesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

quickNotesRouter.use('*', authMiddleware);

// 1. List all quick notes for the authenticated user
quickNotesRouter.get('/', async (c) => {
  const userId = c.get('userId');

  if (!c.env.DB) {
    return c.json([]);
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM quick_notes WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(userId)
      .all();

    return c.json(results || []);
  } catch (err) {
    console.error('[D1 List QuickNotes Error]', err);
    return c.json([], 500);
  }
});

// 2. Create a new quick note
quickNotesRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const content = (body.content || '').trim();

  if (!content) {
    return c.json({ error: '筆記內容不可為空' }, 400);
  }

  const id = `qn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  if (!c.env.DB) {
    return c.json({ error: 'Database binding not configured' }, 500);
  }

  try {
    await c.env.DB.prepare(`
      INSERT INTO quick_notes (id, user_id, content, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `)
      .bind(id, userId, content, now, now)
      .run();

    return c.json({
      id,
      user_id: userId,
      content,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    console.error('[D1 Create QuickNote Error]', err);
    return c.json({ error: 'Failed to create quick note' }, 500);
  }
});

// 3. Delete a quick note
quickNotesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (!c.env.DB) {
    return c.json({ error: 'Database binding not configured' }, 500);
  }

  try {
    await c.env.DB.prepare('DELETE FROM quick_notes WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    return c.json({ success: true });
  } catch (err) {
    console.error('[D1 Delete QuickNote Error]', err);
    return c.json({ error: 'Failed to delete quick note' }, 500);
  }
});
