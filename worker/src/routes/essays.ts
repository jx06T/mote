import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const essaysRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

essaysRouter.use('*', authMiddleware);

// 1. List user essays
essaysRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM essays WHERE user_id = ? ORDER BY updated_at DESC'
      )
        .bind(userId)
        .all();
      if (results && results.length > 0) return c.json(results);
    } catch (err) {
      console.warn('[D1 List Essays Warning]', err);
    }
  }

  return c.json([
    {
      id: 'esy_001',
      user_id: userId,
      prompt_id: 'prm_001',
      title: '當我轉身看見那道光',
      current_content: '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。風吹得雨絲斜斜掃進來，大家相視苦笑。我看著水窪倒映出的微光，忽然明白那些看似狼狽的等待，也是時光留給我們的溫柔片刻。',
      word_count: 128,
      status: 'analyzed',
      created_at: Date.now() - 86400000 * 2,
      updated_at: Date.now() - 86400000 * 2,
    },
  ]);
});

// 2. Get single essay & operations
essaysRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  let essay: any = null;
  let operations: any[] = [];

  if (c.env.DB) {
    try {
      essay = await c.env.DB.prepare('SELECT * FROM essays WHERE id = ? AND user_id = ?')
        .bind(id, userId)
        .first();

      const ops = await c.env.DB.prepare(
        'SELECT * FROM essay_operations WHERE essay_id = ? ORDER BY created_at ASC'
      )
        .bind(id)
        .all();
      operations = ops.results || [];
    } catch (err) {
      console.warn('[D1 Get Essay Warning]', err);
    }
  }

  if (!essay) {
    essay = {
      id,
      user_id: userId,
      title: '當我轉身看見那道光',
      current_content: '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。風吹得雨絲斜斜掃進來，大家相視苦笑。',
      word_count: 72,
      status: 'draft',
      created_at: Date.now() - 3600000,
      updated_at: Date.now(),
    };
  }

  return c.json({ essay, operations });
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

  const id = body.id || 'esy_' + Date.now();
  const now = Date.now();
  const wordCount = body.content ? body.content.replace(/\s+/g, '').length : 0;

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO essays (id, user_id, prompt_id, title, current_content, word_count, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM essays WHERE id = ?), ?), ?)`
      )
        .bind(
          id,
          userId,
          body.promptId || null,
          body.title || '無標題作文',
          body.content || '',
          wordCount,
          body.status || 'draft',
          id,
          now,
          now
        )
        .run();

      // Append operation logs
      if (body.operations && body.operations.length > 0) {
        for (const op of body.operations) {
          const opId = 'op_' + Math.random().toString(36).substring(2, 9);
          await c.env.DB.prepare(
            `INSERT INTO essay_operations (id, essay_id, user_id, operation_type, position, length, old_content, new_content, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              opId,
              id,
              userId,
              op.type,
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
      console.warn('[D1 Save Essay Warning]', err);
    }
  }

  return c.json({
    success: true,
    essay: {
      id,
      user_id: userId,
      title: body.title || '無標題作文',
      current_content: body.content,
      word_count: wordCount,
      status: body.status || 'draft',
      updated_at: now,
    },
  });
});

// 4. AI Writing Assistance
essaysRouter.post('/assist', async (c) => {
  const body = await c.req.json<{
    sentence: string;
    action: 'metaphor' | 'imitation' | 'expand' | 'concise' | 'emotion' | 'scene';
    contextEssay?: string;
  }>();

  const ai = new AIService(c.env);
  const result = await ai.assistWriting(
    body.sentence || '',
    body.action || 'metaphor',
    body.contextEssay
  );

  return c.json(result);
});
