import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Loads `server/.env` regardless of the cwd the process was started from,
 * so `npm run dev` from the repo root behaves the same as running from
 * inside `server/`.
 */
const SERVER_ROOT = path.resolve(__dirname, '..', '..');
const envPath = path.join(SERVER_ROOT, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const DEFAULT_JWT_SECRET = 'dev-only-insecure-secret-change-me';

const bool = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return fallback;
      return ['1', 'true', 'yes', 'on'].includes(v.trim().toLowerCase());
    });

const int = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return fallback;
      const n = Number.parseInt(v, 10);
      return Number.isFinite(n) ? n : fallback;
    });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: int(4000),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  DB_DRIVER: z.enum(['sqlite', 'postgres']).default('sqlite'),
  SQLITE_PATH: z.string().default('buildflow.db'),
  DATABASE_URL: z.string().optional(),
  PGSSL: bool(false),
  DB_LOGGING: bool(false),
  /** Empty means "decide from NODE_ENV" — see `syncSchema` below. */
  DB_SYNC: z.string().optional(),

  JWT_SECRET: z.string().default(DEFAULT_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: int(12),

  ANTHROPIC_API_KEY: z.string().optional(),
  AI_PLANNING_MODEL: z.string().default('claude-opus-5'),
  AI_CHAT_MODEL: z.string().default('claude-sonnet-5'),
  AI_FORCE_OFFLINE: bool(false),

  RATE_LIMIT_WINDOW_MS: int(15 * 60 * 1000),
  RATE_LIMIT_MAX: int(600),
  AI_RATE_LIMIT_WINDOW_MS: int(60 * 1000),
  AI_RATE_LIMIT_MAX: int(15),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Fail loudly and readably rather than dying on an undefined deep in a driver.
  console.error('\n✖ Invalid environment configuration:\n');
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  console.error('\nSee server/.env.example for the expected shape.\n');
  process.exit(1);
}

const raw = parsed.data;

const isProduction = raw.NODE_ENV === 'production';

if (isProduction && raw.JWT_SECRET === DEFAULT_JWT_SECRET) {
  console.error(
    '\n✖ JWT_SECRET is still the development default while NODE_ENV=production.\n' +
      '  Set a strong, unique JWT_SECRET before deploying.\n',
  );
  process.exit(1);
}

if (raw.DB_DRIVER === 'postgres' && !raw.DATABASE_URL) {
  console.error(
    '\n✖ DB_DRIVER=postgres requires DATABASE_URL.\n' +
      '  Either set it, or use DB_DRIVER=sqlite for zero-config local development.\n',
  );
  process.exit(1);
}

/** Absolute path to the SQLite file, resolved against the server workspace root. */
const sqliteFile = path.isAbsolute(raw.SQLITE_PATH)
  ? raw.SQLITE_PATH
  : path.join(SERVER_ROOT, raw.SQLITE_PATH);

/**
 * Whether TypeORM should reconcile the schema against the entities on boot.
 *
 * Defaults to on outside production so both drivers give you a working schema
 * with zero setup, and hard-off in production where an automatic `ALTER` is a
 * data-loss risk. `DB_SYNC` overrides the default in either direction.
 */
const syncSchema = (() => {
  const explicit = raw.DB_SYNC?.trim().toLowerCase();
  if (explicit) return ['1', 'true', 'yes', 'on'].includes(explicit);
  return !isProduction;
})();

if (isProduction && syncSchema) {
  console.warn(
    '⚠ DB_SYNC is enabled while NODE_ENV=production. TypeORM will alter the\n' +
      '  live schema on boot. Prefer generated SQL or migrations in production.',
  );
}

export const env = {
  ...raw,
  isProduction,
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  serverRoot: SERVER_ROOT,
  sqliteFile,
  syncSchema,
  /**
   * True when live Claude calls are possible. When false the AI layer falls
   * back to the built-in offline planning engine — see services/ai/provider.ts.
   */
  aiEnabled: Boolean(raw.ANTHROPIC_API_KEY) && !raw.AI_FORCE_OFFLINE,
} as const;

export type Env = typeof env;
