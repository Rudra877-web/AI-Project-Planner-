import type { TechnologyCategory } from '../../types/domain';

export interface CatalogEntry {
  slug: string;
  name: string;
  category: TechnologyCategory;
  description: string;
  /** Generic rationale. `synthesize.ts` rewrites this per project where it can. */
  rationale: string;
  alternatives: string[];
  advantages: string[];
  disadvantages: string[];
  icon: string;
  docsUrl: string;
  /** Rough suitability signal used by "Let AI choose the best stack". */
  tags?: string[];
}

/**
 * The §6 knowledge base: for every technology, why it is recommended, what else
 * you could use, and what it costs you.
 *
 * The disadvantages are deliberately real rather than token caveats — a planner
 * that only lists upsides is not helping anyone choose, and a developer who
 * finds out about the tradeoff in week three has been misled.
 */
export const TECHNOLOGY_CATALOG: CatalogEntry[] = [
  // ── Frontend ──────────────────────────────────────────────────────────────
  {
    slug: 'react',
    name: 'React',
    category: 'frontend',
    description: 'Component-driven UI library maintained by Meta.',
    rationale:
      'The largest component ecosystem of any UI library, which means most interface problems you hit have an existing, battle-tested answer rather than a bespoke one.',
    alternatives: ['Vue', 'Svelte', 'Angular', 'Solid'],
    advantages: [
      'Enormous ecosystem — charts, tables, drag-and-drop and auth flows are all solved problems',
      'Easiest of the major frameworks to hire for',
      'Hooks compose cleanly, so shared logic moves into plain functions',
    ],
    disadvantages: [
      'Unopinionated: routing, data fetching and forms are all decisions you have to make yourself',
      'Easy to trigger avoidable re-renders before you understand memoisation',
      'Needs a build step and a bundler from day one',
    ],
    icon: 'atom',
    docsUrl: 'https://react.dev',
    tags: ['spa', 'web', 'dashboard'],
  },
  {
    slug: 'nextjs',
    name: 'Next.js',
    category: 'frontend',
    description: 'React framework with server rendering, routing and API routes.',
    rationale:
      'Gives you server rendering and file-based routing without assembling them yourself, which matters when pages have to be indexable by search engines.',
    alternatives: ['React + Vite', 'Remix', 'Nuxt', 'Astro'],
    advantages: [
      'Server rendering and static generation are built in, so public pages are fast and crawlable',
      'File-based routing removes a whole category of configuration',
      'API routes let a small project ship without a separate backend',
    ],
    disadvantages: [
      'The server/client component split is a genuine learning curve',
      'Strongly optimised for Vercel; self-hosting is possible but less smooth',
      'More framework opinion to work around when you need something unusual',
    ],
    icon: 'triangle',
    docsUrl: 'https://nextjs.org/docs',
    tags: ['seo', 'ssr', 'web', 'ecommerce', 'marketing'],
  },
  {
    slug: 'vue',
    name: 'Vue',
    category: 'frontend',
    description: 'Progressive framework with a gentle learning curve.',
    rationale:
      'Single-file components keep template, logic and styles together, which shortens the ramp for developers new to component models.',
    alternatives: ['React', 'Svelte', 'Angular'],
    advantages: [
      'Approachable — readable templates instead of JSX',
      'Official router and state management, so fewer third-party decisions',
      'Excellent, genuinely complete documentation',
    ],
    disadvantages: [
      'Smaller third-party component ecosystem than React',
      'Fewer senior developers available in most markets',
      'Two API styles (Options and Composition) in circulation can confuse newcomers',
    ],
    icon: 'leaf',
    docsUrl: 'https://vuejs.org',
    tags: ['spa', 'web'],
  },
  {
    slug: 'angular',
    name: 'Angular',
    category: 'frontend',
    description: 'Full, opinionated application framework from Google.',
    rationale:
      'Ships routing, forms, HTTP and dependency injection as one supported whole, which pays off on large teams where consistency matters more than flexibility.',
    alternatives: ['React', 'Vue'],
    advantages: [
      'Batteries included — far fewer architectural decisions per project',
      'TypeScript-first, with strong tooling and generators',
      'Structure holds up well as a codebase and team grow',
    ],
    disadvantages: [
      'Steepest learning curve of the major frameworks',
      'Verbose for small applications',
      'Larger baseline bundle than the lighter alternatives',
    ],
    icon: 'shield',
    docsUrl: 'https://angular.dev',
    tags: ['enterprise', 'web'],
  },
  {
    slug: 'react-native',
    name: 'React Native',
    category: 'frontend',
    description: 'Native iOS and Android apps from one React codebase.',
    rationale:
      'One codebase for both platforms, and React knowledge transfers directly — the fastest route to a real mobile app for a team that already writes React.',
    alternatives: ['Flutter', 'Swift + Kotlin (native)', 'Expo'],
    advantages: [
      'A single team ships both platforms',
      'Large ecosystem and mature tooling via Expo',
      'Over-the-air updates for JavaScript changes',
    ],
    disadvantages: [
      'Native modules are still needed for less common device features',
      'Performance ceiling below fully native for heavy animation or graphics',
      'Upgrades across major versions can be painful',
    ],
    icon: 'smartphone',
    docsUrl: 'https://reactnative.dev',
    tags: ['mobile'],
  },
  {
    slug: 'flutter',
    name: 'Flutter',
    category: 'frontend',
    description: "Google's cross-platform UI toolkit, using Dart.",
    rationale:
      'Renders its own widgets rather than wrapping native ones, so the interface looks and behaves identically on both platforms.',
    alternatives: ['React Native', 'native iOS + Android'],
    advantages: [
      'Genuinely consistent UI across platforms',
      'Excellent animation performance',
      'Hot reload makes UI iteration quick',
    ],
    disadvantages: [
      'Dart is another language for the team to learn',
      'Larger app binaries',
      'Text input and accessibility need care to feel platform-native',
    ],
    icon: 'smartphone',
    docsUrl: 'https://flutter.dev',
    tags: ['mobile'],
  },
  {
    slug: 'tailwind',
    name: 'Tailwind CSS',
    category: 'frontend',
    description: 'Utility-first CSS framework.',
    rationale:
      'Styling lives beside the markup it applies to, which removes the naming overhead and the dead-CSS problem that grows with every design system.',
    alternatives: ['CSS Modules', 'styled-components', 'vanilla CSS', 'Sass'],
    advantages: [
      'No inventing class names, and no unused CSS accumulating',
      'Design tokens are enforced by the config rather than by convention',
      'Responsive and dark variants are inline and obvious',
    ],
    disadvantages: [
      'Markup gets visually noisy until you extract components',
      'Real learning curve for the utility vocabulary',
      'Needs discipline to avoid duplicating the same utility stack everywhere',
    ],
    icon: 'palette',
    docsUrl: 'https://tailwindcss.com',
    tags: ['styling', 'web'],
  },
  {
    slug: 'typescript',
    name: 'TypeScript',
    category: 'frontend',
    description: 'Typed JavaScript that compiles away.',
    rationale:
      'Catches the entire class of shape mismatches between frontend and backend at compile time — the errors most likely to reach production in a JavaScript project.',
    alternatives: ['JavaScript with JSDoc', 'Flow'],
    advantages: [
      'Refactoring stops being guesswork',
      'Editor autocomplete becomes genuinely reliable',
      'API payload shapes are enforced rather than assumed',
    ],
    disadvantages: [
      'Build configuration to maintain',
      'Third-party types are occasionally wrong or missing',
      'Generic-heavy code can get hard to read',
    ],
    icon: 'file-code',
    docsUrl: 'https://www.typescriptlang.org/docs',
    tags: ['web', 'api', 'mobile'],
  },

  // ── Backend ───────────────────────────────────────────────────────────────
  {
    slug: 'nodejs',
    name: 'Node.js',
    category: 'backend',
    description: 'JavaScript runtime for server-side code.',
    rationale:
      'One language across frontend and backend, so types, validation rules and utilities are shared rather than reimplemented on each side.',
    alternatives: ['Python', 'Go', 'Java', 'Ruby', 'PHP'],
    advantages: [
      'Shared language and shared types with the frontend',
      'Excellent at I/O-bound work — APIs, sockets, proxying',
      'npm has a package for almost everything',
    ],
    disadvantages: [
      'Single-threaded: CPU-heavy work blocks the event loop and needs workers',
      'Dependency trees get deep quickly, which is a real supply-chain surface',
      'Unhandled promise rejections are easy to introduce',
    ],
    icon: 'hexagon',
    docsUrl: 'https://nodejs.org/docs',
    tags: ['api', 'realtime', 'web'],
  },
  {
    slug: 'express',
    name: 'Express',
    category: 'backend',
    description: 'Minimal, unopinionated Node.js web framework.',
    rationale:
      'Small enough to understand completely in an afternoon, which makes it a good fit when you want the request pipeline to hold no surprises.',
    alternatives: ['Fastify', 'NestJS', 'Hono', 'Koa'],
    advantages: [
      'Tiny API surface — the whole framework fits in your head',
      'Middleware model is simple and composes well',
      'Every question about it has already been answered somewhere',
    ],
    disadvantages: [
      'No structure imposed, so large codebases drift without team discipline',
      'Validation, auth and error handling are all bring-your-own',
      'Slower than Fastify under heavy load',
    ],
    icon: 'route',
    docsUrl: 'https://expressjs.com',
    tags: ['api', 'rest'],
  },
  {
    slug: 'nestjs',
    name: 'NestJS',
    category: 'backend',
    description: 'Opinionated, modular Node.js framework with DI.',
    rationale:
      'Provides the module and dependency-injection structure that Express leaves to you, which keeps a growing API navigable.',
    alternatives: ['Express', 'Fastify', 'Spring Boot'],
    advantages: [
      'Clear, enforced architecture that scales with team size',
      'First-class TypeScript, validation and OpenAPI generation',
      'Testing seams built in via dependency injection',
    ],
    disadvantages: [
      'Considerable boilerplate for small services',
      'Decorator-heavy style is divisive',
      'More concepts to learn before the first endpoint',
    ],
    icon: 'boxes',
    docsUrl: 'https://docs.nestjs.com',
    tags: ['api', 'enterprise'],
  },
  {
    slug: 'django',
    name: 'Django',
    category: 'backend',
    description: 'Batteries-included Python web framework.',
    rationale:
      'The admin interface, ORM, auth and migrations all ship together, which removes weeks of scaffolding from a data-heavy product.',
    alternatives: ['FastAPI', 'Flask', 'Laravel', 'Rails'],
    advantages: [
      'Auto-generated admin is a genuine head start for internal tooling',
      'Migrations and ORM are mature and predictable',
      'Security defaults are sensible out of the box',
    ],
    disadvantages: [
      'Synchronous by default; async support is still partial',
      'Its conventions fight you when your model diverges from them',
      'Heavier than a micro-framework for a small JSON API',
    ],
    icon: 'server',
    docsUrl: 'https://docs.djangoproject.com',
    tags: ['api', 'admin', 'data'],
  },
  {
    slug: 'fastapi',
    name: 'FastAPI',
    category: 'backend',
    description: 'Modern async Python API framework built on type hints.',
    rationale:
      'Derives validation and OpenAPI docs from Python type hints, so the documentation cannot drift away from the implementation.',
    alternatives: ['Django REST Framework', 'Flask', 'Express'],
    advantages: [
      'Interactive API docs generated automatically and always accurate',
      'Async-first, strong throughput for I/O-bound work',
      'Pydantic validation is excellent',
    ],
    disadvantages: [
      'No ORM, admin or auth included — you assemble those',
      'Younger ecosystem than Django',
      'Async database code is easy to get subtly wrong',
    ],
    icon: 'zap',
    docsUrl: 'https://fastapi.tiangolo.com',
    tags: ['api', 'ai', 'ml'],
  },
  {
    slug: 'laravel',
    name: 'Laravel',
    category: 'backend',
    description: 'Full-featured PHP framework.',
    rationale:
      'Queues, scheduling, mail and auth are all first-party, so common product plumbing is configuration rather than integration work.',
    alternatives: ['Symfony', 'Django', 'Rails'],
    advantages: [
      'Extremely productive for CRUD-shaped products',
      'Eloquent ORM and migrations are pleasant to work with',
      'Cheap, universally available hosting',
    ],
    disadvantages: [
      'PHP talent pool is shrinking in some markets',
      '"Magic" via facades makes call paths harder to trace',
      'Less natural for real-time or streaming features',
    ],
    icon: 'server',
    docsUrl: 'https://laravel.com/docs',
    tags: ['api', 'web'],
  },
  {
    slug: 'spring-boot',
    name: 'Spring Boot',
    category: 'backend',
    description: 'Production-grade Java application framework.',
    rationale:
      'The default choice where JVM operational maturity and strict typing matter more than iteration speed — regulated and high-throughput environments especially.',
    alternatives: ['Quarkus', 'Micronaut', 'NestJS', '.NET'],
    advantages: [
      'Exceptional observability, tooling and profiling story',
      'Handles CPU-bound work and real concurrency well',
      'Very strong track record in regulated industries',
    ],
    disadvantages: [
      'Verbose; slowest of these options to a first working endpoint',
      'Heavier memory footprint',
      'Configuration surface is large and occasionally opaque',
    ],
    icon: 'coffee',
    docsUrl: 'https://spring.io/projects/spring-boot',
    tags: ['enterprise', 'fintech', 'api'],
  },

  // ── Database ──────────────────────────────────────────────────────────────
  {
    slug: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    description: 'Relational database with strong guarantees and JSON support.',
    rationale:
      'Real transactions and foreign keys, so money, orders and inventory cannot end up half-written — and JSONB when you genuinely need schemaless fields.',
    alternatives: ['MySQL', 'MongoDB', 'SQLite', 'CockroachDB'],
    advantages: [
      'ACID transactions and enforced referential integrity',
      'JSONB gives document flexibility without giving up relational guarantees',
      'Powerful indexing, window functions, full-text search',
    ],
    disadvantages: [
      'Schema changes on large tables need planning to avoid locking',
      'Connection-heavy workloads need a pooler such as PgBouncer',
      'Horizontal write scaling is real work',
    ],
    icon: 'database',
    docsUrl: 'https://www.postgresql.org/docs',
    tags: ['relational', 'transactions', 'ecommerce', 'fintech'],
  },
  {
    slug: 'mysql',
    name: 'MySQL',
    category: 'database',
    description: 'Widely deployed relational database.',
    rationale:
      'Ubiquitous and well understood, with managed hosting available essentially everywhere.',
    alternatives: ['PostgreSQL', 'MariaDB', 'SQLite'],
    advantages: [
      'Available on every host, with deep operational knowledge in the wild',
      'Very fast for straightforward read-heavy workloads',
      'Replication is mature and well documented',
    ],
    disadvantages: [
      'Weaker support for advanced SQL than Postgres',
      'Historically lax defaults around strict mode and character sets',
      'JSON support is functional but less capable than JSONB',
    ],
    icon: 'database',
    docsUrl: 'https://dev.mysql.com/doc',
    tags: ['relational'],
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    description: 'Document database storing BSON records.',
    rationale:
      'Suits data whose shape varies per record — event payloads, catalogues with wildly different attributes, content blocks.',
    alternatives: ['PostgreSQL JSONB', 'DynamoDB', 'Firestore'],
    advantages: [
      'No migration needed as document shape evolves',
      'Horizontal sharding is a first-class feature',
      'Natural fit for nested, denormalised reads',
    ],
    disadvantages: [
      'No joins — related data means multiple queries or duplication',
      'Cross-document transactions exist but are comparatively costly',
      'Easy to design a schema you regret once reporting needs arrive',
    ],
    icon: 'leaf',
    docsUrl: 'https://www.mongodb.com/docs',
    tags: ['document', 'flexible'],
  },
  {
    slug: 'firebase',
    name: 'Firebase',
    category: 'database',
    description: 'Hosted realtime database, auth and functions from Google.',
    rationale:
      'Removes the backend entirely for early-stage products: auth, storage and realtime sync arrive as one SDK.',
    alternatives: ['Supabase', 'AWS Amplify', 'Appwrite'],
    advantages: [
      'Fastest possible path to a working authenticated app',
      'Realtime sync and offline support come free',
      'No servers to operate',
    ],
    disadvantages: [
      'Query model is limited — no joins, restricted filtering',
      'Costs scale with document reads and can surprise you',
      'Meaningful vendor lock-in; migrating away is a rewrite',
    ],
    icon: 'flame',
    docsUrl: 'https://firebase.google.com/docs',
    tags: ['realtime', 'mobile', 'prototype'],
  },
  {
    slug: 'supabase',
    name: 'Supabase',
    category: 'database',
    description: 'Managed Postgres with auth, storage and realtime.',
    rationale:
      'Firebase-style convenience on top of real Postgres, so you keep SQL and the option to leave.',
    alternatives: ['Firebase', 'Neon', 'PlanetScale', 'self-hosted Postgres'],
    advantages: [
      'It is genuinely Postgres — SQL, joins, extensions all available',
      'Auth, storage, realtime and row-level security included',
      'Generous free tier and an open-source core',
    ],
    disadvantages: [
      'Row-level security policies are powerful and easy to misconfigure',
      'Younger platform than Firebase; some rough edges remain',
      'Connection pooling needs attention in serverless deployments',
    ],
    icon: 'database',
    docsUrl: 'https://supabase.com/docs',
    tags: ['relational', 'realtime', 'prototype', 'auth'],
  },
  {
    slug: 'redis',
    name: 'Redis',
    category: 'database',
    description: 'In-memory data store for caching, sessions and queues.',
    rationale:
      'Absorbs the repeated reads and background job traffic that would otherwise fall on the primary database.',
    alternatives: ['Memcached', 'in-process cache', 'Postgres LISTEN/NOTIFY'],
    advantages: [
      'Sub-millisecond reads take real pressure off the database',
      'Solid primitives for rate limiting, locks and queues',
      'Pub/sub enables realtime fan-out without extra infrastructure',
    ],
    disadvantages: [
      'Memory-bound, so the working set has to fit in RAM',
      'Durability is configurable and weaker than a real database',
      'Another service to run, monitor and secure',
    ],
    icon: 'zap',
    docsUrl: 'https://redis.io/docs',
    tags: ['cache', 'queue', 'realtime'],
  },

  // ── DevOps / hosting ──────────────────────────────────────────────────────
  {
    slug: 'docker',
    name: 'Docker',
    category: 'devops',
    description: 'Container runtime for reproducible environments.',
    rationale:
      'The environment becomes a file in the repository, which ends the gap between a developer machine and production.',
    alternatives: ['Podman', 'Nix', 'plain VMs', 'buildpacks'],
    advantages: [
      'Identical environment locally, in CI and in production',
      'Dependencies like Postgres and Redis start with one command',
      'Accepted as an input by essentially every deployment platform',
    ],
    disadvantages: [
      'Another layer to debug when something breaks',
      'Image sizes grow without deliberate multi-stage builds',
      'File-watching performance on macOS and Windows mounts is poor',
    ],
    icon: 'container',
    docsUrl: 'https://docs.docker.com',
    tags: ['infra', 'ci'],
  },
  {
    slug: 'vercel',
    name: 'Vercel',
    category: 'devops',
    description: 'Frontend hosting with preview deploys and a global edge CDN.',
    rationale:
      'Every pull request gets a working URL, which turns design and QA review into looking at the real thing instead of a screenshot.',
    alternatives: ['Netlify', 'Cloudflare Pages', 'AWS Amplify', 'S3 + CloudFront'],
    advantages: [
      'Preview deployment per branch, with zero configuration',
      'Global CDN and automatic HTTPS',
      'Git-push deploys with instant rollback',
    ],
    disadvantages: [
      'Serverless functions have execution time and size limits',
      'Bandwidth pricing gets expensive at scale',
      'Long-running or stateful processes do not fit the model',
    ],
    icon: 'triangle',
    docsUrl: 'https://vercel.com/docs',
    tags: ['frontend-hosting'],
  },
  {
    slug: 'railway',
    name: 'Railway',
    category: 'devops',
    description: 'Managed hosting for services and databases.',
    rationale:
      'Runs a long-lived API process and a Postgres instance side by side without any infrastructure work — the right level of abstraction before scale forces a rethink.',
    alternatives: ['Render', 'Fly.io', 'Heroku', 'AWS ECS'],
    advantages: [
      'Deploys a normal server process — no serverless constraints',
      'Managed Postgres and Redis one click away',
      'Sensible logs and metrics without setup',
    ],
    disadvantages: [
      'Usage pricing can climb faster than expected',
      'Fewer regions than the large cloud providers',
      'Less control than raw infrastructure when you need tuning',
    ],
    icon: 'train',
    docsUrl: 'https://docs.railway.app',
    tags: ['backend-hosting'],
  },
  {
    slug: 'render',
    name: 'Render',
    category: 'devops',
    description: 'Managed cloud for web services, workers and databases.',
    rationale:
      'Predictable instance-based pricing and native support for background workers and cron, which serverless platforms handle awkwardly.',
    alternatives: ['Railway', 'Fly.io', 'Heroku'],
    advantages: [
      'Background workers and scheduled jobs are first-class',
      'Flat, predictable pricing',
      'Managed Postgres with automated backups',
    ],
    disadvantages: [
      'Free tier services sleep when idle',
      'Cold starts after a deploy are noticeable',
      'Build times are slower than the frontend-focused platforms',
    ],
    icon: 'cloud',
    docsUrl: 'https://render.com/docs',
    tags: ['backend-hosting'],
  },
  {
    slug: 'aws',
    name: 'AWS',
    category: 'devops',
    description: 'Full-spectrum cloud infrastructure provider.',
    rationale:
      'The option that never becomes the limiting factor — worth its complexity once compliance, scale or fine-grained control genuinely demand it.',
    alternatives: ['Google Cloud', 'Azure', 'Hetzner', 'DigitalOcean'],
    advantages: [
      'Every service you could need, in every region',
      'Mature compliance and security tooling',
      'Committed-use discounts materially reduce cost at scale',
    ],
    disadvantages: [
      'Steep operational learning curve; IAM alone is a specialism',
      'Very easy to misconfigure into a large bill or an open bucket',
      'Overkill for an early-stage product',
    ],
    icon: 'cloud',
    docsUrl: 'https://docs.aws.amazon.com',
    tags: ['infra', 'scale', 'enterprise'],
  },
  {
    slug: 'github-actions',
    name: 'GitHub Actions',
    category: 'devops',
    description: 'CI/CD runners built into GitHub.',
    rationale:
      'Tests run where the code already lives, so a red pull request is visible before review rather than after merge.',
    alternatives: ['GitLab CI', 'CircleCI', 'Jenkins'],
    advantages: [
      'No separate CI service to connect or pay for',
      'Large marketplace of ready-made actions',
      'Generous free minutes on public repositories',
    ],
    disadvantages: [
      'YAML debugging is a slow push-and-wait loop',
      'Private-repo minutes are billed and add up',
      'Self-hosted runners need their own security thinking',
    ],
    icon: 'git-branch',
    docsUrl: 'https://docs.github.com/actions',
    tags: ['ci'],
  },

  // ── Other ─────────────────────────────────────────────────────────────────
  {
    slug: 'stripe',
    name: 'Stripe',
    category: 'other',
    description: 'Payments, subscriptions and invoicing API.',
    rationale:
      'Hosted checkout keeps card data entirely off your servers, which removes the hardest part of PCI scope from the project.',
    alternatives: ['PayPal', 'Adyen', 'Paddle', 'Lemon Squeezy'],
    advantages: [
      'Best-documented API in the payments space',
      'Subscriptions, trials, proration and tax handled for you',
      'Test mode mirrors production closely',
    ],
    disadvantages: [
      'Per-transaction fees compound at volume',
      'Webhook handling must be idempotent or you will double-fulfil orders',
      'Not available to merchants in every country',
    ],
    icon: 'credit-card',
    docsUrl: 'https://stripe.com/docs',
    tags: ['payments', 'ecommerce', 'saas', 'subscription'],
  },
  {
    slug: 'typeorm',
    name: 'TypeORM',
    category: 'backend',
    description: 'TypeScript ORM using decorator-defined entities.',
    rationale:
      'Entity classes act as the single definition of the schema, so the database and the application types cannot disagree.',
    alternatives: ['Prisma', 'Drizzle', 'Kysely', 'raw SQL'],
    advantages: [
      'Entities double as documentation of the schema',
      'Migrations can be generated from entity changes',
      'Supports both Postgres and SQLite from one definition',
    ],
    disadvantages: [
      'Complex queries are often clearer written as raw SQL',
      'Lazy relations make it easy to trigger N+1 queries unknowingly',
      'Decorator metadata adds build configuration',
    ],
    icon: 'database',
    docsUrl: 'https://typeorm.io',
    tags: ['orm', 'api'],
  },
  {
    slug: 'prisma',
    name: 'Prisma',
    category: 'backend',
    description: 'Type-safe database client generated from a schema file.',
    rationale:
      'One schema file generates a fully typed client, so an incorrect field name fails at compile time instead of at runtime.',
    alternatives: ['TypeORM', 'Drizzle', 'Kysely'],
    advantages: [
      'Best-in-class type safety and autocomplete',
      'Readable, declarative schema file',
      'Prisma Studio is a genuinely useful data browser',
    ],
    disadvantages: [
      'Generation step must re-run after every schema change',
      'Less control over the exact SQL emitted',
      'Extra cold-start weight in serverless environments',
    ],
    icon: 'triangle',
    docsUrl: 'https://www.prisma.io/docs',
    tags: ['orm', 'api'],
  },
  {
    slug: 'socketio',
    name: 'Socket.IO',
    category: 'backend',
    description: 'Realtime bidirectional events over WebSockets.',
    rationale:
      'Handles reconnection, rooms and transport fallback — the parts of realtime that are tedious to implement correctly by hand.',
    alternatives: ['native WebSockets', 'Pusher', 'Ably', 'server-sent events'],
    advantages: [
      'Automatic reconnection and fallback transports',
      'Rooms and namespaces map neatly onto chats and channels',
      'Mature client libraries across platforms',
    ],
    disadvantages: [
      'Requires sticky sessions or a Redis adapter when horizontally scaled',
      'Heavier than plain WebSockets',
      'Stateful connections complicate serverless deployment',
    ],
    icon: 'radio',
    docsUrl: 'https://socket.io/docs',
    tags: ['realtime', 'chat'],
  },
  {
    slug: 'jwt',
    name: 'JWT Authentication',
    category: 'backend',
    description: 'Signed, self-contained access tokens.',
    rationale:
      'Requests carry their own verifiable identity, so authorisation needs no session lookup on every call.',
    alternatives: ['server sessions', 'OAuth via a provider', 'Auth0', 'Clerk'],
    advantages: [
      'Stateless — scales horizontally with no shared session store',
      'Works uniformly for web, mobile and service-to-service calls',
      'Claims travel with the request',
    ],
    disadvantages: [
      'Cannot be revoked before expiry without a denylist',
      'Storing tokens in localStorage exposes them to XSS — prefer httpOnly cookies',
      'Payloads are signed but readable, so nothing secret goes inside',
    ],
    icon: 'key-round',
    docsUrl: 'https://jwt.io/introduction',
    tags: ['auth'],
  },
  {
    slug: 'cloudinary',
    name: 'Cloudinary',
    category: 'other',
    description: 'Media storage with on-the-fly image transformation.',
    rationale:
      'Resizing, cropping and format negotiation happen at the URL, so the application never processes images itself.',
    alternatives: ['S3 + Lambda', 'imgix', 'Uploadthing', 'Supabase Storage'],
    advantages: [
      'Transformations are URL parameters — no image pipeline to build',
      'Automatic WebP/AVIF negotiation per browser',
      'CDN delivery included',
    ],
    disadvantages: [
      'Bandwidth-based pricing grows with a media-heavy product',
      'Transformation URLs become a coupling to the vendor',
      'Free tier limits arrive quickly with video',
    ],
    icon: 'image',
    docsUrl: 'https://cloudinary.com/documentation',
    tags: ['media', 'images'],
  },
  {
    slug: 'mapbox',
    name: 'Mapbox',
    category: 'other',
    description: 'Maps, geocoding, routing and navigation APIs.',
    rationale:
      'Live tracking needs map rendering, address lookup and route estimation together; getting all three from one vendor avoids stitching coordinate systems.',
    alternatives: ['Google Maps Platform', 'OpenStreetMap + Leaflet', 'HERE'],
    advantages: [
      'Highly customisable map styling',
      'Geocoding, directions and matrix APIs in one place',
      'Strong mobile SDKs for turn-by-turn navigation',
    ],
    disadvantages: [
      'Costs scale per map load and per API request',
      'Address coverage is weaker than Google in some regions',
      'Offline map support requires the paid tiers',
    ],
    icon: 'map',
    docsUrl: 'https://docs.mapbox.com',
    tags: ['maps', 'delivery', 'logistics'],
  },
];

const BY_SLUG = new Map(TECHNOLOGY_CATALOG.map((entry) => [entry.slug, entry]));
const BY_NAME = new Map(
  TECHNOLOGY_CATALOG.map((entry) => [entry.name.toLowerCase(), entry]),
);

/** Case-insensitive lookup by slug or display name. */
export function findTechnology(key: string): CatalogEntry | undefined {
  const needle = key.trim().toLowerCase();
  return BY_SLUG.get(needle) ?? BY_NAME.get(needle);
}

export function technologiesByCategory(category: TechnologyCategory): CatalogEntry[] {
  return TECHNOLOGY_CATALOG.filter((entry) => entry.category === category);
}
