import { detectDomain, DOMAIN_LABELS, type DomainKey } from './domainDetect';
import { BLUEPRINTS, type Blueprint, type BlueprintTable } from './blueprints';
import { TECHNOLOGY_CATALOG, type CatalogEntry } from './technologyCatalog';
import type {
  ArchitectureLayer,
  DeploymentPlan,
  TaskPriority,
  TechnologyCategory,
} from '../../types/domain';
import type {
  GeneratedPlan,
  PlanEndpoint,
  PlanPhase,
  PlanTable,
  PlanTask,
  PlanTechnology,
  PlanRequest,
  PlanTest,
} from '../../types/plan';

/**
 * The offline planning engine (§4's "works without an API key" requirement).
 *
 * It never talks to the network: everything comes from `BLUEPRINTS`,
 * `TECHNOLOGY_CATALOG` and `detectDomain`, which is what lets BuildFlow
 * produce a coherent, connected plan with zero configuration. `services/ai
 * /provider.ts` calls this whenever Claude is disabled or a live call fails.
 */

// ── Every planned app needs auth, so every plan gets this table ────────────

function usersTable(): PlanTable {
  return {
    name: 'users',
    description: 'Registered accounts for the application.',
    fields: [
      { name: 'id', dataType: 'uuid', isPrimary: true, description: 'Primary key (UUID)' },
      { name: 'email', dataType: 'varchar(255)', isUnique: true, description: 'Login identifier' },
      { name: 'name', dataType: 'varchar(120)', description: 'Display name' },
      { name: 'passwordHash', dataType: 'varchar(255)', description: 'Bcrypt password hash' },
      { name: 'role', dataType: 'varchar(24)', defaultValue: "'user'", description: 'Access level' },
      { name: 'createdAt', dataType: 'timestamp', description: 'Row creation time' },
    ],
  };
}

/** Honest fallback for an idea that matches no known domain. */
function genericBlueprint(idea: string): Blueprint {
  const trimmed = idea.trim().replace(/\s+/g, ' ');
  const summary = trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed || 'this application';

  return {
    domain: 'generic',
    label: DOMAIN_LABELS.generic,
    problemStatement: `People need a reliable way to accomplish: ${summary}`,
    targetUsers: ['End users of the application', 'An administrator who manages content and accounts'],
    goals: [
      'Let a new user sign up and start using the core feature within a minute',
      'Give administrators visibility into activity and content',
      'Keep the core workflow fast and mistake-resistant',
    ],
    tables: [
      {
        name: 'records',
        description: 'The primary record the application revolves around.',
        fields: [
          { name: 'id', dataType: 'uuid', isPrimary: true, description: 'Primary key (UUID)' },
          { name: 'title', dataType: 'varchar(240)', description: 'Short title' },
          { name: 'description', dataType: 'text', isNullable: true, description: 'Longer detail' },
          { name: 'status', dataType: 'varchar(24)', defaultValue: "'active'", description: 'Lifecycle state' },
          {
            name: 'ownerId',
            dataType: 'uuid',
            isForeign: true,
            referencesTable: 'users',
            referencesField: 'id',
            description: 'The user who created this record',
          },
          { name: 'createdAt', dataType: 'timestamp', description: 'Row creation time' },
        ],
      },
    ],
    pages: [
      {
        name: 'Landing',
        route: '/',
        purpose: 'Explain the product and drive sign-ups.',
        components: ['Navbar', 'Hero', 'FeatureGrid', 'Footer'],
        userActions: ['Read the pitch', 'Sign up', 'Sign in'],
        apis: [],
        entities: [],
      },
      {
        name: 'Dashboard',
        route: '/dashboard',
        purpose: 'The signed-in home screen listing the user\u2019s records.',
        components: ['Sidebar', 'RecordList', 'EmptyState'],
        userActions: ['View records', 'Create a record', 'Open a record'],
        apis: ['GET /api/records'],
        entities: ['records'],
        isProtected: true,
      },
      {
        name: 'Record Detail',
        route: '/records/:id',
        purpose: 'View and edit a single record.',
        components: ['RecordForm', 'ActivityLog'],
        userActions: ['Edit', 'Delete', 'Change status'],
        apis: ['GET /api/records/:id', 'PATCH /api/records/:id', 'DELETE /api/records/:id'],
        entities: ['records'],
        isProtected: true,
      },
      {
        name: 'Admin',
        route: '/admin',
        purpose: 'Manage users and review activity.',
        components: ['UserTable', 'ActivityFeed'],
        userActions: ['Search users', 'Disable an account'],
        apis: ['GET /api/admin/users'],
        entities: ['users'],
        isProtected: true,
        isAdmin: true,
      },
    ],
    coreFeatures: [
      { title: 'Authentication', description: 'Email/password sign-up, sign-in and session management.' },
      { title: 'Record management', description: 'Create, view, update and delete the core record type.' },
      { title: 'Dashboard', description: 'A single place to see everything that belongs to the signed-in user.' },
    ],
    futureFeatures: [
      { title: 'Search and filtering', description: 'Full-text search and saved filters across records.' },
      { title: 'Notifications', description: 'Email and in-app alerts for important events.' },
      { title: 'Team accounts', description: 'Shared workspaces with role-based permissions.' },
    ],
    apiGroups: [
      {
        name: 'Auth',
        description: 'Account creation and session management.',
        endpoints: [
          {
            method: 'POST',
            path: '/api/auth/register',
            description: 'Create an account.',
            requiresAuth: false,
            relatedTables: ['users'],
            requestBody: { name: 'string', email: 'string', password: 'string' },
            responseExample: { user: { id: 'uuid', name: 'string', email: 'string' } },
          },
          {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Sign in and start a session.',
            requiresAuth: false,
            relatedTables: ['users'],
            requestBody: { email: 'string', password: 'string' },
            responseExample: { user: { id: 'uuid', name: 'string', email: 'string' } },
          },
        ],
      },
      {
        name: 'Records',
        description: 'CRUD for the primary record type.',
        endpoints: [
          {
            method: 'GET',
            path: '/api/records',
            description: 'List the current user\u2019s records.',
            requiresAuth: true,
            relatedTables: ['records'],
            responseExample: { records: [{ id: 'uuid', title: 'string', status: 'string' }] },
          },
          {
            method: 'POST',
            path: '/api/records',
            description: 'Create a record.',
            requiresAuth: true,
            relatedTables: ['records'],
            requestBody: { title: 'string', description: 'string' },
            responseExample: { record: { id: 'uuid', title: 'string' } },
          },
          {
            method: 'GET',
            path: '/api/records/:id',
            description: 'Fetch one record.',
            requiresAuth: true,
            relatedTables: ['records'],
            responseExample: { record: { id: 'uuid', title: 'string' } },
          },
          {
            method: 'PATCH',
            path: '/api/records/:id',
            description: 'Update a record.',
            requiresAuth: true,
            relatedTables: ['records'],
            requestBody: { title: 'string', status: 'string' },
            responseExample: { record: { id: 'uuid', title: 'string' } },
          },
          {
            method: 'DELETE',
            path: '/api/records/:id',
            description: 'Delete a record.',
            requiresAuth: true,
            relatedTables: ['records'],
            responseExample: { ok: true },
          },
        ],
      },
    ],
  };
}

// ── Technology stack selection ──────────────────────────────────────────────

const CATEGORY_ORDER: TechnologyCategory[] = ['frontend', 'backend', 'database', 'devops'];

const DEFAULT_SLUGS: Record<TechnologyCategory, string> = {
  frontend: 'react',
  backend: 'nodejs-express',
  database: 'postgresql',
  devops: 'docker',
  other: 'github-actions',
};

function findEntry(slug: string): CatalogEntry | undefined {
  return TECHNOLOGY_CATALOG.find((t) => t.slug === slug);
}

function bestForTag(category: TechnologyCategory, tag: string): CatalogEntry | undefined {
  const candidates = TECHNOLOGY_CATALOG.filter((t) => t.category === category);
  return candidates.find((t) => t.tags?.includes(tag)) ?? candidates[0];
}

/** Resolves the wizard's stack choice — explicit slugs, or a sensible default per category. */
function pickStack(request: PlanRequest, domain: DomainKey): CatalogEntry[] {
  if (!request.letAiChooseStack && request.technologies.length > 0) {
    const picked = request.technologies
      .map((slug) => findEntry(slug))
      .filter((t): t is CatalogEntry => Boolean(t));
    if (picked.length > 0) return picked;
  }

  const tag = domain === 'generic' ? 'web' : domain;
  const chosen: CatalogEntry[] = [];
  for (const category of CATEGORY_ORDER) {
    const entry = bestForTag(category, tag) ?? findEntry(DEFAULT_SLUGS[category]);
    if (entry) chosen.push(entry);
  }
  return chosen;
}

function toPlanTechnology(entry: CatalogEntry, aiRecommended: boolean): PlanTechnology {
  return {
    name: entry.name,
    category: entry.category,
    rationale: entry.rationale,
    alternatives: entry.alternatives,
    advantages: entry.advantages,
    disadvantages: entry.disadvantages,
  };
}

// ── Architecture & deployment ────────────────────────────────────────────────

function buildArchitecture(stack: PlanTechnology[]): ArchitectureLayer[] {
  const byCategory = (c: TechnologyCategory) => stack.filter((s) => s.category === c).map((s) => s.name);

  const layers: ArchitectureLayer[] = [
    {
      name: 'Client',
      description: 'The application the user interacts with in the browser or on a device.',
      technologies: byCategory('frontend'),
    },
    {
      name: 'API server',
      description: 'Stateless HTTP API that enforces auth, validation and business rules.',
      technologies: byCategory('backend'),
    },
    {
      name: 'Database',
      description: 'Durable storage for every entity in the plan.',
      technologies: byCategory('database'),
    },
    {
      name: 'Infrastructure',
      description: 'Where the app is built, hosted and monitored.',
      technologies: byCategory('devops'),
      external: ['CI/CD', 'Error tracking'],
    },
  ];

  return layers.filter((l) => l.technologies.length > 0);
}

function buildDeployment(stack: PlanTechnology[]): DeploymentPlan {
  const frontend = stack.find((s) => s.category === 'frontend')?.name ?? 'the client';
  const backend = stack.find((s) => s.category === 'backend')?.name ?? 'the API';
  const database = stack.find((s) => s.category === 'database')?.name ?? 'the database';

  return {
    targets: [
      {
        layer: 'Frontend',
        provider: 'Vercel',
        reason: `${frontend} builds to static assets that a CDN edge network serves fastest.`,
        steps: [
          'Connect the repository to Vercel',
          'Set the build command and output directory',
          'Add environment variables for the API base URL',
          'Enable automatic deploys on push to main',
        ],
        buildCommand: 'npm run build',
        startCommand: 'npm run preview',
      },
      {
        layer: 'Backend',
        provider: 'Render',
        reason: `${backend} runs as a long-lived process, which a container platform hosts more simply than a serverless one.`,
        steps: [
          'Create a new Web Service pointed at the repository',
          'Set the start command and health check path',
          'Configure environment variables and secrets',
          'Attach the managed database instance',
        ],
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm run start',
      },
      {
        layer: 'Database',
        provider: 'Managed ' + database,
        reason: 'A managed instance handles backups, patching and failover so the team does not have to.',
        steps: [
          'Provision a managed instance',
          'Run migrations against it',
          'Store the connection string as a secret, never in source control',
        ],
      },
    ],
    environmentVariables: [
      { key: 'DATABASE_URL', description: 'Connection string for the database', example: 'postgres://...', secret: true },
      { key: 'JWT_SECRET', description: 'Signing secret for session tokens', example: 'a long random string', secret: true },
      { key: 'CLIENT_URL', description: 'Origin(s) allowed to call the API', example: 'https://app.example.com', secret: false },
    ],
    productionChecklist: [
      'Disable automatic schema sync; use migrations instead',
      'Set strong, unique secrets for JWT and any API keys',
      'Turn on HTTPS-only cookies and CORS allow-lists',
      'Add rate limiting to authentication and AI endpoints',
      'Set up error tracking and uptime alerts',
      'Take automated database backups',
    ],
    commonErrors: [
      {
        error: 'CORS blocked the request',
        cause: 'The deployed client origin is not in the server\u2019s allow-list.',
        fix: 'Add the exact deployed origin (protocol + host) to CLIENT_URL.',
      },
      {
        error: 'Cannot connect to the database',
        cause: 'The connection string or network access rules are wrong for the hosting environment.',
        fix: 'Verify DATABASE_URL and that the database allows connections from the app\u2019s IP range.',
      },
    ],
  };
}

// ── Phases & tasks ───────────────────────────────────────────────────────────

function priorityFor(index: number, total: number): TaskPriority {
  if (index === 0) return 'high';
  if (index === total - 1) return 'low';
  return 'medium';
}

function buildPhases(blueprint: Blueprint, stack: PlanTechnology[]): PlanPhase[] {
  const backend = stack.find((s) => s.category === 'backend')?.name ?? 'the backend';
  const frontend = stack.find((s) => s.category === 'frontend')?.name ?? 'the frontend';

  const setupTasks: PlanTask[] = [
    { title: 'Initialise repository and tooling', description: 'Set up version control, linting and formatting.', priority: 'high', estimatedHours: 2 },
    { title: `Scaffold ${backend} project`, description: 'Create the API project structure and health check route.', priority: 'high', estimatedHours: 3 },
    { title: `Scaffold ${frontend} project`, description: 'Create the client project structure and routing shell.', priority: 'high', estimatedHours: 3 },
    { title: 'Provision the database', description: 'Stand up a local and a hosted database instance.', priority: 'medium', estimatedHours: 2 },
  ];

  const authTasks: PlanTask[] = [
    { title: 'Design the users table', description: 'Model accounts, credentials and sessions.', priority: 'high', estimatedHours: 2 },
    { title: 'Build registration and login endpoints', description: 'Password hashing, validation and session issuance.', priority: 'high', estimatedHours: 5, dependsOn: ['Design the users table'] },
    { title: 'Build the sign-up and sign-in screens', description: 'Forms, validation feedback and redirects.', priority: 'high', estimatedHours: 4, dependsOn: ['Build registration and login endpoints'] },
    { title: 'Protect authenticated routes', description: 'Middleware and route guards on both server and client.', priority: 'medium', estimatedHours: 3, dependsOn: ['Build registration and login endpoints'] },
  ];

  const coreTables = blueprint.tables.slice(0, 6);
  const coreTasks: PlanTask[] = [];
  for (const table of coreTables) {
    coreTasks.push({
      title: `Model the ${table.name} table`,
      description: table.description,
      priority: 'high',
      estimatedHours: 2,
    });
  }
  for (const group of blueprint.apiGroups) {
    coreTasks.push({
      title: `Build the ${group.name} API`,
      description: group.description,
      priority: 'high',
      estimatedHours: Math.max(3, group.endpoints.length * 1.5),
    });
  }
  for (const page of blueprint.pages.slice(0, 8)) {
    coreTasks.push({
      title: `Build the ${page.name} page`,
      description: page.purpose,
      priority: 'medium',
      estimatedHours: 4,
    });
  }

  const testingTasks: PlanTask[] = [
    { title: 'Write unit tests for core business logic', description: 'Cover validation and calculation code with unit tests.', priority: 'high', estimatedHours: 5 },
    { title: 'Write integration tests for the API', description: 'Exercise the main endpoints against a test database.', priority: 'medium', estimatedHours: 5 },
    { title: 'Manual QA pass', description: 'Walk every page and flow end to end before launch.', priority: 'medium', estimatedHours: 3 },
  ];

  const deployTasks: PlanTask[] = [
    { title: 'Configure production environment variables', description: 'Set secrets and config for the hosted environment.', priority: 'high', estimatedHours: 2 },
    { title: 'Deploy the backend', description: 'Ship the API to its hosting provider.', priority: 'high', estimatedHours: 3 },
    { title: 'Deploy the frontend', description: 'Ship the client to its hosting provider.', priority: 'high', estimatedHours: 2, dependsOn: ['Deploy the backend'] },
    { title: 'Smoke test production', description: 'Verify the deployed app end to end.', priority: 'medium', estimatedHours: 2, dependsOn: ['Deploy the frontend'] },
  ];

  const raw: Array<{ name: string; description: string; duration: string; tasks: PlanTask[] }> = [
    { name: 'Setup', description: 'Repository, tooling and infrastructure scaffolding.', duration: '2-3 days', tasks: setupTasks },
    { name: 'Authentication', description: 'Accounts, sessions and route protection.', duration: '3-5 days', tasks: authTasks },
    { name: 'Core Features', description: `Everything specific to ${blueprint.label.toLowerCase()}.`, duration: '2-4 weeks', tasks: coreTasks },
    { name: 'Testing', description: 'Automated coverage and a manual QA pass.', duration: '3-5 days', tasks: testingTasks },
    { name: 'Deployment', description: 'Ship to production and verify it.', duration: '2-3 days', tasks: deployTasks },
  ];

  return raw.map((phase, index) => ({
    name: phase.name,
    description: phase.description,
    orderIndex: index + 1,
    estimatedDuration: phase.duration,
    tasks: phase.tasks.map((t, i) => ({ ...t, priority: t.priority ?? priorityFor(i, phase.tasks.length) })),
  }));
}

// ── Tests ────────────────────────────────────────────────────────────────────

function buildTests(blueprint: Blueprint): PlanTest[] {
  const tests: PlanTest[] = [
    {
      title: 'A visitor can register a new account',
      category: 'auth',
      input: 'Valid name, unique email and a password of 8+ characters',
      expectedResult: 'Account is created and the user is signed in',
      target: 'POST /api/auth/register',
    },
    {
      title: 'Registration rejects a duplicate email',
      category: 'auth',
      input: 'An email that already has an account',
      expectedResult: '409 Conflict with a clear error message',
      target: 'POST /api/auth/register',
    },
    {
      title: 'A registered user can sign in',
      category: 'auth',
      input: 'Correct email and password',
      expectedResult: 'Session is issued and the user reaches the dashboard',
      target: 'POST /api/auth/login',
    },
    {
      title: 'An unauthenticated request to a protected route is rejected',
      category: 'security',
      input: 'A request with no session cookie',
      expectedResult: '401 Unauthorized',
      target: 'Any protected endpoint',
    },
  ];

  for (const group of blueprint.apiGroups) {
    const first = group.endpoints[0];
    if (!first) continue;
    tests.push({
      title: `${group.name}: ${first.method} ${first.path} returns the expected shape`,
      category: 'api',
      input: first.requestBody ? JSON.stringify(first.requestBody) : 'No request body',
      expectedResult: 'Response matches the documented example and status code',
      target: `${first.method} ${first.path}`,
    });
  }

  for (const table of blueprint.tables.slice(0, 3)) {
    tests.push({
      title: `${table.name}: required fields are validated`,
      category: 'integration',
      input: 'A payload missing a required field',
      expectedResult: '422 with field-level validation errors',
      target: table.name,
    });
  }

  for (const page of blueprint.pages.slice(0, 3)) {
    tests.push({
      title: `${page.name} renders its primary content`,
      category: 'ui',
      input: 'Navigate to the page as an authorised user',
      expectedResult: 'The page loads without error and shows the expected components',
      target: page.route,
    });
  }

  return tests;
}

// ── Naming ───────────────────────────────────────────────────────────────────

function deriveName(idea: string, label: string): string {
  const words = idea
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  if (words.length === 0) return label;
  return words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function synthesizePlan(request: PlanRequest): GeneratedPlan {
  const match = detectDomain(request.idea, request.projectType);
  const blueprint: Blueprint =
    match.domain === 'generic' ? genericBlueprint(request.idea) : BLUEPRINTS[match.domain];

  const stackEntries = pickStack(request, match.domain);
  const stack = stackEntries.map((e) => toPlanTechnology(e, request.letAiChooseStack));

  const tables: PlanTable[] = [usersTable(), ...blueprint.tables];
  const endpoints: PlanEndpoint[] = blueprint.apiGroups.flatMap((group) =>
    group.endpoints.map((e) => ({
      ...e,
      group: group.name,
      successStatus: e.method === 'POST' ? 201 : 200,
      parameters: null,
    })),
  );

  return {
    name: deriveName(request.idea, blueprint.label),
    description: blueprint.problemStatement,
    problemStatement: blueprint.problemStatement,
    targetUsers: blueprint.targetUsers,
    goals: blueprint.goals,
    coreFeatures: blueprint.coreFeatures,
    futureFeatures: blueprint.futureFeatures,
    stack,
    architecture: buildArchitecture(stack),
    pages: blueprint.pages,
    tables,
    endpoints,
    phases: buildPhases(blueprint, stack),
    tests: buildTests(blueprint),
    deployment: buildDeployment(stack),
    domain: match.domain,
  };
}
