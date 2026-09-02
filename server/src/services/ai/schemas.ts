import { z } from 'zod';
import {
  HTTP_METHODS,
  TASK_PRIORITIES,
  TECHNOLOGY_CATEGORIES,
  TEST_CATEGORIES,
} from '../../types/domain';

/**
 * Mirrors `types/plan.ts` and `types/domain.ts` as zod schemas.
 *
 * Claude is asked for JSON matching this shape, but "asked for" is not
 * "guaranteed" — a schema parse is what actually stands between a malformed or
 * hallucinated response and a half-written project in the database. Anything
 * that fails validation is treated as a failed call and falls back to the
 * offline engine (see provider.ts), not written anywhere.
 */

const feature = z.object({ title: z.string().min(1), description: z.string().min(1) });

const technology = z.object({
  name: z.string().min(1),
  category: z.enum(TECHNOLOGY_CATEGORIES),
  rationale: z.string().min(1),
  alternatives: z.array(z.string()).default([]),
  advantages: z.array(z.string()).default([]),
  disadvantages: z.array(z.string()).default([]),
});

const field = z.object({
  name: z.string().min(1),
  dataType: z.string().min(1),
  isPrimary: z.boolean().optional(),
  isForeign: z.boolean().optional(),
  isNullable: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  defaultValue: z.string().nullable().optional(),
  description: z.string().optional(),
  referencesTable: z.string().nullable().optional(),
  referencesField: z.string().nullable().optional(),
});

const table = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  fields: z.array(field).min(1),
});

const page = z.object({
  name: z.string().min(1),
  route: z.string().min(1),
  purpose: z.string().min(1),
  components: z.array(z.string()).default([]),
  userActions: z.array(z.string()).default([]),
  apis: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
  isProtected: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

const endpoint = z.object({
  method: z.enum(HTTP_METHODS),
  path: z.string().min(1),
  description: z.string().min(1),
  group: z.string().min(1),
  requiresAuth: z.boolean(),
  requestBody: z.record(z.string(), z.unknown()).nullable().optional(),
  parameters: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  responseExample: z.record(z.string(), z.unknown()).nullable().optional(),
  successStatus: z.number().int().optional(),
  relatedTables: z.array(z.string()).default([]),
});

const task = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(TASK_PRIORITIES),
  estimatedHours: z.number().positive(),
  dependsOn: z.array(z.string()).optional(),
});

const phase = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  orderIndex: z.number().int(),
  estimatedDuration: z.string().min(1),
  tasks: z.array(task).min(1),
});

const test = z.object({
  title: z.string().min(1),
  category: z.enum(TEST_CATEGORIES),
  input: z.string().min(1),
  expectedResult: z.string().min(1),
  target: z.string().optional(),
});

const architectureLayer = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  external: z.array(z.string()).optional(),
});

const deployment = z.object({
  targets: z.array(
    z.object({
      layer: z.string().min(1),
      provider: z.string().min(1),
      reason: z.string().min(1),
      steps: z.array(z.string()).default([]),
      buildCommand: z.string().optional(),
      startCommand: z.string().optional(),
    }),
  ),
  environmentVariables: z.array(
    z.object({
      key: z.string().min(1),
      description: z.string().min(1),
      example: z.string().min(1),
      secret: z.boolean(),
    }),
  ),
  productionChecklist: z.array(z.string()),
  commonErrors: z.array(
    z.object({ error: z.string().min(1), cause: z.string().min(1), fix: z.string().min(1) }),
  ),
});

export const generatedPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  problemStatement: z.string().min(1),
  targetUsers: z.array(z.string()).min(1),
  goals: z.array(z.string()).min(1),
  coreFeatures: z.array(feature).min(1),
  futureFeatures: z.array(feature).default([]),
  stack: z.array(technology).min(1),
  architecture: z.array(architectureLayer).min(1),
  pages: z.array(page).min(1),
  tables: z.array(table).min(1),
  endpoints: z.array(endpoint).min(1),
  phases: z.array(phase).min(1),
  tests: z.array(test).min(1),
  deployment,
  domain: z.string().default('generic'),
});

export const stuckGuidanceSchema = z.object({
  taskTitle: z.string().min(1),
  prerequisites: z.array(z.string()).default([]),
  steps: z.array(z.object({ title: z.string().min(1), detail: z.string().min(1) })).min(1),
  commonErrors: z
    .array(z.object({ error: z.string().min(1), cause: z.string().min(1), fix: z.string().min(1) }))
    .default([]),
  codeExample: z
    .object({ language: z.string(), code: z.string(), caption: z.string().optional() })
    .nullable()
    .optional(),
  resources: z.array(z.object({ label: z.string().min(1), url: z.string().min(1) })).default([]),
});

export const debugExplanationSchema = z.object({
  summary: z.string().min(1),
  error: z.string().min(1),
  cause: z.string().min(1),
  solution: z.string().min(1),
  example: z.object({ language: z.string(), code: z.string() }).nullable().optional(),
  relatedChecks: z.array(z.string()).default([]),
});

const impactField = z.object({
  name: z.string().min(1),
  dataType: z.string().min(1),
  nullable: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  isForeign: z.boolean().optional(),
  references: z.string().optional(),
  defaultValue: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const impactAnalysisSchema = z.object({
  summary: z.string().min(1),
  affectedTables: z
    .array(
      z.object({
        name: z.string().min(1),
        action: z.enum(['create', 'modify']),
        reason: z.string().min(1),
        fields: z.array(impactField).optional(),
      }),
    )
    .default([]),
  newEndpoints: z
    .array(
      z.object({
        method: z.enum(HTTP_METHODS),
        path: z.string().min(1),
        description: z.string().min(1),
        requiresAuth: z.boolean(),
        requestBody: z.record(z.string(), z.unknown()).nullable().optional(),
        responseExample: z.record(z.string(), z.unknown()).nullable().optional(),
        relatedTables: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  newPages: z
    .array(
      z.object({
        name: z.string().min(1),
        route: z.string().min(1),
        purpose: z.string().min(1),
        components: z.array(z.string()).default([]),
        userActions: z.array(z.string()).default([]),
        apis: z.array(z.string()).default([]),
        entities: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  newTasks: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        priority: z.enum(TASK_PRIORITIES),
        estimatedHours: z.number().positive(),
        phase: z.string().optional(),
      }),
    )
    .default([]),
  newTests: z.array(test.omit({ target: true })).default([]),
  risks: z.array(z.string()).default([]),
});

export const chatReplySchema = z.object({
  reply: z.string().min(1),
});
