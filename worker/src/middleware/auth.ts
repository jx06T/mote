import { Context, Next } from 'hono';
import { Bindings, Variables } from '../types';

/**
 * 從請求中解析 Token (Bearer 標頭或 Cookie)
 */
function extractToken(c: Context<{ Bindings: Bindings; Variables: Variables }>): string {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = c.req.header('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/mote_session=([^;]+)/);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * 嚴格認證中介軟體 (Strict Auth Middleware)
 * 適用於會員專屬端點 (寫作輔助、模擬考、評析報告、雲端持久儲存)
 * 若未提供有效 Token 或 Session 過期，立即回傳 HTTP 401
 */
export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const token = extractToken(c);

  if (!token) {
    return c.json(
      {
        status: 'error',
        error: 'Unauthorized',
        message: '未提供有效之授權憑證，請先登入 Google 帳號',
      },
      401
    );
  }

  if (c.env.DB) {
    try {
      const session = await c.env.DB.prepare(
        `SELECT s.user_id, s.expires_at, u.email, u.name 
         FROM sessions s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.token_hash = ?`
      )
        .bind(token)
        .first<{ user_id: string; expires_at: number; email: string; name: string }>();

      if (session && session.expires_at > Date.now()) {
        c.set('userId', session.user_id);
        c.set('userEmail', session.email);
        await next();
        return;
      }
    } catch (err) {
      console.error('[Auth Middleware DB Error]', err);
    }
  }

  return c.json(
    {
      status: 'error',
      error: 'Unauthorized',
      message: '授權憑證無效或登入已過期，請重新登入',
    },
    401
  );
}

/**
 * 可選認證中介軟體 (Optional Auth Middleware)
 * 適用於訪客與會員皆可存取之公開/試用端點 (素材訪談無狀態生成、公開題目清單、反向推薦)
 * 若有有效 Token 則注入 userId，若無則注入 null，不阻擋請求
 */
export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const token = extractToken(c);

  if (token && c.env.DB) {
    try {
      const session = await c.env.DB.prepare(
        `SELECT s.user_id, s.expires_at, u.email, u.name 
         FROM sessions s 
         JOIN users u ON s.user_id = u.id 
         WHERE s.token_hash = ?`
      )
        .bind(token)
        .first<{ user_id: string; expires_at: number; email: string; name: string }>();

      if (session && session.expires_at > Date.now()) {
        c.set('userId', session.user_id);
        c.set('userEmail', session.email);
        await next();
        return;
      }
    } catch (err) {
      console.warn('[Optional Auth DB Warning]', err);
    }
  }

  c.set('userId', null as any);
  c.set('userEmail', null as any);
  await next();
}
