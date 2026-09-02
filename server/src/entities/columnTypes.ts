import { env } from '../config/env';

/**
 * Portable column types.
 *
 * The entity layer has to be valid on both supported drivers, and the two
 * disagree on spellings: Postgres has no `datetime`, SQLite has neither
 * `timestamp` nor `uuid`. Resolving the differences once here keeps every
 * entity declaration honest about its intent while staying valid on whichever
 * driver is configured.
 *
 * `simple-json` needs no alias — TypeORM implements it as text everywhere.
 */
const isPostgres = env.DB_DRIVER === 'postgres';

export const DATETIME = isPostgres ? 'timestamp' : 'datetime';

/**
 * Foreign-key / explicit id columns. Spread into the decorator options:
 *
 *   @Column({ ...UUID_COLUMN })
 *   userId: string;
 *
 * `@PrimaryGeneratedColumn('uuid')` already adapts itself per driver, so this
 * only exists to keep FK columns the matching type on both.
 */
export const UUID_COLUMN = isPostgres
  ? ({ type: 'uuid' } as const)
  : ({ type: 'varchar', length: 36 } as const);

/** Wide free-text (descriptions, prompts, generated markdown). */
export const LONGTEXT = 'text';
