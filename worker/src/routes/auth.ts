import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

export const authRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Get current user profile
authRouter.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  return c.json({
    id: userId,
    email: c.get('userEmail') || 'student@mote.app',
    name: '高中學員',
    avatarUrl: '',
    role: 'student',
  });
});

// Demo login / token refresh
authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = 'mote_session_' + Date.now();

  return c.json({
    success: true,
    token,
    user: {
      id: 'user_demo_student',
      email: body.email || 'student@mote.app',
      name: body.name || '高中學員',
    },
  });
});

// Logout
authRouter.post('/logout', async (c) => {
  return c.json({ success: true, message: '已安全登出' });
});
