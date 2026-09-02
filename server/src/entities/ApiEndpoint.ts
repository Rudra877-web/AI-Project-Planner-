import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { HttpMethod } from '../types/domain';
import type { Project } from './Project';

/**
 * §9 — one planned REST endpoint.
 *
 * `requestBody`, `parameters` and `responseExample` are stored as JSON so the
 * API Planner can render real example payloads and the documentation generator
 * can emit them verbatim rather than re-deriving them.
 */
@Entity('api_endpoints')
export class ApiEndpoint extends BaseEntity {
  @Column({ type: 'varchar', length: 10 })
  method: HttpMethod;

  @Column({ type: 'varchar', length: 240 })
  path: string;

  @Column({ type: LONGTEXT })
  description: string;

  /** Logical grouping in the UI and generated docs — "Auth", "Orders", … */
  @Column({ type: 'varchar', length: 80, nullable: true })
  group: string | null;

  @Column({ type: 'boolean', default: true })
  requiresAuth: boolean;

  @Column({ type: 'simple-json', nullable: true })
  requestBody: Record<string, unknown> | null;

  /** Path/query parameters: `{ name, in, type, required, description }`. */
  @Column({ type: 'simple-json', nullable: true })
  parameters: Array<Record<string, unknown>> | null;

  @Column({ type: 'simple-json', nullable: true })
  responseExample: Record<string, unknown> | null;

  @Column({ type: 'int', default: 200 })
  successStatus: number;

  /** Table names this endpoint touches — the other half of the connective
   *  tissue that makes impact analysis possible. */
  @Column({ type: 'simple-json', nullable: true })
  relatedTables: string[] | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ ...UUID_COLUMN, nullable: true })
  originChangeId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'apiEndpoints', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
