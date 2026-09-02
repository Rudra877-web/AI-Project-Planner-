import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimit';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Behind a proxy (Railway/Render/Fly) the client IP arrives via
  // X-Forwarded-For; without this the rate limiter would see one shared IP.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // The API serves JSON only; CSP is the client's concern and a default
      // policy here would break nothing but confuse debugging.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  /**
   * In development Vite proxies /api, so requests are same-origin and CORS never
   * engages. This exists for deployments that serve the client from a different
   * origin — `credentials` is required for the session cookie, which in turn
   * forbids a wildcard origin, hence the explicit allow-list.
   */
  app.use(
    cors({
      origin: env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean),
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', globalLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
