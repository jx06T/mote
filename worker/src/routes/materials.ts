import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const materialsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

materialsRouter.use('*', authMiddleware);

// 1. List materials
materialsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (!c.env.DB) {
    return c.json([]);
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM materials WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(userId)
      .all();

    return c.json(
      (results || []).map((r: any) => ({
        ...r,
        people: r.people_json ? JSON.parse(r.people_json) : [],
        themes: r.themes_json ? JSON.parse(r.themes_json) : [],
        tags: r.tags_json ? JSON.parse(r.tags_json) : [],
      }))
    );
  } catch (err) {
    console.error('[D1 List Materials Error]', err);
    return c.json([], 500);
  }
});

// 2. Get single material
materialsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (!c.env.DB) {
    return c.json({ error: 'Database binding not configured' }, 500);
  }

  try {
    const mat: any = await c.env.DB.prepare(
      'SELECT * FROM materials WHERE id = ? AND user_id = ?'
    )
      .bind(id, userId)
      .first();

    if (!mat) {
      return c.json({ error: 'Material not found' }, 404);
    }

    return c.json({
      ...mat,
      people: mat.people_json ? JSON.parse(mat.people_json) : [],
      themes: mat.themes_json ? JSON.parse(mat.themes_json) : [],
      tags: mat.tags_json ? JSON.parse(mat.tags_json) : [],
    });
  } catch (err) {
    console.error('[D1 Get Material Error]', err);
    return c.json({ error: 'Failed to retrieve material' }, 500);
  }
});

// 3. Create or update material
materialsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const id = body.id || `mat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  const title = body.title || '無標題素材';
  const story = body.story || '';
  const peopleJson = JSON.stringify(body.people || []);
  const timeDesc = body.time || body.time_desc || '';
  const locationDesc = body.location || body.location_desc || '';
  const sceneDesc = body.scene || body.scene_desc || '';
  const dialogueDesc = body.dialogue || body.dialogue_desc || '';
  const emotionDesc = body.emotion || body.emotion_desc || '';
  const reflectionDesc = body.reflection || body.reflection_desc || '';
  const themesJson = JSON.stringify(body.themes || []);
  const tagsJson = JSON.stringify(body.tags || []);
  const sourceNoteId = body.source_quick_note_id || null;

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(`
        INSERT INTO materials (
          id, user_id, title, story, people_json, time_desc, location_desc,
          scene_desc, dialogue_desc, emotion_desc, reflection_desc,
          themes_json, tags_json, source_quick_note_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          story = excluded.story,
          people_json = excluded.people_json,
          time_desc = excluded.time_desc,
          location_desc = excluded.location_desc,
          scene_desc = excluded.scene_desc,
          dialogue_desc = excluded.dialogue_desc,
          emotion_desc = excluded.emotion_desc,
          reflection_desc = excluded.reflection_desc,
          themes_json = excluded.themes_json,
          tags_json = excluded.tags_json,
          updated_at = excluded.updated_at
      `)
        .bind(
          id,
          userId,
          title,
          story,
          peopleJson,
          timeDesc,
          locationDesc,
          sceneDesc,
          dialogueDesc,
          emotionDesc,
          reflectionDesc,
          themesJson,
          tagsJson,
          sourceNoteId,
          now,
          now
        )
        .run();
    } catch (err) {
      console.error('[D1 Save Material Error]', err);
      return c.json({ error: 'Failed to save material to database' }, 500);
    }
  }

  return c.json({
    id,
    user_id: userId,
    title,
    story,
    people: body.people || [],
    time: timeDesc,
    time_desc: timeDesc,
    location: locationDesc,
    location_desc: locationDesc,
    scene: sceneDesc,
    scene_desc: sceneDesc,
    dialogue: dialogueDesc,
    dialogue_desc: dialogueDesc,
    emotion: emotionDesc,
    emotion_desc: emotionDesc,
    reflection: reflectionDesc,
    reflection_desc: reflectionDesc,
    themes: body.themes || [],
    tags: body.tags || [],
    source_quick_note_id: sourceNoteId,
    created_at: now,
    updated_at: now,
  });
});

// 4. Delete material
materialsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (c.env.DB) {
    try {
      await c.env.DB.prepare('DELETE FROM materials WHERE id = ? AND user_id = ?')
        .bind(id, userId)
        .run();
    } catch (err) {
      console.error('[D1 Delete Material Error]', err);
      return c.json({ error: 'Failed to delete material' }, 500);
    }
  }

  return c.json({ success: true });
});

// 5. Material Interview (AI-guided deepening)
materialsRouter.post('/interview', async (c) => {
  const body = await c.req.json();
  const noteContent = body.noteContent || '';
  const history = body.history || [];
  const action = body.action || 'question'; // 'question' | 'summarize'

  const aiService = new AIService(c.env);

  if (action === 'summarize') {
    const summaryCard = await aiService.summarizeMaterialCard(noteContent, history);
    return c.json({ summaryCard });
  }

  const nextQuestion = await aiService.generateInterviewQuestion(noteContent, history);
  return c.json({ nextQuestion });
});

// 6. Reverse Search (Match materials with prompt)
materialsRouter.post('/reverse-search', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const promptText = body.promptText || '';

  let materialsList: any[] = [];
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM materials WHERE user_id = ? ORDER BY created_at DESC'
      )
        .bind(userId)
        .all();
      materialsList = (results || []).map((r: any) => ({
        ...r,
        people: r.people_json ? JSON.parse(r.people_json) : [],
        themes: r.themes_json ? JSON.parse(r.themes_json) : [],
        tags: r.tags_json ? JSON.parse(r.tags_json) : [],
      }));
    } catch (err) {
      console.error('[D1 Reverse Search Error]', err);
    }
  }

  const aiService = new AIService(c.env);
  const matches = await aiService.matchMaterialsWithPrompt(promptText, materialsList);
  return c.json({ matches });
});
