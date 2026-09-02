/**
 * Shared domain vocabularies.
 *
 * These are plain string unions plus a runtime array for each, so the same
 * definition drives TypeORM columns, zod validation, and the client types.
 * Enum-ish columns are stored as `varchar` rather than a native Postgres enum
 * so the schema is portable across both supported drivers.
 */

export const PROJECT_STATUSES = ['planning', 'in_progress', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TYPES = [
  'web',
  'mobile',
  'saas',
  'ecommerce',
  'api',
  'ai',
  'iot',
  'other',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TEST_CATEGORIES = [
  'unit',
  'integration',
  'api',
  'ui',
  'auth',
  'security',
] as const;
export type TestCategory = (typeof TEST_CATEGORIES)[number];

export const TEST_STATUSES = ['not_tested', 'pass', 'fail', 'blocked'] as const;
export type TestStatus = (typeof TEST_STATUSES)[number];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const REQUIREMENT_TYPES = [
  'problem',
  'goal',
  'target_user',
  'core_feature',
  'future_feature',
  'functional',
  'non_functional',
  'constraint',
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export const TECHNOLOGY_CATEGORIES = [
  'frontend',
  'backend',
  'database',
  'devops',
  'other',
] as const;
export type TechnologyCategory = (typeof TECHNOLOGY_CATEGORIES)[number];

export const CHANGE_STATUSES = ['pending', 'accepted', 'rejected'] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const CONVERSATION_ROLES = ['user', 'assistant'] as const;
export type ConversationRole = (typeof CONVERSATION_ROLES)[number];

export const PHASE_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const RELATION_KINDS = ['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'] as const;
export type RelationKind = (typeof RELATION_KINDS)[number];

/** Which AI surface a conversation belongs to. */
export const AI_CONTEXTS = ['chat', 'stuck', 'debug', 'change'] as const;
export type AiContext = (typeof AI_CONTEXTS)[number];

// ── Structured JSON payload shapes ───────────────────────────────────────────

/** One layer of the §6 architecture diagram, top to bottom. */
export interface ArchitectureLayer {
  name: string;
  description: string;
  technologies: string[];
  /** External services this layer talks to (Stripe, S3, Twilio, …). */
  external?: string[];
}

/** §15 deployment plan, derived from the selected stack. */
export interface DeploymentPlan {
  targets: Array<{
    layer: string;
    provider: string;
    reason: string;
    steps: string[];
    buildCommand?: string;
    startCommand?: string;
  }>;
  environmentVariables: Array<{
    key: string;
    description: string;
    example: string;
    secret: boolean;
  }>;
  productionChecklist: string[];
  commonErrors: Array<{ error: string; cause: string; fix: string }>;
}

/** §13 Change Impact Analyzer result, stored on project_changes.impact. */
export interface ImpactAnalysis {
  summary: string;
  affectedTables: Array<{
    name: string;
    action: 'create' | 'modify';
    reason: string;
    fields?: Array<{
      name: string;
      dataType: string;
      nullable?: boolean;
      isPrimary?: boolean;
      isForeign?: boolean;
      references?: string;
      defaultValue?: string | null;
      description?: string;
    }>;
  }>;
  newEndpoints: Array<{
    method: HttpMethod;
    path: string;
    description: string;
    requiresAuth: boolean;
    requestBody?: Record<string, unknown> | null;
    responseExample?: Record<string, unknown> | null;
    relatedTables?: string[];
  }>;
  newPages: Array<{
    name: string;
    route: string;
    purpose: string;
    components?: string[];
    userActions?: string[];
    apis?: string[];
    entities?: string[];
  }>;
  newTasks: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    estimatedHours: number;
    phase?: string;
  }>;
  newTests: Array<{
    title: string;
    category: TestCategory;
    input: string;
    expectedResult: string;
  }>;
  risks: string[];
}
