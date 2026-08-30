import { cors } from 'hono/cors';
import { Bindings } from '../types';

export const corsMiddleware = cors({
  origin: (origin, c) => {
    if (!origin) return '*';
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+(:\d+)?$/.test(origin)
    ) {
      return origin;
    }

    const envOrigins = (c.env as Bindings).ALLOWED_ORIGINS;
    const allowed = envOrigins?.split(',').map((s) => s.trim()) ?? [];
    if (allowed.includes(origin)) return origin;
    if (origin.startsWith('https://') && origin.endsWith('.pages.dev')) return origin;

    return origin;
  },
  allowHeaders: ['Content-Type', 'Authorization', 'x-custom-auth'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
