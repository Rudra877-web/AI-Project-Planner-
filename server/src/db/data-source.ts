import 'reflect-metadata';
import { DataSource, type DataSourceOptions, type LogLevel } from 'typeorm';
import { env } from '../config/env';
import { entities } from '../entities';

/**
 * One DataSource, two drivers.
 *
 * Postgres is the product's stated target (and what `Generate SQL Schema`
 * emits); SQLite is the default so the app installs, seeds, and runs with
 * nothing to provision. Entities stay driver-neutral via the aliases in
 * entities/columnTypes.ts.
 *
 * Schema reconciliation is governed by `env.syncSchema`: on outside production
 * so either driver gives you a working schema immediately, off in production
 * where an automatic ALTER is a data-loss risk.
 */
function buildOptions(): DataSourceOptions {
  const shared = {
    entities,
    // Mutable arrays: TypeORM's LoggerOptions is `LogLevel[]`, so a readonly
    // tuple from `as const` would not assign.
    logging: env.DB_LOGGING ? (['query', 'error'] as LogLevel[]) : (['error'] as LogLevel[]),
    synchronize: env.syncSchema,
  };

  if (env.DB_DRIVER === 'postgres') {
    return {
      ...shared,
      type: 'postgres',
      url: env.DATABASE_URL,
      ssl: env.PGSSL ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    ...shared,
    type: 'better-sqlite3',
    database: env.sqliteFile,
  };
}

export const AppDataSource = new DataSource(buildOptions());

let initialising: Promise<DataSource> | null = null;

/**
 * Idempotent initialisation. Both the HTTP server and the seed script call
 * this, and the seed script may be invoked while the dev server is running.
 */
export async function initialiseDatabase(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return AppDataSource;
  if (!initialising) {
    initialising = AppDataSource.initialize().catch((error) => {
      initialising = null;
      throw error;
    });
  }
  return initialising;
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  initialising = null;
}

/** Human-readable description of the active connection, for the boot banner. */
export function describeConnection(): string {
  if (env.DB_DRIVER === 'postgres') {
    // Never print credentials.
    try {
      const url = new URL(env.DATABASE_URL!);
      return `postgres ${url.host}${url.pathname}`;
    } catch {
      return 'postgres';
    }
  }
  return `sqlite ${env.sqliteFile}`;
}
