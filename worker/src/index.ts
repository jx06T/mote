import { Hono } from 'hono';
import { Bindings, Variables } from './types';
import { corsMiddleware } from './middleware/cors';
import { authRouter } from './routes/auth';
import { quickNotesRouter } from './routes/quickNotes';
import { materialsRouter } from './routes/materials';
import { promptsRouter } from './routes/prompts';
import { essaysRouter } from './routes/essays';
import { examsRouter } from './routes/exams';
import { analysisRouter } from './routes/analysis';
import { vocabularyRouter } from './routes/vocabulary';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Global Middlewares
app.use('*', corsMiddleware);

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', name: 'mote-api', version: '1.0.0' });
});

// Route mountings
app.route('/api/auth', authRouter);
app.route('/api/quick-notes', quickNotesRouter);
app.route('/api/materials', materialsRouter);
app.route('/api/prompts', promptsRouter);
app.route('/api/essays', essaysRouter);
app.route('/api/exams', examsRouter);
app.route('/api/analysis', analysisRouter);
app.route('/api/vocabulary', vocabularyRouter);

// Fallback to static assets if running as a unified Cloudflare Worker with Assets
app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.notFound();
});

export default app;
