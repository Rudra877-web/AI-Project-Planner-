import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { loadProject } from '../middleware/ownership';
import { aiLimiter } from '../middleware/rateLimit';
import { validateBody, validateQuery } from '../middleware/validate';

import * as projects from '../controllers/projects.controller';
import * as requirements from '../controllers/requirements.controller';
import * as technologies from '../controllers/technologies.controller';
import * as pages from '../controllers/pages.controller';
import * as tables from '../controllers/databaseTables.controller';
import * as fields from '../controllers/databaseFields.controller';
import * as endpoints from '../controllers/apiEndpoints.controller';
import * as phases from '../controllers/phases.controller';
import * as tasks from '../controllers/tasks.controller';
import * as testCases from '../controllers/testCases.controller';
import * as ai from '../controllers/ai.controller';
import * as changes from '../controllers/changes.controller';

import {
  createProjectSchema,
  generatePlanSchema,
  changeRequestSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validators/project.validators';
import {
  addDependencySchema,
  createEndpointSchema,
  createFieldSchema,
  createPageSchema,
  createPhaseSchema,
  createRequirementSchema,
  createTableSchema,
  createTaskSchema,
  createTechnologySchema,
  createTestCaseSchema,
  moveTaskSchema,
  updateEndpointSchema,
  updateFieldSchema,
  updatePageSchema,
  updatePhaseSchema,
  updateRequirementSchema,
  updateTableSchema,
  updateTaskSchema,
  updateTechnologySchema,
  updateTestCaseSchema,
} from '../validators/resources.validators';
import { chatMessageSchema, debugRequestSchema } from '../validators/ai.validators';

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

// ── The project itself ──────────────────────────────────────────────────────

projectsRouter.get('/', validateQuery(listProjectsQuerySchema), projects.list);
projectsRouter.post('/', validateBody(createProjectSchema), projects.create);
projectsRouter.post(
  '/generate',
  aiLimiter,
  validateBody(generatePlanSchema),
  projects.generate,
);

// Every route below acts on one project the caller owns.
const project = Router({ mergeParams: true });
projectsRouter.use('/:projectId', loadProject, project);

project.get('/', projects.get);
project.patch('/', validateBody(updateProjectSchema), projects.update);
project.delete('/', projects.remove);
project.post('/readme', projects.readme);
project.get('/analytics', projects.analytics);

// Requirements
project.get('/requirements', requirements.list);
project.post('/requirements', validateBody(createRequirementSchema), requirements.create);
project.patch('/requirements/:id', validateBody(updateRequirementSchema), requirements.update);
project.delete('/requirements/:id', requirements.remove);

// Tech stack
project.get('/technologies', technologies.list);
project.post('/technologies', validateBody(createTechnologySchema), technologies.create);
project.patch('/technologies/:id', validateBody(updateTechnologySchema), technologies.update);
project.delete('/technologies/:id', technologies.remove);

// Pages
project.get('/pages', pages.list);
project.post('/pages', validateBody(createPageSchema), pages.create);
project.patch('/pages/:id', validateBody(updatePageSchema), pages.update);
project.delete('/pages/:id', pages.remove);

// Database tables + nested fields
project.get('/database-tables', tables.list);
project.post('/database-tables', validateBody(createTableSchema), tables.create);
project.patch('/database-tables/:id', validateBody(updateTableSchema), tables.update);
project.delete('/database-tables/:id', tables.remove);
project.get('/database-tables/:tableId/fields', fields.list);
project.post('/database-tables/:tableId/fields', validateBody(createFieldSchema), fields.create);
project.patch('/database-tables/:tableId/fields/:id', validateBody(updateFieldSchema), fields.update);
project.delete('/database-tables/:tableId/fields/:id', fields.remove);

// API endpoints
project.get('/api-endpoints', endpoints.list);
project.post('/api-endpoints', validateBody(createEndpointSchema), endpoints.create);
project.patch('/api-endpoints/:id', validateBody(updateEndpointSchema), endpoints.update);
project.delete('/api-endpoints/:id', endpoints.remove);

// Roadmap phases
project.get('/phases', phases.list);
project.post('/phases', validateBody(createPhaseSchema), phases.create);
project.patch('/phases/:id', validateBody(updatePhaseSchema), phases.update);
project.delete('/phases/:id', phases.remove);

// Kanban tasks
project.get('/tasks', tasks.list);
project.post('/tasks', validateBody(createTaskSchema), tasks.create);
project.patch('/tasks/:id', validateBody(updateTaskSchema), tasks.update);
project.patch('/tasks/:id/move', validateBody(moveTaskSchema), tasks.move);
project.delete('/tasks/:id', tasks.remove);
project.post('/tasks/:id/dependencies', validateBody(addDependencySchema), tasks.addDependency);
project.delete('/tasks/:id/dependencies/:dependsOnId', tasks.removeDependency);
project.post('/tasks/:id/stuck', aiLimiter, tasks.stuck);

// Test cases
project.get('/test-cases', testCases.list);
project.post('/test-cases', validateBody(createTestCaseSchema), testCases.create);
project.patch('/test-cases/:id', validateBody(updateTestCaseSchema), testCases.update);
project.delete('/test-cases/:id', testCases.remove);

// AI: chat + debug
project.get('/conversations', ai.history);
project.post('/conversations', aiLimiter, validateBody(chatMessageSchema), ai.chat);
project.post('/debug', aiLimiter, validateBody(debugRequestSchema), ai.debug);

// Change Impact Analyzer
project.get('/changes', changes.list);
project.post('/changes', aiLimiter, validateBody(changeRequestSchema), changes.analyze);
project.post('/changes/:id/accept', changes.accept);
project.post('/changes/:id/reject', changes.reject);
