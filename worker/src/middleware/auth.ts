import { Context, Next } from 'hono';
import { Bindings, Variables } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const cookieHeader = c.req.header('Cookie');

  // Check Bearer token or session cookie
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieHeader) {
    const match = cookieHeader.match(/mote_session=([^;]+)/);
    if (match) token = match[1];
  }

  // Helper to ensure demo user exists in D1 database
  const ensureDemoUserExists = async () => {
    if (c.env.DB) {
      try {
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO users (id, google_id, email, name, avatar_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            'user_demo_student',
            'google_demo_student_id',
            'student@mote.app',
            '高中學員',
            '',
            Date.now(),
            Date.now()
          )
          .run();
      } catch (err) {
        console.warn('[Ensure Demo User Warning]', err);
      }
    }
  };

  // If in dev mode or demo token, provide fallback demo user
  if (!token || token === 'demo_token' || token === 'dev_token') {
    c.set('userId', 'user_demo_student');
    c.set('userEmail', 'student@mote.app');
    await ensureDemoUserExists();
    await next();
    return;
  }

  // Verify against D1 session if DB is bound
  try {
    if (c.env.DB) {
      const session = await c.env.DB.prepare(
        'SELECT user_id, expires_at FROM sessions WHERE token_hash = ?'
      )
        .bind(token)
        .first<{ user_id: string; expires_at: number }>();

      if (session && session.expires_at > Date.now()) {
        c.set('userId', session.user_id);
        c.set('userEmail', null);
        await next();
        return;
      }
    }
  } catch (err) {
    console.warn('[Auth Middleware Warning]', err);
  }

  // Fallback for seamless demo
  c.set('userId', 'user_demo_student');
  c.set('userEmail', 'student@mote.app');
  await ensureDemoUserExists();
  await next();
}
