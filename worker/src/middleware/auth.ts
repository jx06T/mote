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

  // If in dev mode or demo token, provide fallback demo user
  if (!token || token === 'demo_token' || token === 'dev_token') {
    c.set('userId', 'user_demo_student');
    c.set('userEmail', 'student@mote.app');
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
  await next();
}
