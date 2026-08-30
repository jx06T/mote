import { Hono, Context } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export const authRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

type AuthContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// 1. 取得當前已登入使用者資料
authRouter.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  if (c.env.DB) {
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<{ id: string; email: string; name: string; avatar_url: string; created_at: number }>();

    if (user) {
      return c.json({
        id: user.id,
        email: user.email,
        name: user.name || '高中學員',
        avatarUrl: user.avatar_url || '',
      });
    }
  }

  return c.json({
    id: userId,
    email: c.get('userEmail') || '',
    name: '高中學員',
    avatarUrl: '',
  });
});

function getOAuthInfo(c: AuthContext) {
  let explicitRedirectUri = c.req.query('redirect_uri') || (c.env as any).GOOGLE_REDIRECT_URI;

  let frontendOrigin = c.env.FRONTEND_URL || '';
  if (!frontendOrigin) {
    const xfHost = c.req.header('x-forwarded-host') || c.req.header('host');
    const xfProto = c.req.header('x-forwarded-proto') || 'http';
    if (xfHost && !xfHost.includes('8787')) {
      frontendOrigin = `${xfProto}://${xfHost}`;
    } else {
      frontendOrigin = 'http://localhost:3000';
    }
  }
  frontendOrigin = frontendOrigin.replace(/\/+$/, '');

  const redirectUri = explicitRedirectUri || `${frontendOrigin}/api/auth/google/callback`;

  return { frontendOrigin, redirectUri };
}

// 2. 發起 Google OAuth 重新導向
authRouter.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: 'GOOGLE_CLIENT_ID not configured' }, 500);
  }

  const { redirectUri } = getOAuthInfo(c);
  const scope = encodeURIComponent('openid email profile');
  const state = Math.random().toString(36).substring(2);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;

  return c.redirect(googleAuthUrl);
});

// 3. Google OAuth 回呼處理函式
const handleGoogleCallback = async (c: AuthContext) => {
  const code = c.req.query('code');
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  const { frontendOrigin, redirectUri } = getOAuthInfo(c);

  if (!code || !clientId || !clientSecret) {
    return c.redirect(`${frontendOrigin}/login?error=oauth_config_missing`);
  }

  try {
    // A. 交換 Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => '');
      console.error('[Google OAuth Token Exchange Error]', tokenRes.status, errText);
      return c.redirect(`${frontendOrigin}/login?error=token_exchange_failed`);
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // B. 取得 Google 個人檔案
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return c.redirect(`${frontendOrigin}/login?error=userinfo_failed`);
    }

    const googleUser: any = await userRes.json();
    const googleId = googleUser.id;
    const email = googleUser.email;
    const name = googleUser.name || '高中學員';
    const avatarUrl = googleUser.picture || '';

    // C. 寫入或更新 D1 users 表
    const now = Date.now();
    let userId = `usr_${googleId.slice(0, 12)}`;

    if (c.env.DB) {
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE google_id = ?'
      )
        .bind(googleId)
        .first<{ id: string }>();

      if (existingUser) {
        userId = existingUser.id;
        await c.env.DB.prepare(
          'UPDATE users SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
        )
          .bind(name, avatarUrl, now, userId)
          .run();
      } else {
        await c.env.DB.prepare(
          `INSERT INTO users (id, google_id, email, name, avatar_url, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(userId, googleId, email, name, avatarUrl, now, now)
          .run();
      }

      // D. 建立 Session
      const sessionId = 'ses_' + Math.random().toString(36).slice(2) + now;
      const sessionToken = 'tok_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 天

      await c.env.DB.prepare(
        `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
        .bind(sessionId, userId, sessionToken, expiresAt, now)
        .run();

      // 設定 Cookie 並跳轉回首頁
      c.header('Set-Cookie', `mote_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
      const redirectParams = new URLSearchParams({
        auth_token: sessionToken,
        user_id: userId,
        user_name: name,
        user_email: email,
        avatar_url: avatarUrl,
      });
      return c.redirect(`${frontendOrigin}/?${redirectParams.toString()}`);
    }

    return c.redirect(`${frontendOrigin}/?login=success`);
  } catch (err) {
    console.error('[Google OAuth Callback Error]', err);
    return c.redirect(`${frontendOrigin}/login?error=oauth_internal_error`);
  }
};

authRouter.get('/google/callback', handleGoogleCallback);
authRouter.get('/callback', handleGoogleCallback);

// 4. 安全登出
authRouter.post('/logout', optionalAuthMiddleware, async (c) => {
  const cookieHeader = c.req.header('Cookie');
  let token = '';
  if (cookieHeader) {
    const match = cookieHeader.match(/mote_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (token && c.env.DB) {
    try {
      await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
        .bind(token)
        .run();
    } catch (err) {
      console.warn('[Logout Error]', err);
    }
  }

  c.header('Set-Cookie', 'mote_session=; Path=/; HttpOnly; Max-Age=0');
  return c.json({ success: true, message: '已安全登出' });
});
