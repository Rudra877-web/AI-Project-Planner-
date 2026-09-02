import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as notifications from '../controllers/notifications.controller';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', notifications.list);
notificationsRouter.post('/read-all', notifications.markAllRead);
notificationsRouter.patch('/:id/read', notifications.markRead);
notificationsRouter.delete('/:id', notifications.remove);
