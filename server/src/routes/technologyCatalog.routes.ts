import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as technologies from '../controllers/technologies.controller';

export const technologyCatalogRouter = Router();
technologyCatalogRouter.get('/', requireAuth, technologies.catalog);
