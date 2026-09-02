import type {
  ArchitectureLayer,
  DeploymentPlan,
  ExperienceLevel,
  HttpMethod,
  ProjectType,
  TaskPriority,
  TechnologyCategory,
  TestCategory,
} from './domain';

/**
 * The contract between the two AI engines and the rest of the server.
 *
 * Both the Claude provider and the offline engine return exactly this shape, so
 * the controller that persists a plan has no idea which one produced it. That is
 * the whole point of the seam: swapping engines cannot change what a project
 * looks like once it is saved.
 */

export interface PlanFeature {
  title: string;
  description: string;
}

export interface PlanTechnology {
  name: string;
  category: TechnologyCategory;
  /** Why this technology suits *this* project, not a generic blurb. */
  rationale: string;
  alternatives: string[];
  advantages: string[];
  disadvantages: string[];
}

export interface PlanField {
  name: string;
  dataType: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string | null;
  description?: string;
  referencesTable?: string | null;
  referencesField?: string | null;
}

export interface PlanTable {
  name: string;
  description: string;
  fields: PlanField[];
}

export interface PlanPage {
  name: string;
  route: string;
  purpose: string;
  components: string[];
  userActions: string[];
  apis: string[];
  entities: string[];
  isProtected?: boolean;
  isAdmin?: boolean;
}

export interface PlanEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
  group: string;
  requiresAuth: boolean;
  requestBody?: Record<string, unknown> | null;
  parameters?: Array<Record<string, unknown>> | null;
  responseExample?: Record<string, unknown> | null;
  successStatus?: number;
  relatedTables: string[];
}

export interface PlanTask {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedHours: number;
  /** Titles of tasks that must finish first; resolved to ids when persisted. */
  dependsOn?: string[];
}

export interface PlanPhase {
  name: string;
  description: string;
  orderIndex: number;
  estimatedDuration: string;
  tasks: PlanTask[];
}

export interface PlanTest {
  title: string;
  category: TestCategory;
  input: string;
  expectedResult: string;
  target?: string;
}

export interface GeneratedPlan {
  name: string;
  description: string;
  problemStatement: string;
  targetUsers: string[];
  goals: string[];
  coreFeatures: PlanFeature[];
  futureFeatures: PlanFeature[];
  stack: PlanTechnology[];
  architecture: ArchitectureLayer[];
  pages: PlanPage[];
  tables: PlanTable[];
  endpoints: PlanEndpoint[];
  phases: PlanPhase[];
  tests: PlanTest[];
  deployment: DeploymentPlan;
  /** Detected blueprint key, reused later by the Change Impact Analyzer. */
  domain: string;
}

/** What the wizard collects in §5 and hands to whichever engine is active. */
export interface PlanRequest {
  idea: string;
  projectType: ProjectType;
  experienceLevel: ExperienceLevel;
  /** Technology slugs chosen in step 3. Empty when the user let AI decide. */
  technologies: string[];
  letAiChooseStack: boolean;
}

/** §12 "I'm Stuck" guidance. */
export interface StuckGuidance {
  taskTitle: string;
  prerequisites: string[];
  steps: Array<{ title: string; detail: string }>;
  commonErrors: Array<{ error: string; cause: string; fix: string }>;
  codeExample?: { language: string; code: string; caption?: string } | null;
  resources: Array<{ label: string; url: string }>;
}

/** §12 debugging help — Error → Cause → Solution → Example. */
export interface DebugExplanation {
  summary: string;
  error: string;
  cause: string;
  solution: string;
  example?: { language: string; code: string } | null;
  relatedChecks: string[];
}
