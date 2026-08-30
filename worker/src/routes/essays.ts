import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const essaysRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

essaysRouter.use('*', authMiddleware);

// 1. List user essays
essaysRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (!c.env.DB) {
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
essaysRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (!c.env.DB) {
    return c.json({ error: 'Database not configured' }, 500);
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

// 3. Save / update essay & append operations
essaysRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    id?: string;
    promptId?: string;
    title?: string;
    content: string;
    status?: string;
    operations?: Array<{
      type: string;
      position?: number;
      length?: number;
      oldContent?: string;
      newContent?: string;
      source?: string;
    }>;
  }>();

  const id = body.id || `esy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const title = (body.title || '無標題作文').trim();
  const content = body.content || '';
  const wordCount = content.replace(/\s+/g, '').length;
  const status = body.status || 'draft';
  const promptId = body.promptId || null;
  const now = Date.now();

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO essays (id, user_id, prompt_id, title, current_content, word_count, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          current_content = excluded.current_content,
          word_count = excluded.word_count,
          status = excluded.status,
          updated_at = excluded.updated_at
      `)
        .bind(id, userId, promptId, title, content, wordCount, status, now, now)
        .run();

      // Insert operations if provided
      if (body.operations && body.operations.length > 0) {
        for (const op of body.operations) {
          const opId = `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await c.env.DB.prepare(`
            INSERT INTO essay_operations (id, essay_id, operation_type, position, length, old_content, new_content, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
            .bind(
              opId,
              id,
              op.type || 'INSERT',
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

// 4. AI Writing Assistance (Metaphor, expand, concise, emotion, etc.)
essaysRouter.post('/assist', async (c) => {
  const body = await c.req.json<{
    selectedText: string;
    action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene';
    fullContext?: string;
  }>();

  const aiService = new AIService(c.env);
  const result = await aiService.assistWriting(body.selectedText, body.action, body.fullContext);
  return c.json(result);
});
