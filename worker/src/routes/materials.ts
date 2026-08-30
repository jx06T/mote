import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/ai/gemini';

export const materialsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

materialsRouter.use('*', authMiddleware);

// 1. List materials
materialsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  if (c.env.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM materials WHERE user_id = ? ORDER BY created_at DESC'
      )
        .bind(userId)
        .all();
      return c.json(
        results.map((r: any) => ({
          ...r,
          people: r.people_json ? JSON.parse(r.people_json) : [],
          themes: r.themes_json ? JSON.parse(r.themes_json) : [],
        }))
      );
    } catch (err) {
      console.warn('[D1 List Materials Warning]', err);
    }
  }

  // Fallback demo materials
  return c.json([
    {
      id: 'mat_001',
      user_id: userId,
      title: '老校門與暴雨後的槐樹',
      story: '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。風吹得雨絲斜斜掃進來，大家相視苦笑，那種共度狼狽的默契反而讓平淡的放學時光變得難忘。',
      people: ['我', '同班同學', '警衛叔叔'],
      time: '初秋某個週五傍晚',
      location: '老校門邊屋簷下',
      scene: '地面水窪倒映著昏黃路燈，落葉隨流水打轉。',
      dialogue: '「這雨短時間停不了，但挺舒服的。」',
      emotion: '由焦慮無奈轉為平靜溫暖。',
      reflection: '人生的某些意外停頓，往往是回望生活最好的契機。',
      themes: ['時間與記憶', '陪伴與默契', '生活留白'],
      created_at: Date.now() - 86400000 * 3,
      updated_at: Date.now() - 86400000 * 3,
    },
    {
      id: 'mat_002',
      user_id: userId,
      title: '廚房玻璃上的霧氣笑臉',
      story: '寒流來襲的夜晚，阿嬤在廚房燉熱騰騰的白蘿蔔排骨湯。滾沸的蒸氣把窗戶玻璃蒙上一層厚厚的水霧。阿嬤轉身用手指在玻璃上畫了一個歪歪的笑臉，那一瞬間廚房裡的熱氣彷彿驅散了整個冬天的寒意。',
      people: ['阿嬤', '我'],
      time: '冬夜晚餐前',
      location: '老家廚房',
      scene: '微黃燈光下白氣繚繞，水滴順著玻璃慢慢滑落。',
      dialogue: '「趁熱喝一碗，身子就暖了。」',
      emotion: '純粹而踏實的幸福感。',
      reflection: '親情的重量往往不在大言語，而在一碗熱湯與無意間的童心裡。',
      themes: ['親情溫暖', '家的記憶', '平凡幸福'],
      created_at: Date.now() - 86400000 * 7,
      updated_at: Date.now() - 86400000 * 7,
    },
  ]);
});

// 2. Get single material
materialsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  if (c.env.DB) {
    try {
      const mat: any = await c.env.DB.prepare('SELECT * FROM materials WHERE id = ? AND user_id = ?')
        .bind(id, userId)
        .first();
      if (mat) {
        return c.json({
          ...mat,
          people: mat.people_json ? JSON.parse(mat.people_json) : [],
          themes: mat.themes_json ? JSON.parse(mat.themes_json) : [],
        });
      }
    } catch (err) {
      console.warn('[D1 Get Material Warning]', err);
    }
  }

  return c.json({
    id,
    user_id: userId,
    title: '老校門與暴雨後的槐樹',
    story: '那天放學下起暴雨，老校門邊的槐樹落了一地青黃葉子，大家都擠在窄小的警衛室屋簷下等雨停。',
    people: ['我', '同學'],
    time: '初秋放學',
    location: '校門口',
    scene: '水窪與落葉',
    dialogue: '「雨停了再走吧。」',
    emotion: '由焦慮轉為寧靜',
    reflection: '學會在等待中發現美好的細節。',
    themes: ['生活片刻', '記憶'],
    created_at: Date.now(),
    updated_at: Date.now(),
  });
});

// 3. Save material card
materialsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<any>();
  const id = body.id || 'mat_' + Date.now();
  const now = Date.now();

  const payload = {
    id,
    user_id: userId,
    title: body.title || '無標題素材',
    story: body.story || '',
    people_json: JSON.stringify(body.people || []),
    time_desc: body.time || '',
    location_desc: body.location || '',
    scene_desc: body.scene || '',
    dialogue_desc: body.dialogue || '',
    emotion_desc: body.emotion || '',
    reflection_desc: body.reflection || '',
    themes_json: JSON.stringify(body.themes || []),
    created_at: now,
    updated_at: now,
  };

  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        `INSERT OR REPLACE INTO materials 
        (id, user_id, title, story, people_json, time_desc, location_desc, scene_desc, dialogue_desc, emotion_desc, reflection_desc, themes_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          payload.id,
          payload.user_id,
          payload.title,
          payload.story,
          payload.people_json,
          payload.time_desc,
          payload.location_desc,
          payload.scene_desc,
          payload.dialogue_desc,
          payload.emotion_desc,
          payload.reflection_desc,
          payload.themes_json,
          payload.created_at,
          payload.updated_at
        )
        .run();
    } catch (err) {
      console.warn('[D1 Save Material Warning]', err);
    }
  }

  return c.json({ success: true, material: payload });
});

// 4. Material Interview - Next AI Question
materialsRouter.post('/interview/ask', async (c) => {
  const body = await c.req.json<{
    noteContent: string;
    messages: Array<{ role: string; content: string }>;
  }>();

  const ai = new AIService(c.env);
  const question = await ai.generateInterviewQuestion(
    body.noteContent || '',
    body.messages || []
  );

  return c.json({ question });
});

// 5. Material Interview - Summarize into Material Card
materialsRouter.post('/interview/summarize', async (c) => {
  const body = await c.req.json<{
    noteContent: string;
    messages: Array<{ role: string; content: string }>;
  }>();

  const ai = new AIService(c.env);
  const cardData = await ai.summarizeMaterialCard(
    body.noteContent || '',
    body.messages || []
  );

  return c.json({ card: cardData });
});

// 6. Reverse search / rank materials for a prompt
materialsRouter.post('/reverse-search', async (c) => {
  const body = await c.req.json<{
    promptText: string;
    materials?: any[];
  }>();

  const ai = new AIService(c.env);
  const materials = body.materials || [];
  const results = await ai.rankMaterialsForPrompt(body.promptText || '', materials);

  return c.json({ recommendations: results });
});
