import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { Project } from './Project';

/**
 * §7 — one screen of the planned application.
 *
 * The four list columns are what make the plan *connected*: a page names the
 * components it needs, the APIs it calls, and the database entities behind it,
 * so the Change Impact Analyzer can trace "this new table affects these pages"
 * without re-running a language model.
 */
@Entity('pages')
export class Page extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  route: string | null;

  @Column({ type: LONGTEXT })
  purpose: string;

  /** UI building blocks the page needs (§7 "Required components"). */
  @Column({ type: 'simple-json', nullable: true })
  components: string[] | null;

  /** What the user can do here (§7 "User actions"). */
  @Column({ type: 'simple-json', nullable: true })
  userActions: string[] | null;

  /** Endpoint signatures this page calls, e.g. `GET /api/products`. */
  @Column({ type: 'simple-json', nullable: true })
  apis: string[] | null;

  /** Database table names this page reads or writes. */
  @Column({ type: 'simple-json', nullable: true })
  entities: string[] | null;

  /** Requires an authenticated session. */
  @Column({ type: 'boolean', default: false })
  isProtected: boolean;

  /** Admin-only screens are grouped separately in the UI. */
  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ ...UUID_COLUMN, nullable: true })
  originChangeId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'pages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
