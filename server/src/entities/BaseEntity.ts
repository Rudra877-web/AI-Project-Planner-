import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Shared identity + timestamps for every BuildFlow table (§21 requires
 * timestamps throughout).
 *
 * UUID primary keys keep ids opaque in URLs, which matters because project
 * ids are user-visible in the workspace routes.
 *
 * `@CreateDateColumn`/`@UpdateDateColumn` are intentionally left untyped —
 * TypeORM resolves them to `timestamp` on Postgres and `datetime` on SQLite,
 * which is exactly the portability we want.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
