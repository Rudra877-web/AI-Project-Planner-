export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  createdAt: string;
}

export interface Progress {
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
  totalEstimatedHours: number;
  completedEstimatedHours: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface PhaseProgress {
  id: string;
  name: string;
  orderIndex: number;
  status: string;
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  idea: string;
  type: string;
  status: string;
  experienceLevel: string;
  problemStatement: string | null;
  targetUsers: string[] | null;
  goals: string[] | null;
  architecture: Array<{ name: string; description: string; technologies: string[]; external?: string[] }> | null;
  deployment: {
    targets: Array<{ layer: string; provider: string; reason: string; steps: string[] }>;
    environmentVariables: Array<{ key: string; description: string; example: string; secret: boolean }>;
    productionChecklist: string[];
    commonErrors: Array<{ error: string; cause: string; fix: string }>;
  } | null;
  readme: string | null;
  domain: string | null;
  aiGenerated: boolean;
  generatedWith: string | null;
  createdAt: string;
  updatedAt: string;
  progress?: Progress;
}

export interface Requirement {
  id: string;
  type: string;
  title: string;
  description: string | null;
  position: number;
}

export interface ProjectTechnology {
  id: string;
  name: string;
  category: string;
  rationale: string | null;
  alternatives: string[] | null;
  advantages: string[] | null;
  disadvantages: string[] | null;
  aiRecommended: boolean;
}

export interface Page {
  id: string;
  name: string;
  route: string | null;
  purpose: string;
  components: string[] | null;
  userActions: string[] | null;
  apis: string[] | null;
  entities: string[] | null;
  isProtected: boolean;
  isAdmin: boolean;
}

export interface DatabaseField {
  id: string;
  name: string;
  dataType: string;
  isPrimary: boolean;
  isForeign: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue: string | null;
  description: string | null;
  referencesTable: string | null;
  referencesField: string | null;
}

export interface DatabaseTable {
  id: string;
  name: string;
  description: string | null;
  fields: DatabaseField[];
}

export interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  description: string;
  group: string | null;
  requiresAuth: boolean;
  requestBody: Record<string, unknown> | null;
  responseExample: Record<string, unknown> | null;
  successStatus: number;
  relatedTables: string[] | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  estimatedHours: number;
  assignee: string | null;
  tags: string[] | null;
  boardPosition: number;
  completedAt: string | null;
  stuckGuidance: StuckGuidance | null;
  phaseId: string | null;
  dependencies?: Array<{ id: string; dependsOnId: string }>;
}

export interface StuckGuidance {
  taskTitle: string;
  prerequisites: string[];
  steps: Array<{ title: string; detail: string }>;
  commonErrors: Array<{ error: string; cause: string; fix: string }>;
  codeExample?: { language: string; code: string; caption?: string } | null;
  resources: Array<{ label: string; url: string }>;
}

export interface TestCase {
  id: string;
  title: string;
  category: string;
  input: string;
  expectedResult: string;
  status: string;
  notes: string | null;
  target: string | null;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context: string;
  threadId: string;
  generatedWith: string | null;
  createdAt: string;
}

export interface ImpactAnalysis {
  summary: string;
  affectedTables: Array<{ name: string; action: string; reason: string }>;
  newEndpoints: Array<{ method: string; path: string; description: string }>;
  newPages: Array<{ name: string; route: string; purpose: string }>;
  newTasks: Array<{ title: string; description: string; priority: string; estimatedHours: number }>;
  newTests: Array<{ title: string; category: string; input: string; expectedResult: string }>;
  risks: string[];
}

export interface ProjectChange {
  id: string;
  request: string;
  title: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  impact: ImpactAnalysis | null;
  generatedWith: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface Technology {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  icon: string | null;
}
