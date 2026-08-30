import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const essaysRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. List user essays (Members from D1, Guests receive [])
essaysRouter.get('/', optionalAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  if (!userId || !c.env.DB) {
    return c.json([]);
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM essays WHERE user_id = ? ORDER BY updated_at DESC'
    )
      .bind(userId)
      .all();
    return c.json(results || []);
  } catch (err) {
    console.error('[D1 List Essays Error]', err);
    return c.json([], 500);
  }
});

// 2. Get single essay & its revision operations
essaysRouter.get('/:id', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (!userId || !c.env.DB) {
    return c.json({ error: 'Essay not found' }, 404);
  }

  try {
    const essay = await c.env.DB.prepare(
      'SELECT * FROM essays WHERE id = ? AND user_id = ?'
    )
      .bind(id, userId)
      .first();

    if (!essay) {
      return c.json({ error: 'Essay not found' }, 404);
    }

    const { results: operations } = await c.env.DB.prepare(
      'SELECT * FROM essay_operations WHERE essay_id = ? ORDER BY created_at ASC'
    )
      .bind(id)
      .all();

    return c.json({ essay, operations: operations || [] });
  } catch (err) {
    console.error('[D1 Get Essay Error]', err);
    return c.json({ error: 'Failed to retrieve essay' }, 500);
  }
});

// 3. Save or update essay with optional operations (Members only on cloud D1)
essaysRouter.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const id = body.id || `esy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const title = body.title || '無標題作文';
  const content = body.content || '';
  const promptId = body.promptId || null;
  const status = body.status || 'draft';
  const wordCount = body.wordCount || content.replace(/\s+/g, '').length;
  const now = Date.now();

  if (c.env.DB) {
    try {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM essays WHERE id = ? AND user_id = ?'
      )
        .bind(id, userId)
        .first();

      if (existing) {
        await c.env.DB.prepare(`
          UPDATE essays SET 
            title = ?, current_content = ?, word_count = ?, status = ?, updated_at = ?
          WHERE id = ? AND user_id = ?
        `)
          .bind(title, content, wordCount, status, now, id, userId)
          .run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO essays (id, user_id, prompt_id, title, current_content, word_count, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(id, userId, promptId, title, content, wordCount, status, now, now)
          .run();
      }

      // Record Operation Log if provided
      if (body.operations && Array.isArray(body.operations)) {
        for (const op of body.operations) {
          const opId = op.id || `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await c.env.DB.prepare(`
            INSERT INTO essay_operations (id, essay_id, user_id, operation_type, position, length, old_content, new_content, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
            .bind(
              opId,
              id,
              userId,
              op.operationType || 'REPLACE',
              op.position || 0,
              op.length || 0,
              op.oldContent || null,
              op.newContent || null,
              op.source || 'user',
              now
            )
            .run();
        }
      }
    } catch (err) {
      console.error('[D1 Save Essay Error]', err);
      return c.json({ error: 'Failed to save essay to database' }, 500);
    }
  }

  return c.json({
    id,
    user_id: userId,
    prompt_id: promptId,
    title,
    current_content: content,
    word_count: wordCount,
    status,
    created_at: now,
    updated_at: now,
  });
});

// 4. AI Writing Assistance (Members only - Member-exclusive Feature)
essaysRouter.post('/assist', authMiddleware, async (c) => {
  const body = await c.req.json<{
    selectedText: string;
    action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene';
    fullContext?: string;
  }>();

  const aiService = new AIService(c.env);
  const result = await aiService.assistWriting(body.selectedText, body.action, body.fullContext);
  return c.json(result);
});

// 5. Delete essay & its revision operations (Members only on cloud D1)
essaysRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (!userId || !c.env.DB) {
    return c.json({ error: 'Unauthorized or database unavailable' }, 401);
  }

  try {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM essays WHERE id = ? AND user_id = ?'
    )
      .bind(id, userId)
      .first();

    if (!existing) {
      return c.json({ error: 'Essay not found' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM essay_operations WHERE essay_id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    await c.env.DB.prepare('DELETE FROM essays WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    return c.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[D1 Delete Essay Error]', err);
    return c.json({ error: 'Failed to delete essay' }, 500);
  }
});

