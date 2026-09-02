import { z } from 'zod';
import {
  REQUIREMENT_TYPES,
  TECHNOLOGY_CATEGORIES,
  HTTP_METHODS,
  RELATION_KINDS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TEST_CATEGORIES,
  TEST_STATUSES,
  PHASE_STATUSES,
} from '../types/domain';
import { optionalText, text } from './common';

// ── Requirements ─────────────────────────────────────────────────────────────

export const createRequirementSchema = z.object({
  type: z.enum(REQUIREMENT_TYPES).default('core_feature'),
  title: text(1, 240),
  description: optionalText(2000),
  position: z.number().int().min(0).optional(),
});
export const updateRequirementSchema = createRequirementSchema.partial();

// ── Project technologies ────────────────────────────────────────────────────

export const createTechnologySchema = z.object({
  name: text(1, 80),
  category: z.enum(TECHNOLOGY_CATEGORIES),
  rationale: optionalText(2000),
  alternatives: z.array(z.string()).default([]),
  advantages: z.array(z.string()).default([]),
  disadvantages: z.array(z.string()).default([]),
  technologyId: z.string().uuid().nullable().optional(),
});
export const updateTechnologySchema = createTechnologySchema.partial();

// ── Pages ────────────────────────────────────────────────────────────────────

export const createPageSchema = z.object({
  name: text(1, 120),
  route: optionalText(160),
  purpose: text(1, 4000),
  components: z.array(z.string()).default([]),
  userActions: z.array(z.string()).default([]),
  apis: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
  isProtected: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
});
export const updatePageSchema = createPageSchema.partial();

// ── Database tables & fields ────────────────────────────────────────────────

export const createTableSchema = z.object({
  name: text(1, 120),
  description: optionalText(2000),
  positionX: z.number().int().default(0),
  positionY: z.number().int().default(0),
});
export const updateTableSchema = createTableSchema.partial();

export const createFieldSchema = z.object({
  name: text(1, 120),
  dataType: text(1, 80),
  isPrimary: z.boolean().default(false),
  isForeign: z.boolean().default(false),
  isNullable: z.boolean().default(true),
  isUnique: z.boolean().default(false),
  defaultValue: optionalText(160),
  description: optionalText(2000),
  referencesTable: optionalText(120),
  referencesField: optionalText(120),
  relationKind: z.enum(RELATION_KINDS).nullable().optional(),
});
export const updateFieldSchema = createFieldSchema.partial();

// ── API endpoints ────────────────────────────────────────────────────────────

export const createEndpointSchema = z.object({
  method: z.enum(HTTP_METHODS),
  path: text(1, 240),
  description: text(1, 4000),
  group: optionalText(80),
  requiresAuth: z.boolean().default(true),
  requestBody: z.record(z.string(), z.unknown()).nullable().optional(),
  parameters: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  responseExample: z.record(z.string(), z.unknown()).nullable().optional(),
  successStatus: z.number().int().min(100).max(599).default(200),
  relatedTables: z.array(z.string()).default([]),
});
export const updateEndpointSchema = createEndpointSchema.partial();

// ── Phases ───────────────────────────────────────────────────────────────────

export const createPhaseSchema = z.object({
  name: text(1, 120),
  description: optionalText(4000),
  orderIndex: z.number().int().min(1).default(1),
  status: z.enum(PHASE_STATUSES).default('not_started'),
  estimatedDuration: optionalText(48),
});
export const updatePhaseSchema = createPhaseSchema.partial();

// ── Tasks ────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: text(1, 240),
  description: optionalText(4000),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  status: z.enum(TASK_STATUSES).default('todo'),
  estimatedHours: z.number().min(0).max(1000).default(2),
  assignee: optionalText(120),
  tags: z.array(z.string()).default([]),
  phaseId: z.string().uuid().nullable().optional(),
});
export const updateTaskSchema = createTaskSchema.partial();

export const moveTaskSchema = z.object({
  status: z.enum(TASK_STATUSES),
  boardPosition: z.number().int().min(0).default(0),
});

export const addDependencySchema = z.object({
  dependsOnId: z.string().uuid(),
});

// ── Test cases ───────────────────────────────────────────────────────────────

export const createTestCaseSchema = z.object({
  title: text(1, 240),
  category: z.enum(TEST_CATEGORIES),
  input: text(1, 4000),
  expectedResult: text(1, 4000),
  target: optionalText(200),
});
export const updateTestCaseSchema = createTestCaseSchema.partial().extend({
  status: z.enum(TEST_STATUSES).optional(),
  notes: optionalText(4000),
});

// ── Reorder (shared shape for any list) ─────────────────────────────────────

export const reorderSchema = z.object({
  order: z.array(z.string().uuid()).min(1),
});
