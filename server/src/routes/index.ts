import { Router } from 'express';
import { env } from '../config/env';
import { authRouter } from './auth.routes';
import { projectsRouter } from './projects.routes';
import { notificationsRouter } from './notifications.routes';
import { technologyCatalogRouter } from './technologyCatalog.routes';

export const apiRouter = Router();

/**
 * Health/capability probe. The client reads `aiEngine` at start-up so the UI can
 * say which engine is producing plans — the key itself never leaves the server.
 */
apiRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'buildflow-api',
    aiEngine: env.aiEnabled ? 'claude' : 'offline',
    database: env.DB_DRIVER,
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/technologies', technologyCatalogRouter);
